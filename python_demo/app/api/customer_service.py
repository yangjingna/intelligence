from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user, get_current_user_optional
from ..models.user import User
from ..models.customer_service import CustomerServiceMessage
from ..schemas.customer_service import CustomerServiceRequest, CustomerServiceResponse, CustomerServiceHistoryItem
from ..services.ai_service import ai_service
from ..services.customer_service_memory import customer_service_memory

router = APIRouter()


@router.post("/chat", response_model=CustomerServiceResponse)
async def chat_with_ai(
    request: CustomerServiceRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """智能客服聊天接口 - 带上下文管理和RAG增强"""

    # 保存用户消息到数据库（长期备份）
    user_msg = CustomerServiceMessage(
        user_id=current_user.id if current_user else None,
        content=request.message,
        is_user=True
    )
    db.add(user_msg)

    if current_user:
        # 登录用户：使用完整的上下文管理（Redis短期记忆 + SQL RAG长期记忆）
        ai_response = await ai_service.get_customer_service_response_with_rag(
            message=request.message,
            user_id=current_user.id,
            category=None  # 可以根据问题自动分类
        )

        # 刷新上下文TTL
        customer_service_memory.refresh_ttl(current_user.id)

        # 同时保存到数据库长期记忆表
        customer_service_memory.save_message_to_db(
            user_id=current_user.id,
            role="user",
            content=request.message
        )
        customer_service_memory.save_message_to_db(
            user_id=current_user.id,
            role="assistant",
            content=ai_response
        )
    else:
        # 未登录用户：使用简单的历史记录上下文
        recent_messages = db.query(CustomerServiceMessage).filter(
            CustomerServiceMessage.user_id == None
        ).order_by(CustomerServiceMessage.created_at.desc()).limit(6).all()

        chat_history = [
            {"role": "user" if msg.is_user else "assistant", "content": msg.content}
            for msg in reversed(recent_messages)
        ]

        ai_response = await ai_service.get_customer_service_response(request.message, chat_history)

    # 保存AI响应到数据库
    ai_msg = CustomerServiceMessage(
        user_id=current_user.id if current_user else None,
        content=ai_response,
        is_user=False
    )
    db.add(ai_msg)
    db.commit()

    return CustomerServiceResponse(reply=ai_response)


@router.get("/history", response_model=List[CustomerServiceHistoryItem])
async def get_history(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """获取客服对话历史"""
    if not current_user:
        return []

    messages = db.query(CustomerServiceMessage).filter(
        CustomerServiceMessage.user_id == current_user.id
    ).order_by(CustomerServiceMessage.created_at.asc()).limit(100).all()

    return [CustomerServiceHistoryItem.model_validate(msg) for msg in messages]


@router.delete("/history")
async def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """清除客服对话历史（包括Redis短期记忆）"""
    # 清除Redis短期记忆
    customer_service_memory.clear_short_term(current_user.id)

    # 清除数据库历史记录
    db.query(CustomerServiceMessage).filter(
        CustomerServiceMessage.user_id == current_user.id
    ).delete()
    db.commit()

    return {"message": "对话历史已清除"}


@router.get("/context-status")
async def get_context_status(
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的上下文状态（用于调试）"""
    short_term = customer_service_memory.get_short_term_context(current_user.id)

    return {
        "user_id": current_user.id,
        "short_term_messages": len(short_term),
        "short_term_preview": short_term[-3:] if short_term else []
    }
