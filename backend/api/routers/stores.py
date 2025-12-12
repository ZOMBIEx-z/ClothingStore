from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from .. import schemas, models
from ..auth_utils import get_current_user

router = APIRouter(
    prefix="/stores",
    tags=["stores"],
)


# --- ФУНКЦИОНАЛ ДЛЯ ПРОДАВЦОВ (SELLER) ---

@router.post("/", response_model=schemas.Store, status_code=status.HTTP_201_CREATED)
def create_store(
        store: schemas.StoreCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    [SELLER] Добавление нового магазина.
    Доступно только пользователям с ролью SELLER.
    """

    # Проверка роли
    if current_user.role.value != models.UserRole.SELLER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only sellers can create stores."
        )

    # Создание магазина
    db_store = models.Store(name=store.name, seller_id=current_user.id)
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store


@router.get("/my", response_model=List[schemas.Store])
def get_my_stores(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    [SELLER] Получить список магазинов, принадлежащих текущему продавцу.
    Фронтенд вызывает: GET /stores/my
    """

    # 1. Проверка роли (хотя запрос на `seller/dashboard` уже должен это гарантировать)
    if current_user.role.value != models.UserRole.SELLER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only sellers can view their stores."
        )

    # 2. Запрос магазинов, где seller_id совпадает с ID текущего пользователя
    stores = db.query(models.Store).filter(models.Store.seller_id == current_user.id).all()

    # Если магазинов нет, вернется пустой список [] (что корректно для фронтенда)
    return stores


@router.post("/{store_id}/products", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(
        store_id: int,
        product: schemas.ProductCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    [SELLER] Добавление нового товара в свой магазин.
    Проверяет, что SELLER владеет магазином.
    """
    if current_user.role.value != models.UserRole.SELLER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Seller required.")

    # 1. Проверяем существование магазина и его владельца
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    # 2. Проверяем, что текущий пользователь является владельцем магазина
    if store.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this store."
        )

    # 3. Создание товара
    db_product = models.Product(**product.dict(), store_id=store_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# --- ФУНКЦИОНАЛ ДЛЯ ПОКУПАТЕЛЕЙ И ВСЕХ (BUYER/ALL) ---

@router.get("/", response_model=List[schemas.Store])
def get_all_stores(db: Session = Depends(get_db)):
    """[BUYER/ALL] Просмотр списка всех магазинов."""

    # Не требует аутентификации, но если вы хотите, чтобы это было доступно только BUYER,
    # добавьте 'current_user: models.User = Depends(get_current_user)' и проверку роли.

    stores = db.query(models.Store).all()
    return stores


@router.get("/{store_id}/products", response_model=List[schemas.Product])
def get_products_in_store(store_id: int, db: Session = Depends(get_db)):
    """[BUYER/ALL] Просмотр товаров в конкретном магазине."""

    # 1. Проверяем существование магазина
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    # 2. Запрос товаров
    products = db.query(models.Product).filter(models.Product.store_id == store_id).all()
    return products
