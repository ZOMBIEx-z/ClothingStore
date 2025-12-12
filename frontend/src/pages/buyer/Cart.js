import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Cart = () => {
    const { cartItems, addToCart, removeItemFromCart, clearCart, totalAmount, totalCount } = useCart();
    const { API_URL, token, user } = useAuth();

    const [isOrdering, setIsOrdering] = useState(false);
    const [orderMessage, setOrderMessage] = useState({ type: '', text: '' });

    const handleRemove = (productId) => {
        removeItemFromCart(productId);
    };

    const handleOrder = async () => {
        if (cartItems.length === 0) {
            setOrderMessage({ type: 'error', text: 'Корзина пуста. Нечего заказывать.' });
            return;
        }

        setIsOrdering(true);
        setOrderMessage({ type: '', text: '' });

        // Формируем структуру данных, требуемую бэкендом (List[CartItem])
        const orderData = cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
        }));

        try {
            // FastAPI автоматически использует токен из axios.defaults.headers.common
            await axios.post(`${API_URL}/orders/create`, orderData);

            setOrderMessage({ type: 'success', text: 'Заказ успешно оформлен! Ожидайте подтверждения от продавца.' });
            clearCart(); // Очищаем корзину после успешного оформления

        } catch (err) {
            console.error('Order creation error:', err.response?.data || err);
            const errorDetail = err.response?.data?.detail || 'Неизвестная ошибка при оформлении заказа.';
            setOrderMessage({ type: 'error', text: `Ошибка при оформлении: ${errorDetail}` });
        } finally {
            setIsOrdering(false);
        }
    };

    if (!user) {
        return <p>Пожалуйста, <Link to="/login">войдите</Link>, чтобы просмотреть корзину.</p>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
            <h1>🧺 Ваша Корзина ({totalCount} {totalCount === 1 ? 'товар' : 'товаров'})</h1>

            {orderMessage.text && (
                <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: orderMessage.type === 'success' ? '#d4edda' : '#f8d7da', color: orderMessage.type === 'success' ? '#155724' : '#721c24', borderRadius: '4px' }}>
                    {orderMessage.text}
                </div>
            )}

            {cartItems.length === 0 ? (
                <p>Ваша корзина пуста. <Link to="/">Начните покупки!</Link></p>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', fontWeight: 'bold', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '10px' }}>
                        <span>Товар</span>
                        <span>Магазин ID</span>
                        <span>Цена</span>
                        <span>Количество</span>
                        <span>Сумма</span>
                    </div>

                    {cartItems.map((item) => (
                        <div
                            key={item.product_id}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', padding: '10px 0', borderBottom: '1px dotted #ccc', alignItems: 'center' }}
                        >
                            <span style={{ fontWeight: '500' }}>{item.name}</span>
                            <span>{item.store_id}</span>
                            <span>${item.price.toFixed(2)}</span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <button onClick={() => addToCart(item, -1)} disabled={isOrdering}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => addToCart(item, 1)} disabled={isOrdering}>+</button>
                            </div>

                            <span>${(item.price * item.quantity).toFixed(2)}</span>

                            <button
                                onClick={() => handleRemove(item.product_id)}
                                disabled={isOrdering}
                                style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', textAlign: 'right' }}
                            >
                                Удалить
                            </button>
                        </div>
                    ))}

                    <h3 style={{ textAlign: 'right', marginTop: '20px' }}>
                        Итого: ${totalAmount}
                    </h3>

                    <button
                        onClick={handleOrder}
                        disabled={isOrdering || cartItems.length === 0}
                        style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: isOrdering ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.1em' }}
                    >
                        {isOrdering ? 'Оформление заказа...' : 'Оформить заказ'}
                    </button>

                    <button
                        onClick={clearCart}
                        disabled={isOrdering}
                        style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#f0ad4e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Очистить корзину
                    </button>
                </>
            )}
        </div>
    );
};

export default Cart;