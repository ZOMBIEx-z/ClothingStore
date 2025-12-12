import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Базовый URL вашего бэкенда FastAPI
const API_URL = "http://127.0.0.1:5001";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Получение начального состояния из localStorage
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Устанавливаем токен для всех будущих запросов Axios
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
        }
    }, [token, role, user]);


    // --- Функции аутентификации ---

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/users/login`, { username, password });

            const newToken = response.data.access_token;
            const newRole = response.data.role;

            // Получаем данные пользователя
            const userResponse = await axios.get(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${newToken}` }
            });

            setToken(newToken);
            setRole(newRole);
            setUser(userResponse.data);

            return userResponse.data;

        } catch (err) {
            setError(err.response?.data?.detail || "Login failed");
            setToken(null);
            setRole(null);
            setUser(null);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (username, password, selectedRole) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/users/register`, {
                username,
                password,
                role: selectedRole.toUpperCase()
            });
            setLoading(false);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed");
            setLoading(false);
            throw err;
        }
    };

    const logout = () => {
        setToken(null);
        setRole(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        role,
        isLoggedIn: !!token,
        loading,
        error,
        login,
        register,
        logout,
        API_URL
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);