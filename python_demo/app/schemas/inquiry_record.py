from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InquiryStatus(str):
    PENDING = "pending"
    RESPONDED = "responded"
    RESOLVED = "resolved"
    CLOSED = "closed"


class InquiryRecordBase(BaseModel):
    inquiry_type: Optional[str] = None
    target_id: Optional[int] = None
    subject: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    status: str = InquiryStatus.PENDING


class InquiryRecordCreate(InquiryRecordBase):
    target_user_id: int


class InquiryRecordUpdate(BaseModel):
    response: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = None


class InquiryRecordResponse(InquiryRecordBase):
    id: int
    inquirer_id: int
    inquirer_name: Optional[str] = None
    inquirer_role: Optional[str] = None
    target_user_id: int
    response: Optional[str] = None
    responded_at: Optional[datetime] = None
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
