import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddStore = () => {
    const { API_URL, user, role } = useAuth();
    const navigate = useNavigate();

    const [storeName, setStoreName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Проверка, что только продавцы могут добавлять магазины
    if (role !== 'SELLER') {
        return <div>Доступ запрещен. Только продавцы могут добавлять магазины.</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        try {
            // Отправляем данные. Axios автоматически добавит токен из контекста в заголовок Authorization
            const response = await axios.post(`${API_URL}/stores/`, {
                name: storeName
            });

            setMessage({
                type: 'success',
                text: `Магазин "${response.data.name}" (ID: ${response.data.id}) успешно добавлен!`
            });
            setStoreName(''); // Очищаем форму

            // Опционально: перенаправляем на дашборд продавца
            // setTimeout(() => navigate('/seller/dashboard'), 2000);

        } catch (err) {
            console.error('Add Store Error:', err.response?.data || err);
            const errorDetail = err.response?.data?.detail || 'Неизвестная ошибка при добавлении магазина.';
            setMessage({
                type: 'error',
                text: `Ошибка: ${errorDetail}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h1>🏪 Добавить Новый Магазин</h1>

            {message.text && (
                <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', borderRadius: '4px' }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="storeName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Название магазина:</label>
                    <input
                        id="storeName"
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || storeName.trim() === ''}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Добавление...' : 'Добавить магазин'}
                </button>
            </form>
        </div>
    );
};

export default AddStore;