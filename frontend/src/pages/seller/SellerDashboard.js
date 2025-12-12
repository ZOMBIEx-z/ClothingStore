import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const SellerDashboard = () => {
    const { API_URL, user, role } = useAuth();

    // Состояния для магазинов
    const [stores, setStores] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true);
    const [storesError, setStoresError] = useState(null);

    // Состояния для формы добавления товара
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productLoading, setProductLoading] = useState(false);
    const [productMessage, setProductMessage] = useState({ type: '', text: '' });


    // --- 1. Загрузка магазинов продавца ---
    useEffect(() => {
        if (role !== 'SELLER') return;

        const fetchStores = async () => {
            try {
                // Примечание: предполагаем, что на бэкенде есть эндпоинт, который
                // возвращает магазины ТЕКУЩЕГО продавца (например, GET /stores/my)
                // Если такого эндпоинта нет, используем /stores/ и фильтруем по seller_id (менее эффективно)
                const response = await axios.get(`${API_URL}/stores/my`);
                setStores(response.data);
                if (response.data.length > 0) {
                    setSelectedStoreId(response.data[0].id); // Выбираем первый магазин по умолчанию
                }
                setStoresLoading(false);
            } catch (err) {
                console.error("Error fetching seller stores:", err);
                setStoresError("Не удалось загрузить ваши магазины.");
                setStoresLoading(false);
            }
        };

        fetchStores();
    }, [API_URL, role]);


    // --- 2. Обработчик добавления товара ---
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setProductMessage({ type: '', text: '' });
        setProductLoading(true);

        const priceValue = parseFloat(productPrice);

        if (isNaN(priceValue) || priceValue <= 0) {
            setProductMessage({ type: 'error', text: 'Цена должна быть положительным числом.' });
            setProductLoading(false);
            return;
        }

        if (!selectedStoreId) {
             setProductMessage({ type: 'error', text: 'Пожалуйста, выберите магазин.' });
             setProductLoading(false);
             return;
        }

        try {
            // POST /stores/{store_id}/products
            const response = await axios.post(`${API_URL}/stores/${selectedStoreId}/products`, {
                name: productName,
                description: productDescription,
                price: priceValue,
            });

            setProductMessage({
                type: 'success',
                text: `Товар "${response.data.name}" успешно добавлен в магазин ID ${selectedStoreId}.`
            });

            // Очищаем форму товара
            setProductName('');
            setProductDescription('');
            setProductPrice('');

        } catch (err) {
            console.error('Add Product Error:', err.response?.data || err);
            const errorDetail = err.response?.data?.detail || 'Неизвестная ошибка при добавлении товара.';
            setProductMessage({
                type: 'error',
                text: `Ошибка: ${errorDetail}`
            });
        } finally {
            setProductLoading(false);
        }
    };


    if (role !== 'SELLER') {
        return <div>Доступ запрещен. Только продавцы могут просматривать дашборд.</div>;
    }

    if (storesLoading) {
        return <h2>Загрузка дашборда...</h2>;
    }

    if (storesError) {
        return <h2 style={{ color: 'red' }}>Ошибка загрузки: {storesError}</h2>;
    }


    return (
        <div style={{ padding: '20px' }}>
            <h1>👋 Дашборд Продавца: {user.username}</h1>

            {stores.length === 0 ? (
                <div style={{ padding: '20px', border: '1px solid #f0ad4e', borderRadius: '4px', backgroundColor: '#fffbe6' }}>
                    <p style={{ fontWeight: 'bold' }}>У вас пока нет магазинов.</p>
                    <Link to="/seller/add-store">Нажмите здесь, чтобы добавить первый магазин.</Link>
                </div>
            ) : (
                <>
                    <h2>Ваши магазины ({stores.length})</h2>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                        {stores.map(store => (
                            <div
                                key={store.id}
                                style={{
                                    padding: '10px 15px',
                                    border: '1px solid #007bff',
                                    borderRadius: '4px',
                                    backgroundColor: '#e9f5ff'
                                }}
                            >
                                <strong>{store.name}</strong> (ID: {store.id})
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        {/* --- БЛОК 1: ДОБАВЛЕНИЕ ТОВАРА --- */}
                        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                            <h3>➕ Добавить Новый Товар</h3>

                            {productMessage.text && (
                                <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: productMessage.type === 'success' ? '#d4edda' : '#f8d7da', color: productMessage.type === 'success' ? '#155724' : '#721c24', borderRadius: '4px' }}>
                                    {productMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleProductSubmit}>
                                {/* Выбор магазина */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Магазин:</label>
                                    <select
                                        value={selectedStoreId}
                                        onChange={(e) => setSelectedStoreId(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                                    >
                                        {stores.map(store => (
                                            <option key={store.id} value={store.id}>{store.name} (ID: {store.id})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Название товара */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Название:</label>
                                    <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>

                                {/* Описание */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Описание:</label>
                                    <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px' }} />
                                </div>

                                {/* Цена */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold' }}>Цена ($):</label>
                                    <input type="number" step="0.01" min="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>

                                <button type="submit" disabled={productLoading} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    {productLoading ? 'Добавление...' : 'Опубликовать товар'}
                                </button>
                            </form>
                        </div>

                        {/* --- БЛОК 2: ПРОСМОТР ЗАКАЗОВ --- */}
                        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                            <h3>📦 Заказы в Моих Магазинах</h3>

                            <p>Здесь будет список заказов, содержащих товары из ваших магазинов.</p>

                            <Link
                                to="/seller/orders"
                                style={{
                                    display: 'inline-block',
                                    padding: '10px 20px',
                                    backgroundColor: '#ffc107',
                                    color: 'black',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    marginTop: '15px'
                                }}
                            >
                                Перейти к списку заказов
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerDashboard;