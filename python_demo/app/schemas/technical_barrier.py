from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BarrierDifficulty(str):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class BarrierStatus(str):
    OPEN = "open"
    SOLVED = "solved"
    CANCELLED = "cancelled"


class TechnicalBarrierBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    technical_area: Optional[str] = None
    challenge: Optional[str] = None
    impact: Optional[str] = None
    current_solution: Optional[str] = None
    desired_solution: Optional[str] = None
    investment: Optional[float] = Field(None, ge=0)
    timeline: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    difficulty: str = BarrierDifficulty.MEDIUM


class TechnicalBarrierCreate(TechnicalBarrierBase):
    pass


class TechnicalBarrierUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    technical_area: Optional[str] = None
    challenge: Optional[str] = None
    impact: Optional[str] = None
    current_solution: Optional[str] = None
    desired_solution: Optional[str] = None
    investment: Optional[float] = Field(None, ge=0)
    timeline: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    difficulty: Optional[str] = None
    status: Optional[str] = None


class TechnicalBarrierResponse(TechnicalBarrierBase):
    id: int
    status: str
    enterprise_id: int
    enterprise_name: Optional[str] = None
    view_count: int
    solution_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
