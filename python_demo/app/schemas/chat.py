from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    target_user_id: int
    job_id: Optional[int] = None
    resource_id: Optional[int] = None


class GetOrCreateConversation(BaseModel):
    targetUserId: int
    jobId: Optional[int] = None


class ConversationResponse(BaseModel):
    id: int
    target_user_id: int
    target_user_name: Optional[str] = None
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True
