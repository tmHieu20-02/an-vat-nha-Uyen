import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMapPin, FiLogOut, FiEdit2, FiCheck, FiShoppingBag, FiX, FiMail, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { getUserOrders, postReview, getMyReviews } from '../services/api';
import { showToast } from '../components/Toast';
import './Profile.css';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatPrice(n) { return Number(n).toLocaleString('vi-VN') + '₫'; }

const PAY_LABEL = { cod: '💵 Tiền mặt', momo: '💜 MoMo', bank: '🏦 Chuyển khoản' };
const STATUS_LABEL = {
    pending: { label: '⏳ Chờ xác nhận', cls: 'status-pending' },
    confirmed: { label: '✅ Đã xác nhận', cls: 'status-confirmed' },
    shipping: { label: '🚚 Đang giao', cls: 'status-shipping' },
    done: { label: '🎉 Hoàn thành', cls: 'status-done' },
    cancelled: { label: '❌ Đã huỷ', cls: 'status-cancelled' },
};
const IMG_BASE = 'http://localhost:3001';

// ── ReviewModal ───────────────────────────────────────────────────
function ReviewModal({ items, onClose, onDone }) {
    const [step, setStep] = useState(0); // index trong mảng items chưa đánh giá
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const item = items[step];

    const handleSubmit = async () => {
        if (!rating) { showToast('Vui lòng chọn số sao', '⭐', 'error'); return; }
        if (!comment.trim()) { showToast('Vui lòng nhập nhận xét', '✍️', 'error'); return; }
        setSubmitting(true);
        try {
            const res = await postReview({ product_id: item.product_id, rating, comment });
            showToast(res.message || 'Cảm ơn đánh giá!', '⭐');
            onDone(item.product_id);
            if (step + 1 < items.length) {
                setStep(s => s + 1);
                setRating(0); setComment('');
            } else {
                onClose();
            }
        } catch (err) {
            showToast(err.message || 'Lỗi gửi đánh giá', '❌', 'error');
        } finally { setSubmitting(false); }
    };

    if (!item) return null;

    return (
        <div className="modal-overlay review-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="review-modal">
                <div className="review-modal__header">
                    <h3>⭐ Đánh giá sản phẩm</h3>
                    <button className="modal-close-x" onClick={onClose}><FiX size={20} /></button>
                </div>
                {items.length > 1 && (
                    <p className="review-modal__progress">{step + 1} / {items.length} sản phẩm</p>
                )}
                <div className="review-modal__product">
                    {item.image
                        ? <img src={IMG_BASE + item.image} alt={item.name} className="review-modal__img" />
                        : <span className="review-modal__emoji">{item.emoji}</span>
                    }
                    <span className="review-modal__product-name">{item.name}</span>
                </div>

                {/* Stars */}
                <div className="review-modal__stars">
                    {[1, 2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            className="star-btn"
                            onMouseEnter={() => setHovered(n)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setRating(n)}
                            aria-label={`${n} sao`}
                        >
                            <FiStar
                                size={30}
                                fill={(hovered || rating) >= n ? 'var(--secondary-dark)' : 'none'}
                                stroke={(hovered || rating) >= n ? 'var(--secondary-dark)' : 'var(--text-light)'}
                            />
                        </button>
                    ))}
                    <span className="star-label">
                        {['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'][hovered || rating] || ''}
                    </span>
                </div>

                <textarea
                    className="review-modal__textarea"
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={4}
                />

                <button
                    className="review-modal__submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? '⏳ Đang gửi...' : (step + 1 < items.length ? 'Gửi & đánh giá tiếp ›' : '✅ Gửi đánh giá')}
                </button>
            </div>
        </div>
    );
}

// ── Profile page ──────────────────────────────────────────────────
export default function Profile() {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', address: user?.address || '' });
    const [saved, setSaved] = useState(false);
    const [editError, setEditError] = useState('');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [reviewModal, setReviewModal] = useState(null); // { items: [{product_id, name, emoji, image}] }
    const [reviewed, setReviewed] = useState(new Set()); // product_ids user đã đánh giá

    const fetchOrders = useCallback(() => {
        if (!user?.id) return;
        setLoadingOrders(true);
        getUserOrders(user.id)
            .then(res => setOrders(res.data || []))
            .catch(() => { })
            .finally(() => setLoadingOrders(false));
    }, [user?.id]);

    // Load reviewed product IDs on mount → persist qua refresh
    useEffect(() => {
        if (!user?.id) return;
        getMyReviews()
            .then(res => { if (res.success && res.data?.length) setReviewed(new Set(res.data)); })
            .catch(() => { });
    }, [user?.id]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-empty">
                    <span>🔒</span>
                    <h2>Bạn chưa đăng nhập</h2>
                    <Link to="/login" className="btn btn-primary">Đăng nhập ngay</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const handleSave = async (e) => {
        e.preventDefault();
        setEditError('');
        if (!form.full_name) { setEditError('Vui lòng nhập họ tên!'); return; }
        try {
            await updateProfile(form);
            setSaved(true);
            setEditing(false);
            showToast('Đã lưu thông tin!', '✅');
            setTimeout(() => setSaved(false), 2000);
        } catch (err) { setEditError(err.message); }
    };

    const handleLogout = () => { logout(); showToast('Đã đăng xuất', '👋'); navigate('/'); };

    const openReviewModal = (order) => {
        const names = (order.product_names || '').split('|||');
        const ids = (order.product_ids || '').split('|||');
        const emojis = (order.product_emojis || '').split('|||');
        const images = (order.product_images || '').split('|||');
        const items = names.map((name, i) => ({
            product_id: parseInt(ids[i]) || 0,
            name,
            emoji: emojis[i] || '🛍️',
            image: images[i] || '',
        })).filter(it => it.product_id > 0 && !reviewed.has(it.product_id));
        if (!items.length) { showToast('Bạn đã đánh giá tất cả sản phẩm trong đơn này!', '✅'); return; }
        setReviewModal({ items });
    };

    const onReviewDone = (productId) => {
        setReviewed(prev => new Set([...prev, productId]));
    };

    return (
        <div className="profile-page">
            {reviewModal && (
                <ReviewModal
                    items={reviewModal.items}
                    onClose={() => setReviewModal(null)}
                    onDone={onReviewDone}
                />
            )}

            <div className="profile-header-bar">
                <div className="container">
                    <h1>👤 Tài khoản của tôi</h1>
                    <button className="logout-btn" onClick={handleLogout}>
                        <FiLogOut size={15} /> Đăng xuất
                    </button>
                </div>
            </div>

            <div className="container profile-body">
                {/* Info card */}
                <div className="profile-info-card">
                    <div className="info-card-header">
                        <div className="avatar">{(user.full_name || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                            <h2 className="user-name">{user.full_name}</h2>
                            <p className="user-phone"><FiPhone size={13} /> {user.phone || 'Chưa có SĐT'}</p>
                            <p className="user-phone"><FiMail size={13} /> {user.email}</p>
                        </div>
                        {!editing && (
                            <button className="edit-btn" onClick={() => setEditing(true)}>
                                <FiEdit2 size={14} /> Sửa
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form className="edit-form" onSubmit={handleSave}>
                            {editError && <p className="edit-error">⚠️ {editError}</p>}
                            <div className="edit-field"><FiUser size={14} /><input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Họ và tên *" /></div>
                            <div className="edit-field"><FiPhone size={14} /><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Số điện thoại" /></div>
                            <div className="edit-field"><FiMapPin size={14} /><input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Địa chỉ nhận hàng" /></div>
                            <div className="edit-actions">
                                <button type="submit" className="btn btn-primary edit-save"><FiCheck size={14} /> Lưu</button>
                                <button type="button" className="edit-cancel" onClick={() => setEditing(false)}><FiX size={14} /> Hủy</button>
                            </div>
                        </form>
                    ) : (
                        <div className="info-rows">
                            <div className="info-row"><FiMapPin size={14} /><span>{user.address || 'Chưa có địa chỉ'}</span></div>
                            {saved && <p className="save-success">✅ Đã lưu thông tin!</p>}
                        </div>
                    )}
                </div>

                {/* Order history */}
                <div className="order-history">
                    <h3 className="history-title"><FiShoppingBag size={18} /> Lịch sử đơn hàng ({orders.length})</h3>

                    {loadingOrders && <p style={{ textAlign: 'center', padding: '20px' }}>⏳ Đang tải đơn hàng...</p>}

                    {!loadingOrders && orders.length === 0 && (
                        <div className="orders-empty">
                            <span>📦</span>
                            <p>Bạn chưa có đơn hàng nào</p>
                            <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
                        </div>
                    )}

                    {!loadingOrders && orders.length > 0 && (
                        <div className="orders-list">
                            {orders.map(order => {
                                const st = STATUS_LABEL[order.status] || { label: order.status, cls: '' };
                                const names = (order.product_names || '').split('|||');
                                const qtys = (order.product_qtys || '').split('|||');
                                const emojis = (order.product_emojis || '').split('|||');
                                const images = (order.product_images || '').split('|||');
                                const canReview = order.status === 'done';

                                return (
                                    <div key={order.id} className="order-card">
                                        <div className="order-card-header">
                                            <div>
                                                <span className="order-id">Đơn #{String(order.id).padStart(6, '0')}</span>
                                                <span className="order-date">{formatDate(order.created_at)}</span>
                                            </div>
                                            <div className="order-meta">
                                                <span className="order-pay">{PAY_LABEL[order.payment_method] || order.payment_method}</span>
                                                <span className={`order-status ${st.cls}`}>{st.label}</span>
                                            </div>
                                        </div>

                                        {/* Items with photos */}
                                        {order.product_names && (
                                            <ul className="order-items-list">
                                                {names.map((name, i) => (
                                                    <li key={i}>
                                                        {images[i]
                                                            ? <img src={`${IMG_BASE}${images[i]}`} alt={name} className="oi-img" />
                                                            : <span className="oi-emoji">{emojis[i] || '🛍️'}</span>
                                                        }
                                                        <span className="oi-name">{name}</span>
                                                        <span className="oi-qty">×{qtys[i] || 1}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <div className="order-card-footer">
                                            <div className="order-address">
                                                <FiMapPin size={12} />
                                                <span>{order.customer_address}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                                {order.total_qty ? <span className="order-qty">{order.total_qty} sp · </span> : ''}
                                                <div className="order-total">Tổng: <strong>{formatPrice(order.total_price)}</strong></div>
                                                {canReview && (() => {
                                                    const ids = (order.product_ids || '').split('|||').map(Number).filter(Boolean);
                                                    const allReviewed = ids.length > 0 && ids.every(id => reviewed.has(id));
                                                    return allReviewed
                                                        ? <span className="badge-reviewed">✅ Đã đánh giá</span>
                                                        : <button className="btn-review" onClick={() => openReviewModal(order)}>
                                                            <FiStar size={13} fill="currentColor" /> Đánh giá
                                                        </button>;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
