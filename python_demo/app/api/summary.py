# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.conversation import Conversation, Message
from ..models.job import Job
from ..schemas.summary import ConversationSummaryResponse
from ..services.summary_service import summary_service

router = APIRouter()


@router.get("/conversations/{conversation_id}", response_model=ConversationSummaryResponse)
async def get_conversation_summary(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取会话的智能总结"""
    # 验证会话存在且用户有权限
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")

    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    # 获取会话消息
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    if not messages:
        return ConversationSummaryResponse(
            conversation_id=conversation_id,
            summary="暂无对话记录",
            key_points=[],
            user_interests=[],
            suggested_actions=[]
        )

    # 获取岗位信息
    job_title = None
    if conv.job_id:
        job = db.query(Job).filter(Job.id == conv.job_id).first()
        if job:
            job_title = job.title

    # 确定 HR 和学生
    hr_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
    hr_user = db.query(User).filter(User.id == hr_id).first()
    hr_name = hr_user.name if hr_user else None
    student_name = current_user.name if current_user.user_type == "student" else None

    # 格式化消息
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "content": msg.content,
            "sender_id": msg.sender_id,
            "type": msg.type.value if hasattr(msg.type, 'value') else str(msg.type),
            "is_hr": msg.sender_id == hr_id
        })

    # 调用总结服务
    summary_result = await summary_service.summarize_conversation(
        messages=formatted_messages,
        job_title=job_title,
        student_name=student_name,
        hr_name=hr_name
    )

    return ConversationSummaryResponse(
        conversation_id=conversation_id,
        summary=summary_result.get("summary", ""),
        key_points=summary_result.get("key_points", []),
        user_interests=summary_result.get("user_interests", []),
        suggested_actions=summary_result.get("suggested_actions", [])
    )
