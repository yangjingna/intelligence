from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user, get_current_user_optional
from ..models.user import User
from ..models.customer_service import CustomerServiceMessage
from ..schemas.customer_service import CustomerServiceRequest, CustomerServiceResponse, CustomerServiceHistoryItem
from ..services.ai_service import ai_service

router = APIRouter()


@router.post("/chat", response_model=CustomerServiceResponse)
async def chat_with_ai(
    request: CustomerServiceRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Get recent chat history for context (last 10 messages)
    chat_history = []
    if current_user:
        recent_messages = db.query(CustomerServiceMessage).filter(
            CustomerServiceMessage.user_id == current_user.id
        ).order_by(CustomerServiceMessage.created_at.desc()).limit(10).all()

        # Reverse to get chronological order
        recent_messages = list(reversed(recent_messages))
        chat_history = [
            {"role": "user" if msg.is_user else "assistant", "content": msg.content}
            for msg in recent_messages
        ]

    # Save user message
    user_msg = CustomerServiceMessage(
        user_id=current_user.id if current_user else None,
        content=request.message,
        is_user=True
    )
    db.add(user_msg)

    # Get AI response with context
    ai_response = await ai_service.get_customer_service_response(request.message, chat_history)

    # Save AI response
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
    if not current_user:
        return []

    messages = db.query(CustomerServiceMessage).filter(
        CustomerServiceMessage.user_id == current_user.id
    ).order_by(CustomerServiceMessage.created_at.asc()).limit(100).all()

    return [CustomerServiceHistoryItem.model_validate(msg) for msg in messages]
