from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class BarrierStatus(str, enum.Enum):
    OPEN = "open"
    SOLVED = "solved"
    CANCELLED = "cancelled"


class BarrierDifficulty(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class TechnicalBarrier(Base):
    __tablename__ = "technical_barriers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    technical_area = Column(String(100))
    challenge = Column(Text)
    impact = Column(Text)
    current_solution = Column(Text)
    desired_solution = Column(Text)
    investment = Column(Float)
    timeline = Column(String(50))
    category = Column(String(100))
    tags = Column(JSON)
    difficulty = Column(Enum(BarrierDifficulty), default=BarrierDifficulty.MEDIUM)
    status = Column(Enum(BarrierStatus), default=BarrierStatus.OPEN)
    enterprise_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enterprise_name = Column(String(200))
    view_count = Column(Integer, default=0)
    solution_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    enterprise = relationship("User", foreign_keys=[enterprise_id])
