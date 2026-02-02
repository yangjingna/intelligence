from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProjectStatus(str):
    PENDING = "pending"
    SIGNED = "signed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CooperationProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    demand_id: Optional[int] = None
    barrier_id: Optional[int] = None
    achievement_id: Optional[int] = None
    project_type: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    duration: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = ProjectStatus.PENDING
    notes: Optional[str] = None


class CooperationProjectCreate(CooperationProjectBase):
    enterprise_id: Optional[int] = None
    university_id: Optional[int] = None


class CooperationProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    demand_id: Optional[int] = None
    barrier_id: Optional[int] = None
    achievement_id: Optional[int] = None
    project_type: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    duration: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CooperationProjectResponse(CooperationProjectBase):
    id: int
    enterprise_id: Optional[int] = None
    enterprise_name: Optional[str] = None
    university_id: Optional[int] = None
    university_name: Optional[str] = None
    milestone_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
