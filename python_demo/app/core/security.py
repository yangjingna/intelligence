from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from ..models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


def verify_password(plain_password: str, stored_password: str) -> bool:
    # 明文密码比较
    return plain_password == stored_password


def get_password_hash(password: str) -> str:
    # 直接返回明文密码（不加密）
    return password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"[AUTH] Token解码成功: {payload}")
        return payload
    except JWTError as e:
        print(f"[AUTH] Token解码失败: {e}")
        return None


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    print(f"[AUTH] get_current_user_optional - token存在: {token is not None}")
    if not token:
        print("[AUTH] 没有提供token")
        return None

    payload = decode_token(token)
    if payload is None:
        print("[AUTH] token解析失败")
        return None

    user_id_str = payload.get("sub")
    if user_id_str is None:
        print("[AUTH] token中没有sub字段")
        return None

    # sub 是字符串，需要转换为整数
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        print(f"[AUTH] user_id转换失败: {user_id_str}")
        return None

    user = db.query(User).filter(User.id == user_id).first()
    print(f"[AUTH] 用户查询结果: {user.id if user else None}")
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    print(f"[AUTH] get_current_user - token前30字符: {token[:30] if token else 'None'}...")

    payload = decode_token(token)
    if payload is None:
        print("[AUTH] payload为None，token解码失败")
        raise credentials_exception

    user_id_str = payload.get("sub")
    print(f"[AUTH] user_id from token: {user_id_str}, type: {type(user_id_str)}")

    if user_id_str is None:
        print("[AUTH] user_id为None")
        raise credentials_exception

    # sub 是字符串，需要转换为整数
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        print(f"[AUTH] user_id转换失败: {user_id_str}")
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    print(f"[AUTH] 数据库查询用户: {user.id if user else None}, role: {user.role if user else None}")

    if user is None:
        print("[AUTH] 用户不存在")
        raise credentials_exception

    return user
