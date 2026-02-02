from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AchievementStatus(str):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ResearchAchievementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    research_area: Optional[str] = None
    application_field: Optional[str] = None
    innovation_points: Optional[str] = None
    technical_indicators: Optional[str] = None
    market_potential: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: str = AchievementStatus.DRAFT


class ResearchAchievementCreate(ResearchAchievementBase):
    pass


class ResearchAchievementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    research_area: Optional[str] = None
    application_field: Optional[str] = None
    innovation_points: Optional[str] = None
    technical_indicators: Optional[str] = None
    market_potential: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class ResearchAchievementResponse(ResearchAchievementBase):
    id: int
    university_id: int
    university_name: Optional[str] = None
    view_count: int
    inquiry_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
