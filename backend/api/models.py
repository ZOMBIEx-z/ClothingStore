from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from .database import Base


# Enum для ролей (уже был)
class UserRole(str, PyEnum):
    BUYER = "BUYER"
    SELLER = "SELLER"


# 1. Модель Пользователя
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.BUYER)

    # Отношение: Один продавец может иметь много магазинов
    stores = relationship("Store", back_populates="seller")

    # НОВОЕ: Один покупатель может иметь много заказов
    # orders = relationship("Order", backref="user")
    orders = relationship("Order", back_populates="buyer")  # <--- ИСПОЛЬЗУЕМ back_populates="buyer"
    # Используем backref, так как Order уже использует relationship("User") без back_populates

# 2. Модель Магазина
class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    # Внешний ключ: Магазин принадлежит одному продавцу
    seller_id = Column(Integer, ForeignKey("users.id"))

    # Отношения
    seller = relationship("User", back_populates="stores")
    products = relationship("Product", back_populates="store")


# 3. Модель Товара
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)

    # Внешний ключ: Товар принадлежит одному магазину
    store_id = Column(Integer, ForeignKey("stores.id"))

    # Отношения
    store = relationship("Store", back_populates="products")



# ... (Модели User, UserRole, Store, Product остаются без изменений) ...

# Enum для статусов заказа
class OrderStatus(str, PyEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


# 4. Модель Заказа
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    # Внешний ключ: Заказ принадлежит Покупателю
    buyer_id = Column(Integer, ForeignKey("users.id"))

    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())

    # Отношения:
    # buyer = relationship("User")  # Обратная связь не нужна, если не будем запрашивать все заказы пользователя
    buyer = relationship("User", back_populates="orders")  # <--- ИСПОЛЬЗУЕМ back_populates="orders"
    items = relationship("OrderItem", back_populates="order")


# 5. Модель Элемента Заказа (Содержимое заказа)
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer)
    price_at_order = Column(Float)  # Цена товара на момент оформления заказа

    # Внешние ключи:
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))

    # Отношения:
    order = relationship("Order", back_populates="items")
    product = relationship("Product")  # Обратная связь