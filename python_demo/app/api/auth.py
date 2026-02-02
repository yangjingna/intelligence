from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..core.security import get_password_hash, verify_password, create_access_token, get_current_user
from ..models.user import User, UserRole
from ..schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, AuthResponse

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    try:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被注册"
            )

        user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            name=user_data.name,
            phone=user_data.phone,
            role=user_data.role,
            # Student fields
            school=user_data.school,
            major=user_data.major,
            # Enterprise fields
            company=user_data.company,
            position=user_data.position,
            # University fields
            university=user_data.university,
            college=user_data.college,
            research_field=user_data.research_field,
            title=user_data.title,
            # Government fields
            government=user_data.government,
            region=user_data.region,
            department=user_data.department
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token({"sub": str(user.id)})

        return AuthResponse(
            user=UserResponse.model_validate(user),
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"注册错误: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用"
        )

    token = create_access_token({"sub": str(user.id)})

    return AuthResponse(
        user=UserResponse.model_validate(user),
            token=token
        )

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = user_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)
