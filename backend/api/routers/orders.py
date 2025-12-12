from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict

from ..database import get_db
from .. import schemas, models
from ..auth_utils import get_current_user

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)


# --- ФУНКЦИОНАЛ ДЛЯ ПОКУПАТЕЛЕЙ (BUYER) ---

@router.post("/create", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(
        cart_items: List[schemas.CartItem],
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    [BUYER] Оформление заказа (перенос товаров из корзины в БД).
    Доступно только пользователям с ролью BUYER.
    """

    # 1. Проверка роли
    if current_user.role.value != models.UserRole.BUYER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Access denied. Only buyers can create orders.")

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    # 2. Создание нового заказа
    db_order = models.Order(buyer_id=current_user.id, status=models.OrderStatus.PENDING)
    db.add(db_order)
    db.flush()  # Получаем ID нового заказа до коммита

    order_items_to_add = []

    # 3. Обработка товаров в корзине
    for item in cart_items:
        # Ищем товар и получаем его текущую цену
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found.")

        # Создаем элемент заказа, фиксируя цену на момент покупки
        order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price_at_order=product.price  # Фиксируем текущую цену
        )
        order_items_to_add.append(order_item)

    db.add_all(order_items_to_add)
    db.commit()
    db.refresh(db_order)

    # Загружаем заказ с деталями для ответа
    db_order = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)).filter(
        models.Order.id == db_order.id).first()

    return db_order


@router.get("/my", response_model=List[schemas.Order])
def get_my_orders(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    [BUYER] Просмотр всех заказов текущего пользователя.
    """
    if current_user.role.value != models.UserRole.BUYER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Access denied. Only buyers can view their orders.")

    orders = (
        db.query(models.Order)
        .filter(models.Order.buyer_id == current_user.id)
        # Оптимизированная загрузка элементов и товаров
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .all()
    )
    return orders


# --- ФУНКЦИОНАЛ ДЛЯ ПРОДАВЦОВ (SELLER) ---

@router.get("/seller/store/{store_id}", response_model=List[schemas.Order])
def get_store_orders(
        store_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    [SELLER] Просмотр заказов, содержащих товары из конкретного магазина продавца.
    """

    # 1. Проверка роли
    if current_user.role.value != models.UserRole.SELLER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Seller required.")

    # 2. Проверяем, что продавец владеет этим магазином
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store or store.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found or you are not the owner.")

    # 3. Ищем все элементы заказов, которые относятся к этому магазину (через product)
    order_items_in_store = (
        db.query(models.OrderItem)
        .join(models.Product)
        .filter(models.Product.store_id == store_id)
        .all()
    )

    # Получаем уникальные ID заказов, которые содержат товары из этого магазина
    order_ids = {item.order_id for item in order_items_in_store}

    # 4. Загружаем сами заказы по найденным ID
    orders = (
        db.query(models.Order)
        .filter(models.Order.id.in_(order_ids))
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .all()
    )

    return orders


@router.patch("/{order_id}/status", response_model=schemas.Order)
def update_order_status(
        order_id: int,
        status_update: schemas.OrderStatusUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    [SELLER] Обновление статуса заказа.
    Продавец может обновить статус, если заказ содержит его товар.
    """

    if current_user.role.value != models.UserRole.SELLER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Seller required.")

    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Проверяем, содержит ли заказ товары текущего продавца
    # (достаточно, чтобы хотя бы один товар принадлежал продавцу)
    is_seller_involved = (
        db.query(models.OrderItem)
        .join(models.Product)
        .join(models.Store)
        .filter(models.OrderItem.order_id == order_id)
        .filter(models.Store.seller_id == current_user.id)
        .first()
    )

    if not is_seller_involved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only update orders that contain items from your stores.")

    # Обновление статуса
    db_order.status = status_update.status
    db.commit()
    db.refresh(db_order)

    # Загружаем обновленный заказ с деталями для ответа
    db_order = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)).filter(models.Order.id == order_id).first()

    return db_order
