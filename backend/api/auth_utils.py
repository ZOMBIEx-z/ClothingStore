from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload

from .models import User, UserRole
from .database import get_db

# Настройки безопасности
SECRET_KEY = "YOUR_SUPER_SECRET_KEY"  # В продакшене брать из env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
BCRYPT_MAX_LENGTH = 72

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Схема OAuth2 для передачи токена
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")


# --- Функции хеширования пароля ---

def get_password_hash(password: str) -> str:
    # 1. Обрезаем пароль до 72 байт, чтобы избежать ошибки ValueError
    # Это гарантирует, что даже очень длинный ввод не сломает хеширование.
    # Если пароль слишком длинный, это может быть признаком атаки, но мы обеспечиваем стабильность:
    truncated_password = password[:BCRYPT_MAX_LENGTH]

    # 2. Выполняем хеширование
    return pwd_context.hash(truncated_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие пароля хешу."""
    return pwd_context.verify(plain_password, hashed_password)


# --- Функции работы с JWT ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает JWT токен."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "sub": str(data["id"])})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """Декодирует JWT токен, возвращает пейлоад."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# --- Dependency для получения текущего пользователя ---

def get_current_user(
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
) -> User:
    """Извлекает пользователя из токена."""

    # 1. Декодируем токен
    payload = decode_access_token(token)
    user_id: Optional[int] = payload.get("id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    # 2. Ищем пользователя в БД
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user