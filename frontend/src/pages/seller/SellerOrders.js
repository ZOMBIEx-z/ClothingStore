import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom'; // <-- ДОБАВЬТЕ ЭТОТ ИМПОРТ

// Доступные статусы заказа (должны совпадать с бэкендом)
const ORDER_STATUSES = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED"
];

const SellerOrders = () => {
    const { API_URL, role } = useAuth();

    const [orders, setOrders] = useState([]);
    const [stores, setStores] = useState([]); // Для сопоставления ID магазина с именем
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateStatus, setUpdateStatus] = useState({}); // { orderId: newStatus }

    // --- 1. Загрузка данных (Магазины и Заказы) ---
    useEffect(() => {
        if (role !== 'SELLER') return;

        const fetchData = async () => {
            try {
                // 1. Получаем все магазины продавца, чтобы знать, какие ID нас интересуют
                // *Предполагаем, что есть эндпоинт для получения магазинов текущего продавца*
                const storeResponse = await axios.get(`${API_URL}/stores/my`);
                const sellerStores = storeResponse.data;
                setStores(sellerStores);

                if (sellerStores.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Получаем заказы для каждого магазина и объединяем их
                let allOrders = [];
                for (const store of sellerStores) {
                    // Используем бэкенд-эндпоинт GET /orders/seller/store/{store_id}
                    const ordersResponse = await axios.get(`${API_URL}/orders/seller/store/${store.id}`);
                    allOrders = allOrders.concat(ordersResponse.data);
                }

                // Удаляем дубликаты заказов (т.к. один заказ может содержать товары из разных магазинов продавца)
                const uniqueOrders = Array.from(new Set(allOrders.map(o => o.id)))
                    .map(id => {
                        return allOrders.find(o => o.id === id);
                    });

                setOrders(uniqueOrders);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching seller orders:", err.response?.data || err);
                setError("Не удалось загрузить заказы или список магазинов.");
                setLoading(false);
            }
        };

        fetchData();
    }, [API_URL, role]);


    // --- 2. Обновление статуса заказа ---
    const handleStatusChange = (orderId, newStatus) => {
        setUpdateStatus(prev => ({ ...prev, [orderId]: newStatus }));
    };

    const saveStatus = async (orderId) => {
        const newStatus = updateStatus[orderId];
        if (!newStatus) return;

        setLoading(true); // Блокируем интерфейс во время сохранения
        try {
            // PATCH /orders/{order_id}/status
            await axios.patch(`${API_URL}/orders/${orderId}/status`, {
                status: newStatus
            });

            // Обновляем состояние заказов на фронтенде
            setOrders(prevOrders => prevOrders.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));

            setUpdateStatus(prev => {
                const newState = { ...prev };
                delete newState[orderId];
                return newState;
            });

            // Сообщение об успехе
            alert(`Статус заказа ID ${orderId} обновлен на ${newStatus}`);

        } catch (err) {
            console.error("Error updating order status:", err.response?.data || err);
            alert(`Ошибка при обновлении статуса заказа ID ${orderId}: ${err.response?.data?.detail || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    if (role !== 'SELLER') {
        return <div>Доступ запрещен.</div>;
    }

    if (loading) {
        return <h2>Загрузка заказов...</h2>;
    }

    if (error) {
        return <h2 style={{ color: 'red' }}>Ошибка: {error}</h2>;
    }

    if (stores.length === 0) {
        return <p>У вас нет зарегистрированных магазинов. <Link to="/seller/add-store">Добавьте магазин</Link>, чтобы получать заказы.</p>;
    }

    if (orders.length === 0) {
        return <h2>В ваших магазинах пока нет новых заказов.</h2>;
    }

    // Вспомогательная функция для определения, относится ли товар к магазинам продавца
    const isProductMine = (item) => {
        return stores.some(store => store.id === item.product.store_id);
    }

    // Вспомогательная функция для форматирования даты
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    }


    return (
        <div style={{ padding: '20px' }}>
            <h1>📦 Управление Заказами</h1>

            {orders.map(order => (
                <div
                    key={order.id}
                    style={{ border: '2px solid #007bff', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                        <h3>Заказ #{order.id}</h3>
                        <p>Дата: {formatDate(order.created_at)}</p>
                    </div>

                    <p style={{ fontWeight: 'bold' }}>Текущий статус: {order.status}</p>

                    {/* Список товаров в заказе */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Товар</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Цена покупки</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Кол-во</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Магазин ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map(item => (
                                <tr key={item.id} style={{ backgroundColor: isProductMine(item) ? '#e6ffe6' : 'white' }}> {/* Выделяем товары продавца */}
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.product.name}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>${item.price_at_order.toFixed(2)}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.quantity}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: isProductMine(item) ? 'bold' : 'normal' }}>{item.product.store_id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Управление статусом */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                        <label>Изменить статус:</label>
                        <select
                            value={updateStatus[order.id] || order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={loading}
                            style={{ padding: '8px', borderRadius: '4px' }}
                        >
                            {ORDER_STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => saveStatus(order.id)}
                            disabled={loading || updateStatus[order.id] === order.status}
                            style={{ padding: '8px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Сохранить
                        </button>
                    </div>

                </div>
            ))}
        </div>
    );
};

export default SellerOrders;