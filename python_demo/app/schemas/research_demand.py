from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DemandPriority(str):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DemandStatus(str):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ResearchDemandBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    research_area: Optional[str] = None
    technical_requirements: Optional[str] = None
    expected_outcome: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    duration: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    priority: str = DemandPriority.MEDIUM


class ResearchDemandCreate(ResearchDemandBase):
    pass


class ResearchDemandUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    research_area: Optional[str] = None
    technical_requirements: Optional[str] = None
    expected_outcome: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    duration: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class ResearchDemandResponse(ResearchDemandBase):
    id: int
    status: str
    enterprise_id: int
    enterprise_name: Optional[str] = None
    view_count: int
    inquiry_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
