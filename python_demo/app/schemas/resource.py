from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


class ResourceBase(BaseModel):
    title: str
    type: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    tags: Optional[List[str]] = None
    deadline: Optional[date] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    tags: Optional[List[str]] = None
    deadline: Optional[date] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class ResourceResponse(ResourceBase):
    id: int
    publisher_id: int
    company: Optional[str] = None
    contact_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
