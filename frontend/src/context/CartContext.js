import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Структура товара в корзине: { product_id, name, price, quantity, store_id }
    const [cartItems, setCartItems] = useState([]);

    /**
     * Добавление или обновление товара в корзине.
     * @param {object} product - Детали товара.
     * @param {number} quantityToAdd - Количество для добавления (может быть отрицательным для уменьшения).
     */
    const addToCart = (product, quantityToAdd = 1) => {
        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.product_id === product.id);

            if (existingItemIndex > -1) {
                // Товар уже есть в корзине, обновляем количество
                const updatedItems = [...prevItems];
                const newQuantity = updatedItems[existingItemIndex].quantity + quantityToAdd;

                if (newQuantity <= 0) {
                    // Удаляем, если количество стало <= 0
                    return updatedItems.filter(item => item.product_id !== product.id);
                }

                updatedItems[existingItemIndex].quantity = newQuantity;
                return updatedItems;

            } else if (quantityToAdd > 0) {
                // Новый товар
                return [
                    ...prevItems,
                    {
                        product_id: product.id,
                        name: product.name,
                        price: product.price,
                        store_id: product.store_id, // Сохраняем ID магазина для проверки
                        quantity: quantityToAdd,
                    }
                ];
            }
            return prevItems; // Если пытаемся удалить несуществующий или добавить 0
        });
    };

    const removeItemFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    // Общая стоимость и количество товаров
    const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2);
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeItemFromCart, clearCart, totalAmount, totalCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);