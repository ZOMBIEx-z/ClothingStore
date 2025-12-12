# schemas.py
from datetime import datetime

from pydantic import BaseModel, Field
from enum import Enum as PyEnum
from typing import List

# Роли
class Role(str, PyEnum):
    BUYER = "BUYER"
    SELLER = "SELLER"


# 1. Схемы для пользователя
class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    role: Role = Role.BUYER


class User(UserBase):
    id: int
    role: Role

    class Config:
        from_attributes = True


# 2. Схемы для аутентификации
class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role


# ... (Предыдущие схемы для User и Token) ...

# 4. Схемы для Товара
class ProductBase(BaseModel):
    name: str
    description: str
    price: float


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int
    store_id: int

    class Config:
        from_attributes = True


# 5. Схемы для Магазина
class StoreBase(BaseModel):
    name: str


class StoreCreate(StoreBase):
    pass


class Store(StoreBase):
    id: int
    seller_id: int

    # products: list[Product] = [] # Можно добавить, если хотим видеть товары при запросе магазина

    class Config:
        from_attributes = True


# ... (Предыдущие схемы для User, Store, Product) ...


# 6. Схемы для Заказа
class OrderStatus(str, PyEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


# Схема для элемента, который пользователь отправляет в запросе (корзина)
class CartItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)  # Количество должно быть больше или равно 1


# Схема для элемента заказа, который возвращает API
class OrderItem(BaseModel):
    product: Product  # Используем схему Product, чтобы вернуть детали товара
    quantity: int
    price_at_order: float

    class Config:
        from_attributes = True


# Основная схема заказа
class Order(BaseModel):
    id: int
    buyer_id: int
    status: OrderStatus
    created_at: datetime
    items: List[OrderItem] = []  # Содержимое заказа

    class Config:
        from_attributes = True


# Схема для обновления статуса заказа (для продавца)
class OrderStatusUpdate(BaseModel):
    status: OrderStatus