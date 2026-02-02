from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class DemandStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DemandPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ResearchDemand(Base):
    __tablename__ = "research_demands"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    research_area = Column(String(100))
    technical_requirements = Column(Text)
    expected_outcome = Column(Text)
    budget = Column(Float)
    duration = Column(String(50))
    category = Column(String(100))
    tags = Column(JSON)
    priority = Column(Enum(DemandPriority), default=DemandPriority.MEDIUM)
    status = Column(Enum(DemandStatus), default=DemandStatus.OPEN)
    enterprise_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enterprise_name = Column(String(200))
    view_count = Column(Integer, default=0)
    inquiry_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    enterprise = relationship("User", foreign_keys=[enterprise_id])
