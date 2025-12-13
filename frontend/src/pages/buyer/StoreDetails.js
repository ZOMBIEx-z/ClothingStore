import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useParams } from 'react-router-dom';

const StoreDetails = () => {
    const { API_URL } = useAuth();
    const { addToCart, cartItems } = useCart();
    const { id } = useParams(); // Получаем ID магазина из URL

    const [storeName, setStoreName] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                // 1. Получаем детали магазина (через общий эндпоинт /stores/)
                const storeResponse = await axios.get(`${API_URL}/stores/`);
                const store = storeResponse.data.find(s => s.id === parseInt(id));

                if (!store) {
                    setError("Магазин не найден.");
                    setLoading(false);
                    return;
                }
                setStoreName(store.name);

                // 2. Получаем товары магазина (через эндпоинт /stores/{store_id}/products)
                const productsResponse = await axios.get(`${API_URL}/stores/${id}/products`);
                setProducts(productsResponse.data);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching store data:", err);
                setError("Не удалось загрузить данные магазина.");
                setLoading(false);
            }
        };

        fetchStoreData();
    }, [API_URL, id]);

    if (loading) {
        return <h2>Загрузка магазина...</h2>;
    }

    if (error) {
        return <h2 style={{ color: 'red' }}>Ошибка: {error}</h2>;
    }

    const handleUpdateCart = (product, quantity) => {
        const productForCart = {
            ...product,
        };
        addToCart(productForCart, quantity);
    };

    // Функция для получения текущего количества товара в корзине
    const getItemQuantity = (productId) => {
        const item = cartItems.find(item => item.product_id === productId);
        return item ? item.quantity : 0;
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>🏬 {storeName}</h1>
            <h2>Список товаров</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {products.length > 0 ? (
                    products.map(product => {
                        const currentQuantity = getItemQuantity(product.id);
                        return (
                            <div
                                key={product.id}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    boxShadow: currentQuantity > 0 ? '0 0 10px rgba(0, 123, 255, 0.5)' : 'none'
                                }}
                            >
                                <h4>{product.name}</h4>
                                <p>{product.description}</p>
                                <p style={{ fontWeight: 'bold' }}>Цена: ${product.price.toFixed(2)}</p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>

                                    <button
                                        onClick={() => handleUpdateCart(product, 1)} // ИСПОЛЬЗУЕМ НОВЫЙ ОБРАБОТЧИК
                                        style={{ padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Добавить в корзину
                                    </button>

                                    {currentQuantity > 0 && (
                                        <>
                                            <span style={{ fontWeight: 'bold' }}>
                                                В корзине: {currentQuantity}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateCart(product, -1)}
                                                style={{ padding: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                -
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>В этом магазине пока нет товаров.</p>
                )}
            </div>
        </div>
    );
};

export default StoreDetails;