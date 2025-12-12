import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const { login, isLoggedIn, role, loading } = useAuth();
    const navigate = useNavigate();

    // Перенаправление, если пользователь уже залогинен
    useEffect(() => {
        if (isLoggedIn) {
            // Перенаправляем на дашборд продавца или список магазинов для покупателя
            if (role === 'SELLER') {
                navigate('/seller/dashboard');
            } else if (role === 'BUYER') {
                navigate('/');
            }
        }
    }, [isLoggedIn, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setIsError(false);

        try {
            const user = await login(username, password);
            setStatusMessage(`Успешный вход! Добро пожаловать, ${user.username}.`);

            // Перенаправление происходит через useEffect после обновления контекста

        } catch (error) {
            console.error('Login Error:', error);
            const errorMessage = error.response?.data?.detail || 'Неверное имя пользователя или пароль.';
            setStatusMessage(`Ошибка входа: ${errorMessage}`);
            setIsError(true);
        }
    };

    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    // Если пользователь уже залогинен, не показываем форму (перенаправление сработает в useEffect)
    if (isLoggedIn) {
        return <div>Перенаправление...</div>;
    }

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>🔑 Вход</h2>

            {statusMessage && (
                <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
                    {statusMessage}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Имя пользователя:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Вход...' : 'Войти'}
                </button>
            </form>
        </div>
    );
};

export default Login;