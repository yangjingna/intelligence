from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DynamicType(str):
    DEMAND_PUBLISHED = "demand_published"
    BARRIER_PUBLISHED = "barrier_published"
    ACHIEVEMENT_PUBLISHED = "achievement_published"
    PROJECT_SIGNED = "project_signed"
    PROJECT_COMPLETED = "project_completed"
    BARRIER_SOLVED = "barrier_solved"


class InnovationDynamicsBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    dynamic_type: str
    related_id: Optional[int] = None
    region: Optional[str] = None
    keywords: Optional[List[str]] = None


class InnovationDynamicsCreate(InnovationDynamicsBase):
    pass


class InnovationDynamicsUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    region: Optional[str] = None
    keywords: Optional[List[str]] = None


class InnovationDynamicsResponse(InnovationDynamicsBase):
    id: int
    view_count: int
    like_count: int
    share_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class InnovationStatsResponse(BaseModel):
    total_demands: int
    total_barriers: int
    total_achievements: int
    total_projects: int
    solved_barriers: int
    completed_projects: int
