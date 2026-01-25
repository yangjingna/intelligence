from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class JobBase(BaseModel):
    title: str
    salary: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    tags: Optional[List[str]] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class JobResponse(JobBase):
    id: int
    hr_id: int
    hr_name: Optional[str] = None
    hr_online: bool = False
    company: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
