import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('BUYER'); // По умолчанию: Покупатель
    const [statusMessage, setStatusMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setIsError(false);

        if (password.length < 6) {
             setStatusMessage("Пароль должен быть не менее 6 символов.");
             setIsError(true);
             return;
        }

        try {
            await register(username, password, role);
            setStatusMessage(`Пользователь ${username} успешно зарегистрирован как ${role === 'BUYER' ? 'Покупатель' : 'Продавец'}! Теперь можете войти.`);

            // Небольшая задержка перед перенаправлением
            setTimeout(() => navigate('/login'), 2000);

        } catch (error) {
            console.error('Registration Error:', error);
            const errorMessage = error.response?.data?.detail || 'Ошибка регистрации. Возможно, имя пользователя уже занято.';
            setStatusMessage(`Ошибка: ${errorMessage}`);
            setIsError(true);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>📝 Регистрация</h2>

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
                <div style={{ marginBottom: '15px' }}>
                    <label>Пароль (мин. 6 символов):</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Роль:</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    >
                        <option value="BUYER">Покупатель</option>
                        <option value="SELLER">Продавец</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
    );
};

export default Register;