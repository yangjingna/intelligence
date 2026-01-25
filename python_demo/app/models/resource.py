from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Enum, Date
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class ResourceType(str, enum.Enum):
    PROJECT = "project"
    INTERNSHIP = "internship"
    RESEARCH = "research"
    COOPERATION = "cooperation"


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    type = Column(Enum(ResourceType), nullable=False)
    description = Column(Text)
    requirements = Column(Text)
    tags = Column(JSON)
    deadline = Column(Date)

    # Contact info
    contact_name = Column(String(100))
    contact_email = Column(String(255))
    contact_phone = Column(String(20))

    # Relations
    publisher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String(200))

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
