from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str


class UserCreate(UserBase):
    password: str
    # Student fields
    school: Optional[str] = None
    major: Optional[str] = None
    # Enterprise fields
    company: Optional[str] = None
    position: Optional[str] = None
    # University fields
    university: Optional[str] = None
    college: Optional[str] = None
    research_field: Optional[str] = None
    title: Optional[str] = None
    # Government fields
    government: Optional[str] = None
    region: Optional[str] = None
    department: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    school: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    company_description: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    school: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    company_description: Optional[str] = None
    is_online: bool = False
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
