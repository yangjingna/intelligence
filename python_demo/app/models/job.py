from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class JobStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    salary = Column(String(50))
    location = Column(String(100))
    experience = Column(String(50))
    education = Column(String(50))
    description = Column(Text)
    requirements = Column(Text)
    tags = Column(JSON)
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE)

    # Relations
    hr_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String(200))

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
