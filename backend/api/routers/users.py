from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas, models
from ..auth_utils import get_password_hash, verify_password, create_access_token, get_current_user
from datetime import timedelta

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# Время жизни токена
ACCESS_TOKEN_EXPIRE_MINUTES = 30


@router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя (покупателя или продавца)."""

    # 1. Проверка на существование пользователя
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # 2. Хеширование пароля
    hashed_password = get_password_hash(user.password)

    # 3. Создание пользователя
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """Вход и выдача JWT токена."""

    # 1. Поиск пользователя
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # 2. Проверка пароля
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # 3. Генерация токена
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"id": user.id, "role": user.role.value},  # Включаем id и role в токен
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "role": user.role}


@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Получение данных текущего аутентифицированного пользователя."""
    return current_user