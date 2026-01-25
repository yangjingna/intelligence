from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.job import Job
from ..models.conversation import Conversation, Message, MessageType
from ..schemas.chat import ConversationResponse, MessageCreate, MessageResponse, GetOrCreateConversation
from ..services.websocket_manager import ws_manager
from ..services.ai_service import ai_service

router = APIRouter()


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(Conversation).filter(
        (Conversation.user1_id == current_user.id) |
        (Conversation.user2_id == current_user.id)
    ).order_by(Conversation.last_message_time.desc()).all()

    result = []
    for conv in conversations:
        target_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        target_user = db.query(User).filter(User.id == target_user_id).first()

        job_title = None
        if conv.job_id:
            job = db.query(Job).filter(Job.id == conv.job_id).first()
            job_title = job.title if job else None

        # Count unread messages
        unread_count = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id
        ).count()

        result.append(ConversationResponse(
            id=conv.id,
            target_user_id=target_user_id,
            target_user_name=target_user.name if target_user else None,
            job_id=conv.job_id,
            job_title=job_title,
            last_message=conv.last_message,
            last_message_time=conv.last_message_time,
            unread_count=unread_count
        ))

    return result


@router.post("/conversations/get-or-create", response_model=ConversationResponse)
async def get_or_create_conversation(
    data: GetOrCreateConversation,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if conversation exists
    conv = db.query(Conversation).filter(
        (
            ((Conversation.user1_id == current_user.id) & (Conversation.user2_id == data.targetUserId)) |
            ((Conversation.user1_id == data.targetUserId) & (Conversation.user2_id == current_user.id))
        ),
        Conversation.job_id == data.jobId
    ).first()

    if not conv:
        conv = Conversation(
            user1_id=current_user.id,
            user2_id=data.targetUserId,
            job_id=data.jobId
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    target_user = db.query(User).filter(User.id == data.targetUserId).first()

    job_title = None
    target_user_name = "HR"  # Default name if user doesn't exist
    if conv.job_id:
        job = db.query(Job).filter(Job.id == conv.job_id).first()
        if job:
            job_title = job.title
            # Use job's hr_name if target user doesn't exist
            if not target_user and hasattr(job, 'hr_name'):
                target_user_name = job.hr_name

    if target_user:
        target_user_name = target_user.name

    return ConversationResponse(
        id=conv.id,
        target_user_id=data.targetUserId,
        target_user_name=target_user_name,
        job_id=conv.job_id,
        job_title=job_title,
        last_message=conv.last_message,
        last_message_time=conv.last_message_time,
        unread_count=0
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")

    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    return [MessageResponse.model_validate(msg) for msg in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")

    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        type=MessageType.TEXT
    )
    db.add(message)

    # Update conversation
    conv.last_message = message_data.content[:100]
    conv.last_message_time = datetime.utcnow()

    db.commit()
    db.refresh(message)

    # Send via WebSocket
    target_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id

    ws_message = {
        "type": "new_message",
        "payload": MessageResponse.model_validate(message).model_dump()
    }
    ws_message["payload"]["created_at"] = ws_message["payload"]["created_at"].isoformat()
    await ws_manager.send_message(target_user_id, ws_message)

    # Check if target user exists in database
    target_user = db.query(User).filter(User.id == target_user_id).first()

    # Send AI response if target user doesn't exist or is offline
    if not target_user or not ws_manager.is_user_online(target_user_id):
        # Get context for AI
        context = ""
        if conv.job_id:
            job = db.query(Job).filter(Job.id == conv.job_id).first()
            if job:
                context = f"岗位: {job.title}, 公司: {job.company}, 薪资: {job.salary if hasattr(job, 'salary') else '面议'}, 地点: {job.location if hasattr(job, 'location') else '未知'}, 描述: {job.description}"

        # Get AI response
        ai_response = await ai_service.get_chat_response(message_data.content, context)

        # Save AI message
        ai_message = Message(
            conversation_id=conversation_id,
            sender_id=target_user_id,
            content=ai_response,
            type=MessageType.AI_RESPONSE
        )
        db.add(ai_message)
        conv.last_message = ai_response[:100]
        conv.last_message_time = datetime.utcnow()
        db.commit()
        db.refresh(ai_message)

        # Send AI message to user via WebSocket
        ai_ws_message = {
            "type": "new_message",
            "payload": MessageResponse.model_validate(ai_message).model_dump()
        }
        ai_ws_message["payload"]["created_at"] = ai_ws_message["payload"]["created_at"].isoformat()
        await ws_manager.send_message(current_user.id, ai_ws_message)

    return MessageResponse.model_validate(message)
