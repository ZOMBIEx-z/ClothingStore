# main.py

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware # Импорт middleware

from .schemas import Store, StoreCreate
from .database import engine
from .routers import users, stores, orders
from . import models


# Создаем таблицы в БД (если их нет)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Агрегатор Магазинов Одежды")

origins = [
    "http://localhost:3000",  # Разрешаем запросы с вашего React-фронтенда
    "http://127.0.0.1:3000",  # На всякий случай
    # Добавьте другие фронтенд-домены, если используете
]

allowed_headers = [
    "Authorization",       # Обязательно для JWT-токенов
    "Content-Type",        # Обязательно для JSON-данных
    "Accept",
    "Accept-Language",
    "Content-Language",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы, включая OPTIONS, GET, POST, и т.д.
    allow_headers=allowed_headers, # <--- ИСПОЛЬЗУЕМ ЯВНЫЙ СПИСОК
)

# Подключение роутеров
app.include_router(users.router)
app.include_router(stores.router)
app.include_router(orders.router)

# Добавим заглушку для магазинов (для проверки функционала после аутентификации)
@app.get("/stores/secret")
def read_secret_stores(current_user: models.User = Depends(users.get_current_user)):
    """Пример защищенного эндпоинта. Доступен только аутентифицированным."""
    return {"message": f"Hello {current_user.username} ({current_user.role.name}), you can see the stores now."}

@app.get("/")
def read_root():
    """Проверка доступности API."""
    return {"message": "API работает успешно. Перейдите на /docs для просмотра документации."}


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)