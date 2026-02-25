import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMapPin, FiLogOut, FiEdit2, FiCheck, FiShoppingBag, FiX, FiMail } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { getUserOrders } from '../services/api';
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

export default function Profile() {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', address: user?.address || '' });
    const [saved, setSaved] = useState(false);
    const [editError, setEditError] = useState('');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        if (user?.id) {
            setLoadingOrders(true);
            getUserOrders(user.id)
                .then(res => setOrders(res.data || []))
                .catch(() => { })
                .finally(() => setLoadingOrders(false));
        }
    }, [user?.id]);

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
        } catch (err) {
            setEditError(err.message);
        }
    };

    const handleLogout = () => { logout(); showToast('Đã đăng xuất', '👋'); navigate('/'); };

    return (
        <div className="profile-page">
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
                            <div className="edit-field">
                                <FiUser size={14} />
                                <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Họ và tên *" />
                            </div>
                            <div className="edit-field">
                                <FiPhone size={14} />
                                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Số điện thoại" />
                            </div>
                            <div className="edit-field">
                                <FiMapPin size={14} />
                                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Địa chỉ nhận hàng" />
                            </div>
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
                                        <div className="order-card-footer">
                                            <div className="order-address">
                                                <FiMapPin size={12} />
                                                <span>{order.customer_address}</span>
                                            </div>
                                            <div className="order-total">Tổng: <strong>{formatPrice(order.total_price)}</strong></div>
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
