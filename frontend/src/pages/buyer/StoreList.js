import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const StoreList = () => {
    const { API_URL, isLoggedIn, role } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Дополнительная проверка на роль (хотя ProtectedRoute уже это делает)
    if (isLoggedIn && role === 'SELLER') {
        return <div>Вы продавец. Пожалуйста, перейдите на <Link to="/seller/dashboard">Дашборд Продавца</Link>.</div>;
    }

    useEffect(() => {
        const fetchStores = async () => {
            try {
                // Эндпоинт GET /stores/ не требует токена на бэкенде,
                // если мы хотим, чтобы список был виден всем.
                // Если эндпоинт защищен, axios автоматически отправит токен.
                const response = await axios.get(`${API_URL}/stores/`);
                setStores(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching stores:", err);
                setError("Не удалось загрузить список магазинов. Попробуйте позже.");
                setLoading(false);
            }
        };

        // Запускаем загрузку, только если пользователь (покупатель) залогинен
        if (isLoggedIn) {
            fetchStores();
        } else {
             // Если не залогинен, показываем сообщение (хотя ProtectedRoute должен перенаправить)
            setLoading(false);
            setError("Пожалуйста, войдите в систему как покупатель для просмотра магазинов.");
        }
    }, [API_URL, isLoggedIn]);

    if (!isLoggedIn) {
        return <div>Пожалуйста, <Link to="/login">войдите</Link>, чтобы просматривать магазины.</div>;
    }

    if (loading) {
        return <h2>Загрузка магазинов...</h2>;
    }

    if (error) {
        return <h2 style={{ color: 'red' }}>Ошибка: {error}</h2>;
    }

    // Если магазинов нет
    if (stores.length === 0) {
        return <h2>Пока нет зарегистрированных магазинов.</h2>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>🛒 Все магазины</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {stores.map(store => (
                    <div
                        key={store.id}
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '15px',
                            boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h3>{store.name}</h3>
                        <p>ID Продавца: {store.seller_id}</p>

                        <Link
                            to={`/stores/${store.id}`}
                            style={{
                                display: 'inline-block',
                                marginTop: '10px',
                                padding: '8px 12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px'
                            }}
                        >
                            Просмотреть товары
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StoreList;