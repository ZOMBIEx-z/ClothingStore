import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Структура товара в корзине: { product_id, name, price, quantity, store_id }
    const [cartItems, setCartItems] = useState(() => {
        // Попытка загрузить корзину из localStorage
        const localData = localStorage.getItem('cartItems');
        return localData ? JSON.parse(localData) : [];
    });

    // Сохранение в localStorage при изменении cartItems (необязательно, но полезно)
    // useEffect(() => {
    //     localStorage.setItem('cartItems', JSON.stringify(cartItems));
    // }, [cartItems]);


    /**
     * Добавление или обновление товара в корзине.
     * @param {object} product - Детали товара.
     * @param {number} quantityToAdd - Количество для добавления (может быть отрицательным для уменьшения).
     */
    const addToCart = (product, quantityToAdd = 1) => {
        console.log(product, quantityToAdd);

        setCartItems(prevItems => {
            console.log('вызов setCartItems');
            const productIdToFind = product.id || product.product_id;
            const existingItemIndex = prevItems.findIndex(item => item.product_id === productIdToFind);

            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];

                console.log(updatedItems[existingItemIndex].quantity);
                const newQuantity = updatedItems[existingItemIndex].quantity + quantityToAdd;
                console.log(newQuantity);

                if (newQuantity <= 0) {
                    return updatedItems.filter(item => item.product_id !== productIdToFind);
                }

                updatedItems[existingItemIndex].quantity = newQuantity;
                return updatedItems;

            } else if (quantityToAdd > 0) {
                return [
                    ...prevItems,
                    {
                        product_id: product.id,
                        name: product.name,
                        price: product.price,
                        store_id: product.store_id,
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
        <CartContext.Provider value={{cartItems, addToCart, removeItemFromCart, clearCart, totalAmount, totalCount}}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);