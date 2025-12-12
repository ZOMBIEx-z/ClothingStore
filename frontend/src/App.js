import React from 'react';
import {Routes, Route} from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// --- Страницы ---
import Login from './pages/Login';
import Register from './pages/Register';
import StoreList from './pages/buyer/StoreList';
import StoreDetails from './pages/buyer/StoreDetails';
import Cart from './pages/buyer/Cart';
import SellerDashboard from './pages/seller/SellerDashboard';
import AddStore from './pages/seller/AddStore';
import SellerOrders from './pages/seller/SellerOrders'; // <-- НОВЫЙ ИМПОРТ
import MyOrders from './pages/buyer/MyOrders'; // <-- ИМПОРТ

function App() {
    return (
        <>
            <Header/>
            <main style={{padding: '20px'}}>
                <Routes>
                    {/* Публичные роуты */}
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>

                    {/* --- Защищенные роуты для Покупателя --- */}
                    <Route element={<ProtectedRoute allowedRole="BUYER"/>}>
                        <Route path="/" element={<StoreList/>}/> {/* Главная страница для покупателя */}
                        <Route path="/stores/:id" element={<StoreDetails/>}/>
                        <Route path="/cart" element={<Cart/>}/>
                        <Route path="/my-orders" element={<MyOrders/>}/>
                    </Route>

                    {/* --- Защищенные роуты для Продавца --- */}
                    <Route element={<ProtectedRoute allowedRole="SELLER"/>}>
                        <Route path="/seller/dashboard"
                               element={<SellerDashboard/>}/> {/* Главная страница для продавца */}
                        <Route path="/seller/add-store" element={<AddStore/>}/>
                        <Route path="/seller/orders" element={<SellerOrders/>}/> {/* <-- НОВЫЙ РОУТ */}
                    </Route>

                    {/* Роут по умолчанию / для неаутентифицированных (можно заменить на Login/Register) */}
                    <Route path="*" element={<div>404 | Страница не найдена</div>}/>
                </Routes>
            </main>
        </>
    );
}

export default App;