// src/pages/buyer/MyOrders.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

const API_URL = "http://127.0.0.1:5001"; // Убедитесь, что порт соответствует вашему бэкенду

const MyOrders = () => {
    const { isLoggedIn, role } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isLoggedIn && role === 'BUYER') {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn, role]);

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/orders/my`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setOrders(response.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError('Не удалось загрузить историю заказов.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={containerStyle}>Загрузка заказов...</div>;
    }

    if (error) {
        return <div style={{...containerStyle, color: 'red'}}>{error}</div>;
    }

    if (!isLoggedIn || role !== 'BUYER') {
        return <div style={{...containerStyle, color: 'red'}}>Доступ запрещен. Войдите как покупатель.</div>;
    }

    return (
        <div style={containerStyle}>
            <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>🛒 Мои Заказы</h2>

            {orders.length === 0 ? (
                <p>У вас пока нет оформленных заказов.</p>
            ) : (
                <div style={ordersListStyle}>
                    {orders.map((order) => (
                        <div key={order.id} style={orderCardStyle}>
                            <h3 style={orderHeaderStyle}>Заказ #{order.id}</h3>
                            <p>
                                Статус:
                                <span style={getStatusStyle(order.status)}>
                                    {order.status}
                                </span>
                            </p>
                            <p>Дата: {new Date(order.created_at).toLocaleString()}</p>

                            <h4>Товары:</h4>
                            <ul style={itemsListStyle}>
                                {order.items.map((item, index) => (
                                    <li key={index} style={itemStyle}>
                                        {item.product.name} ({item.quantity} шт.) —
                                        {item.price_at_order.toFixed(2)} за шт.
                                    </li>
                                ))}
                            </ul>
                            <div style={totalStyle}>
                                Общая сумма:
                                <strong>
                                    ${order.items.reduce((sum, item) => sum + (item.price_at_order * item.quantity), 0).toFixed(2)}
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Стили (для минимальной читаемости) ---
const containerStyle = {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
};

const ordersListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
};

const orderCardStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
};

const orderHeaderStyle = {
    margin: '0 0 10px 0',
    color: '#343a40',
};

const itemsListStyle = {
    listStyleType: 'disc',
    paddingLeft: '20px',
    margin: '10px 0',
};

const itemStyle = {
    marginBottom: '5px',
    fontSize: '0.95em',
};

const totalStyle = {
    marginTop: '15px',
    paddingTop: '10px',
    borderTop: '1px dashed #ccc',
    fontWeight: 'bold',
};

const getStatusStyle = (status) => {
    let color = '#343a40';
    if (status === 'DELIVERED') color = '#28a745';
    else if (status === 'PENDING') color = '#ffc107';
    else if (status === 'CANCELLED') color = '#dc3545';

    return {
        fontWeight: 'bold',
        color: color,
        marginLeft: '5px',
    };
};

export default MyOrders;