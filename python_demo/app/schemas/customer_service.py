from pydantic import BaseModel
from datetime import datetime


class CustomerServiceRequest(BaseModel):
    message: str


class CustomerServiceResponse(BaseModel):
    reply: str


class CustomerServiceHistoryItem(BaseModel):
    id: int
    content: str
    is_user: bool
    created_at: datetime

    class Config:
        from_attributes = True
