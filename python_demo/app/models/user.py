from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class UserRole(str, enum.Enum):
    STUDENT = "student"
    ENTERPRISE = "enterprise"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False)

    # Student fields
    school = Column(String(200))
    major = Column(String(100))
    graduation_year = Column(String(10))
    bio = Column(String(1000))

    # Enterprise fields
    company = Column(String(200))
    position = Column(String(100))
    department = Column(String(100))
    company_description = Column(String(2000))

    # Status
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_active = Column(DateTime)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
