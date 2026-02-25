// Tất cả API calls đến backend đều qua file này
const BASE_URL = 'http://localhost:3001/api';

// ── Helper fetch ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi server');
    return data;
}

// ── Products ─────────────────────────────────────────────────
export const getProducts = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/products${qs ? '?' + qs : ''}`);
};
export const getProduct = (id) => apiFetch(`/products/${id}`);

// ── Categories ────────────────────────────────────────────────
export const getCategories = () => apiFetch('/categories');

// ── Testimonials ──────────────────────────────────────────────
export const getTestimonials = () => apiFetch('/reviews/recent');

// ── Orders ────────────────────────────────────────────────────
export const createOrder = (orderData) =>
    apiFetch('/orders', { method: 'POST', body: JSON.stringify(orderData) });

export const getUserOrders = (userId) => apiFetch(`/orders/user/${userId}`);
export const getOrderDetail = (id) => apiFetch(`/orders/${id}`);

// ── Auth ──────────────────────────────────────────────────────
export const register = (data) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const login = (data) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) });

export const getMe = () => apiFetch('/auth/me');

export const updateProfile = (data) =>
    apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });

// ── Reviews ───────────────────────────────────────────────────
export const getReviews = (productId, page = 1) =>
    apiFetch(`/reviews?product_id=${productId}&page=${page}&limit=10`);

export const postReview = (data) =>
    apiFetch('/reviews', { method: 'POST', body: JSON.stringify(data) });

export const checkReviewed = (productId) =>
    apiFetch(`/reviews/check?product_id=${productId}`);

export const getMyReviews = () => apiFetch('/reviews/my-reviews');

// ── Wishlist ──────────────────────────────────────────────────
export const getWishlist = () => apiFetch('/wishlist');

export const getWishlistIds = () => apiFetch('/wishlist/ids');

export const toggleWishlist = (productId) =>
    apiFetch(`/wishlist/${productId}`, { method: 'POST' });
