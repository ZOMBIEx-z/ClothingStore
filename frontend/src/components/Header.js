import React from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

const Header = () => {
    // Получаем состояние аутентификации и функции из контекста
    const {isLoggedIn, role, logout, user} = useAuth();

    // Определяем, куда должна вести главная ссылка/логотип
    const homePath = isLoggedIn && role === 'SELLER' ? '/seller/dashboard' : '/';

    return (
        <header style={headerStyle}>
            {/* Логотип / Главная ссылка */}
            <Link to={homePath} style={{textDecoration: 'none', color: '#fff', fontWeight: 'bold', fontSize: '1.5em'}}>
                🛍️ Clothes Aggregator
            </Link>

            <nav style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                {isLoggedIn ? (
                    <>
                        {/* Информация о пользователе */}
                        <span style={{
                            color: '#fff',
                            marginRight: '15px',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            backgroundColor: role === 'SELLER' ? '#ffc107' : '#007bff'
                        }}>
                            {user.username} ({role})
                        </span>

                        {/* Навигация по ролям */}
                        {role === 'BUYER' && (
                            <>
                                <Link to="/" style={navLinkStyle}>Магазины</Link>
                                <Link to="/cart" style={navLinkStyle}>Корзина</Link>
                                <Link to="/my-orders" style={navLinkStyle}>Заказы</Link>
                            </>
                        )}
                        {role === 'SELLER' && (
                            <>
                                <Link to="/seller/dashboard" style={navLinkStyle}>Дашборд</Link>
                                <Link to="/seller/add-store" style={navLinkStyle}>Добавить магазин</Link>
                                <Link to="/seller/orders" style={navLinkStyle}>Заказы</Link>
                            </>
                        )}

                        {/* Кнопка Выхода */}
                        <button onClick={logout} style={logoutButtonStyle}>
                            Выход
                        </button>
                    </>
                ) : (
                    <>
                        {/* Ссылки для неаутентифицированных пользователей */}
                        <Link to="/login" style={navLinkStyle}>Вход</Link>
                        <Link to="/register" style={registerLinkStyle}>Регистрация</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

// --- Стили ---
const headerStyle = {
    padding: '15px 30px',
    backgroundColor: '#343a40', // Темный фон
    borderBottom: '3px solid #007bff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const navLinkStyle = {
    color: '#fff',
    textDecoration: 'none',
    padding: '8px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
};

const registerLinkStyle = {
    ...navLinkStyle,
    backgroundColor: '#28a745',
};

const logoutButtonStyle = {
    padding: '8px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
};

export default Header;