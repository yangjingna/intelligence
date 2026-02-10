from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class UserRole(str, enum.Enum):
    student = "student"
    enterprise = "enterprise"
    university = "university"
    government = "government"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(String(20), nullable=False)

    school = Column(String(200))
    major = Column(String(100))
    graduation_year = Column(String(10))
    bio = Column(String(1000))

    company = Column(String(200))
    position = Column(String(100))
    department = Column(String(100))
    company_description = Column(String(2000))

    university = Column(String(200))
    college = Column(String(100))
    research_field = Column(String(100))
    title = Column(String(50))

    government = Column(String(200))
    region = Column(String(100))

    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_active = Column(DateTime)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
