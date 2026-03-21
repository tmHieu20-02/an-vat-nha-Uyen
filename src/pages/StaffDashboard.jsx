import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiPackage, FiShoppingBag, FiUsers, FiLogOut,
    FiCheck, FiTruck, FiX, FiRefreshCw, FiDollarSign,
    FiPlus, FiEdit2, FiTrash2, FiUpload, FiImage
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import './StaffDashboard.css';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/staff` : 'http://localhost:3001/api/staff';
const IMG_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

const authFetch = (url, opts = {}) => {
    const token = localStorage.getItem('token');
    return fetch(url, {
        ...opts,
        headers: { Authorization: `Bearer ${token}`, ...opts.headers },
    }).then(r => r.json());
};

const STATUS_INFO = {
    pending: { label: 'Chờ xác nhận', color: '#F59E0B', icon: '⏳' },
    confirmed: { label: 'Đã xác nhận', color: '#3B82F6', icon: '✅' },
    shipping: { label: 'Đang giao', color: '#8B5CF6', icon: '🚚' },
    done: { label: 'Hoàn thành', color: '#22C55E', icon: '🎉' },
    cancelled: { label: 'Đã huỷ', color: '#EF4444', icon: '❌' },
};

function fmt(n) { return Number(n).toLocaleString('vi-VN') + '₫'; }
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Product Form Modal ───────────────────────────────────────
function ProductModal({ product, categories, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: product?.name || '',
        category_id: product?.category_id || '',
        price: product?.price || '',
        original_price: product?.original_price || '',
        description: product?.description || '',
        emoji: product?.emoji || '🍿',
        color: product?.color || '#FF9B85',
        badge: product?.badge || '',
        stock: product?.stock !== undefined ? product.stock : -1,
        is_active: product?.is_active !== undefined ? product.is_active : 1,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(product?.image_url ? IMG_BASE + product.image_url : null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.category_id || !form.price || !form.description || !form.emoji) {
            showToast('Vui lòng điền đủ thông tin!', '⚠️', 'error'); return;
        }
        setSaving(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (imageFile) fd.append('image', imageFile);

        const token = localStorage.getItem('token');
        const url = product ? `${BASE}/products/${product.id}` : `${BASE}/products`;
        const method = product ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd }).then(r => r.json());
        setSaving(false);

        if (res.success) {
            showToast(product ? 'Đã cập nhật sản phẩm!' : 'Đã thêm sản phẩm!', '✅');
            onSaved();
            onClose();
        } else {
            showToast(res.message, '❌', 'error');
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2>{product ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}</h2>
                    <button className="modal-close" onClick={onClose}><FiX size={20} /></button>
                </div>

                <form className="product-form" onSubmit={handleSubmit}>
                    {/* Image upload */}
                    <div className="form-image-section">
                        <div className="img-preview" onClick={() => fileRef.current.click()}>
                            {imagePreview
                                ? <img src={imagePreview} alt="preview" />
                                : <div className="img-placeholder"><FiImage size={36} /><span>Click để chọn ảnh</span></div>
                            }
                            <div className="img-overlay"><FiUpload size={22} /> Đổi ảnh</div>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} hidden />
                        <small>JPG/PNG/WEBP · Tối đa 5MB</small>
                    </div>

                    <div className="form-grid">
                        <div className="form-group full">
                            <label>Tên sản phẩm *</label>
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Bim bim phô mai" />
                        </div>

                        <div className="form-group">
                            <label>Danh mục *</label>
                            <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Emoji hiển thị *</label>
                            <input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} placeholder="🍿" maxLength={2} />
                        </div>

                        <div className="form-group">
                            <label>Giá bán (₫) *</label>
                            <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="45000" min="0" />
                        </div>

                        <div className="form-group">
                            <label>Giá gốc (₫) <small>— để tính % giảm</small></label>
                            <input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} placeholder="60000" min="0" />
                        </div>

                        <div className="form-group">
                            <label>Badge</label>
                            <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}>
                                <option value="">Không có</option>
                                <option value="Bán chạy">🔥 Bán chạy</option>
                                <option value="Mới">✨ Mới</option>
                                <option value="Healthy">🥗 Healthy</option>
                                <option value="Cao cấp">💎 Cao cấp</option>
                                <option value="Hot">🌶️ Hot</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Màu card</label>
                            <div className="color-row">
                                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
                                <span>{form.color}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Trạng thái</label>
                            <select value={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: parseInt(e.target.value) }))}>
                                <option value={1}>✅ Hiển thị</option>
                                <option value={0}>🚫 Ẩn</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Tồn kho <small>(-1 = không giới hạn)</small></label>
                            <input
                                type="number"
                                value={form.stock}
                                onChange={e => setForm(p => ({ ...p, stock: parseInt(e.target.value) }))}
                                min={-1}
                                placeholder="-1"
                            />
                        </div>

                        <div className="form-group full">
                            <label>Mô tả *</label>
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Mô tả sản phẩm..." />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel-modal" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-save-modal" disabled={saving}>
                            {saving ? '⏳ Đang lưu...' : <><FiCheck size={15} /> {product ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Order Detail Modal ────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate }) {
    const [items, setItems] = useState([]);
    const [updating, setUpdating] = useState('');

    useEffect(() => {
        authFetch(`${BASE}/orders/${order.id}`)
            .then(res => { if (res.success) setItems(res.data.items || []); });
    }, [order.id]);

    const update = async (status) => {
        setUpdating(status);
        const res = await authFetch(`${BASE}/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        setUpdating('');
        if (res.success) { showToast(res.message, '✅'); onUpdate(); onClose(); }
        else showToast(res.message, '❌', 'error');
    };

    const st = STATUS_INFO[order.status];

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box order-modal">
                <div className="modal-header">
                    <h2>📦 Đơn #{String(order.id).padStart(6, '0')}</h2>
                    <button className="modal-close" onClick={onClose}><FiX size={20} /></button>
                </div>

                <div className="order-detail">
                    <div className="order-info-grid">
                        <div><strong>Khách hàng:</strong> {order.customer_name}</div>
                        <div><strong>SĐT:</strong> {order.customer_phone}</div>
                        <div><strong>Địa chỉ:</strong> {order.customer_address}</div>
                        <div><strong>Thanh toán:</strong> {order.payment_method?.toUpperCase()}</div>
                        <div><strong>Thời gian:</strong> {fmtDate(order.created_at)}</div>
                        <div><strong>Trạng thái:</strong> <span className="status-badge" style={{ background: st?.color }}>{st?.icon} {st?.label}</span></div>
                        {order.note && <div className="full"><strong>Ghi chú:</strong> {order.note}</div>}
                    </div>

                    <div className="table-wrapper">
                        <table className="items-table">
                            <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
                            <tbody>
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {item.product_image_url
                                                ? <img src={IMG_BASE + item.product_image_url} alt={item.product_name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #334155', flexShrink: 0 }} />
                                                : <span style={{ fontSize: '1.4rem', width: 36, textAlign: 'center' }}>{item.emoji}</span>
                                            }
                                            {item.product_name}
                                        </td>
                                        <td>{fmt(item.price)}</td>
                                        <td>{item.qty}</td>
                                        <td>{fmt(item.price * item.qty)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr><td colSpan={3}><strong>Tổng cộng</strong></td><td><strong>{fmt(order.total_price)}</strong></td></tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Action buttons */}
                    <div className="order-action-row">
                        {order.status === 'pending' && <>
                            <button className="order-action-btn confirm" onClick={() => update('confirmed')} disabled={!!updating}>
                                {updating === 'confirmed' ? '...' : <><FiCheck /> Xác nhận đơn</>}
                            </button>
                            <button className="order-action-btn reject" onClick={() => update('cancelled')} disabled={!!updating}>
                                {updating === 'cancelled' ? '...' : <><FiX /> Từ chối đơn</>}
                            </button>
                        </>}
                        {order.status === 'confirmed' && (
                            <button className="order-action-btn ship" onClick={() => update('shipping')} disabled={!!updating}>
                                {updating === 'shipping' ? '...' : <><FiTruck /> Bắt đầu giao hàng</>}
                            </button>
                        )}
                        {order.status === 'shipping' && (
                            <button className="order-action-btn done" onClick={() => update('done')} disabled={!!updating}>
                                {updating === 'done' ? '...' : <><FiCheck /> Đã giao – Hoàn thành</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function StaffDashboard() {
    const { user, isStaff, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [productModal, setProductModal] = useState(null); // null | 'new' | product obj
    const [orderModal, setOrderModal] = useState(null);

    if (!user || !isStaff) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: '#e2e8f0', background: '#0f172a', minHeight: '100vh' }}>
                <h2>🔒 Không có quyền truy cập</h2>
                <p>Trang này chỉ dành cho nhân viên và quản trị viên.</p>
                <Link to="/" style={{ color: '#FF6B2B' }}>← Về trang chủ</Link>
            </div>
        );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        authFetch(`${BASE}/categories`).then(r => { if (r.success) setCategories(r.data); });
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (activeTab === 'dashboard') load('dashboard');
        if (activeTab === 'orders') load('orders');
        if (activeTab === 'products') load('products');
        if (activeTab === 'customers') load('customers');
    }, [activeTab, filterStatus]);

    const load = async (tab) => {
        setLoading(true);
        try {
            if (tab === 'dashboard') {
                const r = await authFetch(`${BASE}/dashboard`);
                if (r.success) setStats(r.data);
            } else if (tab === 'orders') {
                const url = filterStatus ? `${BASE}/orders?status=${filterStatus}` : `${BASE}/orders`;
                const r = await authFetch(url);
                if (r.success) setOrders(r.data);
            } else if (tab === 'products') {
                const r = await authFetch(`${BASE}/products`);
                if (r.success) setProducts(r.data);
            } else if (tab === 'customers') {
                const r = await authFetch(`${BASE}/customers`);
                if (r.success) setCustomers(r.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('Không thể kết nối với server', '❌', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (p) => {
        if (!confirm(`Xoá sản phẩm "${p.name}"? Hành động này không thể hoàn tác.`)) return;
        const res = await authFetch(`${BASE}/products/${p.id}`, { method: 'DELETE' });
        if (res.success) { showToast('Đã xoá sản phẩm', '🗑️'); load('products'); }
        else showToast(res.message, '❌', 'error');
    };

    const toggleActive = async (p) => {
        const fd = new FormData();
        fd.append('is_active', p.is_active ? 0 : 1);
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE}/products/${p.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd }).then(r => r.json());
        if (res.success) { showToast('Đã cập nhật!', '✅'); load('products'); }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    const tabs = [
        { id: 'dashboard', label: 'Tổng quan', icon: <FiDollarSign /> },
        { id: 'orders', label: 'Đơn hàng', icon: <FiShoppingBag /> },
        { id: 'products', label: 'Sản phẩm', icon: <FiPackage /> },
        { id: 'customers', label: 'Khách hàng', icon: <FiUsers /> },
    ];

    return (
        <div className="staff-page">
            {/* Sidebar */}
            <aside className="staff-sidebar">
                <div className="staff-logo">
                    <span className="logo-icon">🍿</span>
                    <span className="nav-text">Staff Panel</span>
                </div>
                <div className="staff-user">
                    <div className="staff-avatar">{user.full_name?.charAt(0)}</div>
                    <div>
                        <p className="staff-name">{user.full_name}</p>
                        <p className="staff-role">{user.role === 'admin' ? '👑 Admin' : '🧑‍💼 Staff'}</p>
                    </div>
                </div>
                <nav className="staff-nav">
                    {tabs.map(t => (
                        <button key={t.id} className={`staff-nav-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            {t.icon} <span className="nav-text">{t.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="staff-footer">
                    <Link to="/" className="staff-nav-btn">
                        <span className="footer-icon">🏠</span>
                        <span className="nav-text">Về shop</span>
                    </Link>
                    <button className="staff-nav-btn logout" onClick={handleLogout}>
                        <FiLogOut size={18} />
                        <span className="nav-text">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="staff-main">
                <div className="staff-topbar">
                    <h1 className="staff-title">{tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}</h1>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {activeTab === 'products' && (
                            <button className="add-product-btn" onClick={() => setProductModal('new')}>
                                <FiPlus size={16} /> Thêm sản phẩm
                            </button>
                        )}
                        <button className="refresh-btn" onClick={() => load(activeTab)}><FiRefreshCw size={16} /></button>
                    </div>
                </div>

                {loading && <div className="staff-loading">⏳ Đang tải...</div>}

                {/* DASHBOARD */}
                {!loading && activeTab === 'dashboard' && stats && (
                    <div className="dashboard-content">
                        <div className="stat-cards">
                            <div className="stat-card" style={{ '--stat-color': '#FF6B2B' }}><span className="stat-icon">📦</span><div><p className="stat-num">{stats.totalOrders}</p><p className="stat-lbl">Tổng đơn hàng</p></div></div>
                            <div className="stat-card" style={{ '--stat-color': '#F59E0B' }}><span className="stat-icon">⏳</span><div><p className="stat-num">{stats.pendingOrders}</p><p className="stat-lbl">Chờ xác nhận</p></div></div>
                            <div className="stat-card" style={{ '--stat-color': '#22C55E' }}><span className="stat-icon">💰</span><div><p className="stat-num">{fmt(stats.totalRevenue)}</p><p className="stat-lbl">Doanh thu</p></div></div>
                            <div className="stat-card" style={{ '--stat-color': '#3B82F6' }}><span className="stat-icon">🛍️</span><div><p className="stat-num">{stats.totalProducts}</p><p className="stat-lbl">Sản phẩm</p></div></div>
                            <div className="stat-card" style={{ '--stat-color': '#8B5CF6' }}><span className="stat-icon">👥</span><div><p className="stat-num">{stats.totalUsers}</p><p className="stat-lbl">Khách hàng</p></div></div>
                        </div>
                        <div className="recent-orders-section">
                            <h3>📋 Đơn hàng gần nhất</h3>
                            <div className="table-wrapper">
                                <table className="orders-table">
                                    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>TT</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
                                    <tbody>
                                        {stats.recentOrders.map(o => {
                                            const st = STATUS_INFO[o.status];
                                            return (
                                                <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setOrderModal(o)}>
                                                    <td>#{String(o.id).padStart(6, '0')}</td>
                                                    <td>{o.customer_name}<br /><small>{o.customer_phone}</small></td>
                                                    <td>{fmt(o.total_price)}</td>
                                                    <td>{o.payment_method?.toUpperCase()}</td>
                                                    <td><span className="status-badge" style={{ background: st?.color }}>{st?.icon} {st?.label}</span></td>
                                                    <td>{fmtDate(o.created_at)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ORDERS */}
                {!loading && activeTab === 'orders' && (
                    <div className="orders-content">
                        <div className="filter-bar">
                            <span>Lọc:</span>
                            {['', ...Object.keys(STATUS_INFO)].map(s => (
                                <button key={s} className={`filter-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                                    {s ? `${STATUS_INFO[s].icon} ${STATUS_INFO[s].label}` : '🔍 Tất cả'}
                                </button>
                            ))}
                        </div>
                        <div className="table-wrapper">
                            <table className="orders-table">
                                <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền</th><th>TT</th><th>Trạng thái</th><th>Nhanh</th></tr></thead>
                                <tbody>
                                    {orders.map(o => {
                                        const st = STATUS_INFO[o.status];
                                        return (
                                            <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setOrderModal(o)}>
                                                <td>#{String(o.id).padStart(6, '0')}<br /><small>{fmtDate(o.created_at)}</small></td>
                                                <td>{o.customer_name}<br /><small>{o.customer_phone}</small></td>
                                                <td>{o.item_count} sp<br /><small style={{ fontSize: 11 }}>{o.products_summary?.slice(0, 40)}{o.products_summary?.length > 40 ? '...' : ''}</small></td>
                                                <td>{fmt(o.total_price)}</td>
                                                <td>{o.payment_method?.toUpperCase()}</td>
                                                <td><span className="status-badge" style={{ background: st?.color }}>{st?.icon} {st?.label}</span></td>
                                                <td onClick={e => e.stopPropagation()}>
                                                    <div className="action-btns">
                                                        {o.status === 'pending' && <>
                                                            <button className="action-btn confirm" onClick={() => {
                                                                authFetch(`${BASE}/orders/${o.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) })
                                                                    .then(() => { showToast('Đã xác nhận!', '✅'); load('orders'); });
                                                            }}><FiCheck size={12} /> Xác nhận</button>
                                                            <button className="action-btn cancel" onClick={() => {
                                                                authFetch(`${BASE}/orders/${o.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
                                                                    .then(() => { showToast('Đã từ chối!', '❌'); load('orders'); });
                                                            }}><FiX size={12} /> Từ chối</button>
                                                        </>}
                                                        {o.status === 'confirmed' && <button className="action-btn ship" onClick={(e) => {
                                                            e.stopPropagation();
                                                            authFetch(`${BASE}/orders/${o.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'shipping' }) })
                                                                .then(() => { showToast('Đang giao!', '🚚'); load('orders'); });
                                                        }}><FiTruck size={12} /> Giao hàng</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {orders.length === 0 && <p className="empty-msg">Không có đơn hàng nào</p>}
                    </div>
                )}

                {/* PRODUCTS */}
                {!loading && activeTab === 'products' && (
                    <div className="products-content">
                        <div className="table-wrapper">
                            <table className="orders-table">
                                <thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Đã bán</th><th>📦 Kho</th><th>⭐</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} className={!p.is_active ? 'row-inactive' : ''}>
                                            <td>
                                                {p.image_url
                                                    ? <img src={IMG_BASE + p.image_url} alt={p.name} className="product-thumb" />
                                                    : <div className="product-thumb-emoji" style={{ background: `${p.color}33` }}>{p.emoji}</div>
                                                }
                                            </td>
                                            <td><strong>{p.name}</strong>{p.badge && <span className="badge-inline">{p.badge}</span>}</td>
                                            <td>{p.category_name}</td>
                                            <td>
                                                {fmt(p.price)}
                                                {p.original_price && <><br /><del style={{ color: '#64748b', fontSize: 11 }}>{fmt(p.original_price)}</del></>}
                                            </td>
                                            <td>{p.sold?.toLocaleString()}</td>
                                            <td style={{
                                                fontWeight: 700,
                                                color: p.stock === 0 ? '#ef4444' : p.stock > 0 && p.stock <= 10 ? '#f59e0b' : '#22c55e'
                                            }}>
                                                {p.stock === -1 ? '∞' : p.stock === 0 ? 'Hết' : p.stock}
                                            </td>
                                            <td>{p.rating}</td>
                                            <td>
                                                <button className={`toggle-btn ${p.is_active ? 'active' : 'inactive'}`} onClick={() => toggleActive(p)}>
                                                    {p.is_active ? '✅ Hiện' : '🚫 Ẩn'}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn confirm" onClick={() => setProductModal(p)}><FiEdit2 size={12} /> Sửa</button>
                                                    <button className="action-btn cancel" onClick={() => deleteProduct(p)}><FiTrash2 size={12} /> Xoá</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CUSTOMERS */}
                {!loading && activeTab === 'customers' && (
                    <div className="customers-content">
                        <div className="table-wrapper">
                            <table className="orders-table">
                                <thead><tr><th>#</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Số đơn</th><th>Chi tiêu</th><th>Tham gia</th></tr></thead>
                                <tbody>
                                    {customers.map(c => (
                                        <tr key={c.id}>
                                            <td>{c.id}</td>
                                            <td>{c.full_name}</td>
                                            <td>{c.email}</td>
                                            <td>{c.phone || '-'}</td>
                                            <td>{c.order_count}</td>
                                            <td>{fmt(c.total_spent)}</td>
                                            <td>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {customers.length === 0 && <p className="empty-msg">Chưa có khách hàng</p>}
                    </div>
                )}
            </main>

            {/* Modals */}
            {productModal && (
                <ProductModal
                    product={productModal === 'new' ? null : productModal}
                    categories={categories}
                    onClose={() => setProductModal(null)}
                    onSaved={() => load('products')}
                />
            )}
            {orderModal && (
                <OrderModal
                    order={orderModal}
                    onClose={() => setOrderModal(null)}
                    onUpdate={() => { load('orders'); load('dashboard'); }}
                />
            )}
        </div>
    );
}
