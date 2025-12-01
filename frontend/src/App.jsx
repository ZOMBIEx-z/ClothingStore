import React, { useState, useEffect } from "react";

// Single-file React App (default export) — mock UI for "Агрегатор магазинов одежды"
// Features implemented:
// - Login by username/password (dummy auth)
// - Browse product list with categories
// - Filter by category + search
// - Add / remove items from cart, adjust quantity
// - Simple cart persistence in localStorage
// How to run:
// 1) Create a fresh React app (e.g., using Vite or Create React App)
// 2) Replace App.jsx / App.jsx content with this file and import into index.js
// 3) `npm install` then `npm run dev` (Vite) or `npm start` (CRA)

const DUMMY_USER = { username: "user", password: "pass" };

const SAMPLE_PRODUCTS = [
    { id: 1, title: "Куртка кожаная (пермиум)", category: "Верхняя одежда", price: 129, store: "ModaHub" },
    { id: 2, title: "Джинсы синие", category: "Джинсы", price: 59, store: "BlueDenim" },
    { id: 3, title: "Свитер вязаный", category: "Толстовки и свитеры", price: 49, store: "Knit&Co" },
    { id: 4, title: "Платье летнее", category: "Платья", price: 79, store: "SunnyWear" },
    { id: 5, title: "Футболка базовая", category: "Футболки", price: 19, store: "Basics" },
    { id: 6, title: "Кроссовки спортивные", category: "Обувь", price: 89, store: "RunFast" },
    { id: 7, title: "Пальто зимнее", category: "Верхняя одежда", price: 159, store: "WarmCo" },
    { id: 8, title: "Шорты джинсовые", category: "Шорты", price: 29, store: "BlueDenim" },
    { id: 9, title: "Рубашка хлопковая", category: "Рубашки", price: 34, store: "FormalLook" },
];

function useLocalStorage(key, initial) {
    const [state, setState] = useState(() => {
        try {
            const s = localStorage.getItem(key);
            return s ? JSON.parse(s) : initial;
        } catch (e) {
            return initial;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {}
    }, [key, state]);
    return [state, setState];
}

export default function App() {
    const [auth, setAuth] = useLocalStorage("auth", { logged: false, user: null });
    const [cart, setCart] = useLocalStorage("cart", {});
    const [products] = useState(SAMPLE_PRODUCTS);
    const [categoryFilter, setCategoryFilter] = useState("Все категории");
    const [query, setQuery] = useState("");
    const [view, setView] = useState("shop"); // shop | product | cart
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Derived categories
    const categories = ["Все категории", ...Array.from(new Set(products.map((p) => p.category)))];

    function login(username, password) {
        if (username === DUMMY_USER.username && password === DUMMY_USER.password) {
            setAuth({ logged: true, user: { username } });
            return { ok: true };
        }
        return { ok: false, message: "Неверный логин или пароль" };
    }

    function logout() {
        setAuth({ logged: false, user: null });
        setCart({});
    }

    function addToCart(product, qty = 1) {
        setCart((prev) => {
            const copy = { ...prev };
            if (!copy[product.id]) copy[product.id] = { ...product, qty: 0 };
            copy[product.id].qty += qty;
            return copy;
        });
    }

    function removeFromCart(productId) {
        setCart((prev) => {
            const copy = { ...prev };
            delete copy[productId];
            return copy;
        });
    }

    function setQty(productId, qty) {
        setCart((prev) => {
            const copy = { ...prev };
            if (!copy[productId]) return prev;
            if (qty <= 0) delete copy[productId];
            else copy[productId].qty = qty;
            return copy;
        });
    }

    function clearCart() {
        setCart({});
    }

    const filtered = products.filter((p) => {
        if (categoryFilter !== "Все категории" && p.category !== categoryFilter) return false;
        if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
    });

    const cartItems = Object.values(cart);
    const cartTotal = cartItems.reduce((s, it) => s + it.price * it.qty, 0);

    return (
        <div style={styles.page}>
            <Header
                auth={auth}
                onLogout={logout}
                cartCount={cartItems.reduce((s, it) => s + it.qty, 0)}
                onOpenCart={() => setView("cart")}
                onOpenShop={() => setView("shop")}
            />
            <main style={styles.main}>
                {!auth.logged ? (
                    <Login onLogin={(u, p) => login(u, p)} onSuccess={() => { const res = login; /* no-op */ }} />
                ) : (
                    <div style={styles.container}>
                        <aside style={styles.sidebar}>
                            <h3>Категории</h3>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={styles.select}
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>

                            <div style={{ marginTop: 12 }}>
                                <h4>Поиск</h4>
                                <input
                                    placeholder="По названию..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    style={styles.input}
                                />
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <h4>Доступные магазины</h4>
                                <ul style={{ paddingLeft: 18 }}>
                                    {Array.from(new Set(products.map((p) => p.store))).map((s) => (
                                        <li key={s}>{s}</li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <button style={styles.btn} onClick={() => { setCategoryFilter("Все категории"); setQuery(""); }}>
                                    Сброс фильтров
                                </button>
                            </div>
                        </aside>

                        <section style={styles.content}>
                            <div style={styles.toolbar}>
                                <h2>Каталог одежды</h2>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <div>Привет, <b>{auth.user?.username}</b></div>
                                    <button style={styles.smallBtn} onClick={() => { logout(); }}>
                                        Выйти
                                    </button>
                                    <button style={styles.smallBtn} onClick={() => setView("cart")}>
                                        Корзина ({cartItems.reduce((s, it) => s + it.qty, 0)})
                                    </button>
                                </div>
                            </div>

                            <div style={styles.grid}>
                                {filtered.map((p) => (
                                    <div key={p.id} style={styles.card}>
                                        <div style={styles.imgPlaceholder}>Фото</div>
                                        <div style={{ padding: 8 }}>
                                            <h3 style={{ margin: "4px 0" }}>{p.title}</h3>
                                            <div style={{ fontSize: 13, color: "#555" }}>{p.category} • {p.store}</div>
                                            <div style={{ marginTop: 8, fontWeight: 700 }}>${p.price}</div>
                                            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                                <button
                                                    style={styles.btn}
                                                    onClick={() => { addToCart(p, 1); }}
                                                >
                                                    Добавить в корзину
                                                </button>
                                                <button
                                                    style={styles.linkBtn}
                                                    onClick={() => { setSelectedProduct(p); setView("product"); }}
                                                >
                                                    Подробнее
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filtered.length === 0 && (
                                    <div style={{ padding: 20 }}>Ничего не найдено по текущим фильтрам.</div>
                                )}
                            </div>
                        </section>

                        <aside style={styles.rightbar}>
                            <CartSummary
                                items={cartItems}
                                total={cartTotal}
                                onRemove={removeFromCart}
                                onSetQty={setQty}
                                onClear={clearCart}
                                onGoToCart={() => setView("cart")}
                            />
                        </aside>
                    </div>
                )}

                {auth.logged && view === "product" && selectedProduct && (
                    <ProductModal product={selectedProduct} onClose={() => setView("shop")} onAdd={(p) => { addToCart(p, 1); setView("shop"); }} />
                )}

                {auth.logged && view === "cart" && (
                    <CartPage
                        items={cartItems}
                        total={cartTotal}
                        onRemove={removeFromCart}
                        onSetQty={setQty}
                        onCheckout={() => { alert('Фиктивная оплата: спасибо за покупку!'); clearCart(); setView('shop'); }}
                        onClose={() => setView('shop')}
                    />
                )}
            </main>

            <footer style={styles.footer}>© Аггрегатор магазинов одежды — макет интерфейса</footer>
        </div>
    );
}

function Header({ auth, onLogout, cartCount, onOpenCart, onOpenShop }) {
    return (
        <header style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={styles.logo}>AGG-CLOTH</div>
                <nav style={styles.nav}>
                    <button style={styles.navBtn} onClick={onOpenShop}>Каталог</button>
                    <button style={styles.navBtn} onClick={onOpenCart}>Корзина ({cartCount})</button>
                </nav>
            </div>
            <div style={{ fontSize: 14, color: "#fff" }}>{auth.logged ? `Вы вошли как ${auth.user.username}` : "Пожалуйста, войдите"}</div>
        </header>
    );
}

function Login({ onLogin }) {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState(null);

    function submit(e) {
        e.preventDefault();
        if (!user || !pass) {
            setError("Введите логин и пароль");
            return;
        }
        if (user === DUMMY_USER.username && pass === DUMMY_USER.password) {
            onLogin(user, pass);
            setError(null);
        } else {
            setError("Неверный логин или пароль (hint: user / pass)");
        }
    }

    return (
        <div style={styles.loginWrap}>
            <form onSubmit={submit} style={styles.loginCard}>
                <h2>Вход в агрегатор</h2>
                <label style={styles.label}>Логин</label>
                <input style={styles.input} value={user} onChange={(e) => setUser(e.target.value)} />
                <label style={styles.label}>Пароль</label>
                <input style={styles.input} type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
                {error && <div style={styles.error}>{error}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button style={styles.btn} type="submit">Войти</button>
                    <button style={styles.ghostBtn} type="button" onClick={() => { setUser('user'); setPass('pass'); }}>
                        Заполнить подсказку
                    </button>
                </div>
            </form>
            <div style={{ marginTop: 12, color: '#444' }}>
                <b>Примечание:</b> Это статический макет — реальной аутентификации нет.
            </div>
        </div>
    );
}

function CartSummary({ items, total, onRemove, onSetQty, onClear, onGoToCart }) {
    return (
        <div style={styles.cartSummary}>
            <h3>Корзина</h3>
            {items.length === 0 ? (
                <div>Корзина пуста</div>
            ) : (
                <div>
                    {items.slice(0, 4).map((it) => (
                        <div key={it.id} style={styles.cartRow}>
                            <div style={{ fontWeight: 600 }}>{it.title}</div>
                            <div style={{ fontSize: 13 }}>{it.qty} x ${it.price}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <button style={styles.smallBtn} onClick={() => onSetQty(it.id, it.qty - 1)}>-</button>
                                <button style={styles.smallBtn} onClick={() => onSetQty(it.id, it.qty + 1)}>+</button>
                                <button style={styles.linkBtn} onClick={() => onRemove(it.id)}>Удалить</button>
                            </div>
                        </div>
                    ))}
                    {items.length > 4 && <div style={{ marginTop: 8, fontSize: 13 }}>И ещё {items.length - 4} товаров...</div>}
                    <div style={{ marginTop: 12, fontWeight: 700 }}>Итого: ${total.toFixed(2)}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button style={styles.btn} onClick={onGoToCart}>Открыть корзину</button>
                        <button style={styles.ghostBtn} onClick={onClear}>Очистить</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProductModal({ product, onClose, onAdd }) {
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <h2>{product.title}</h2>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={styles.imgLarge}>Фото</div>
                    <div>
                        <div>Категория: {product.category}</div>
                        <div>Магазин: {product.store}</div>
                        <div style={{ marginTop: 8, fontWeight: 700 }}>${product.price}</div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <button style={styles.btn} onClick={() => onAdd(product)}>Добавить в корзину</button>
                            <button style={styles.ghostBtn} onClick={onClose}>Закрыть</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CartPage({ items, total, onRemove, onSetQty, onCheckout, onClose }) {
    return (
        <div style={{ padding: 20 }}>
            <h2>Ваша корзина</h2>
            {items.length === 0 ? (
                <div>Корзина пуста.</div>
            ) : (
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                            <th>Товар</th>
                            <th>Цена</th>
                            <th>Кол-во</th>
                            <th>Сумма</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((it) => (
                            <tr key={it.id} style={{ borderBottom: '1px solid #f4f4f4' }}>
                                <td style={{ padding: '8px 0' }}>{it.title}</td>
                                <td>${it.price}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <button style={styles.smallBtn} onClick={() => onSetQty(it.id, it.qty - 1)}>-</button>
                                        <div>{it.qty}</div>
                                        <button style={styles.smallBtn} onClick={() => onSetQty(it.id, it.qty + 1)}>+</button>
                                    </div>
                                </td>
                                <td>${(it.price * it.qty).toFixed(2)}</td>
                                <td><button style={styles.linkBtn} onClick={() => onRemove(it.id)}>Удалить</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: 12, fontWeight: 700 }}>Итого: ${total.toFixed(2)}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button style={styles.btn} onClick={onCheckout}>Оформить заказ</button>
                        <button style={styles.ghostBtn} onClick={onClose}>Продолжить покупки</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { fontFamily: 'Inter, Roboto, Arial, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { background: '#3b82f6', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { fontWeight: 800, letterSpacing: 1 },
    nav: { display: 'flex', gap: 8 },
    navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' },
    main: { flex: 1, padding: 20 },
    container: { display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: 16 },
    sidebar: { background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
    rightbar: { background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
    content: { background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 },
    card: { background: '#fafafa', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' },
    imgPlaceholder: { background: '#eaeaea', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' },
    imgLarge: { background: '#eaeaea', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    footer: { padding: 12, textAlign: 'center', fontSize: 13, color: '#666' },
    loginWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    loginCard: { width: 420, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' },
    label: { fontSize: 13, marginTop: 8 },
    input: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', marginTop: 6 },
    btn: { background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' },
    ghostBtn: { background: 'transparent', color: '#111827', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' },
    smallBtn: { background: '#fff', border: '1px solid #ddd', padding: '6px 8px', borderRadius: 6, cursor: 'pointer' },
    linkBtn: { background: 'transparent', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' },
    cartSummary: { minHeight: 120 },
    cartRow: { marginTop: 8, paddingBottom: 8, borderBottom: '1px dashed #eee' },
    modalOverlay: { position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 },
    modal: { background: '#fff', padding: 20, borderRadius: 8, width: 700, maxWidth: '95%' },
    select: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' },
    error: { marginTop: 8, color: '#b91c1c' }
};
