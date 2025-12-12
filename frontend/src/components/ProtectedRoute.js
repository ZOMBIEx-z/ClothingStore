import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Компонент для защиты роутов.
 * @param {string} allowedRole - Требуемая роль ('BUYER', 'SELLER', или null для аутентификации).
 */
const ProtectedRoute = ({ allowedRole }) => {
    const { isLoggedIn, role, loading } = useAuth();

    if (loading) {
        // Здесь можно показать спиннер
        return <div>Загрузка...</div>;
    }

    if (!isLoggedIn) {
        // Если не залогинен, перенаправляем на страницу входа
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        // Если роль не совпадает с требуемой, перенаправляем на дашборд (или 403)
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;