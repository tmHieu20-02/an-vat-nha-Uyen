import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowLeft, FiCheck, FiUser, FiPhone, FiMapPin, FiLoader } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import Footer from '../components/Footer';
import { showToast } from '../components/Toast';
import { createOrder } from '../services/api';
import './Cart.css';

const PAYMENT_METHODS = [
    { id: 'cod', label: 'Thanh toán khi nhận hàng', desc: 'Trả tiền mặt khi giao hàng đến tay', icon: '💵', color: '#22C55E' },
    { id: 'momo', label: 'Ví MoMo', desc: 'Chuyển khoản qua ứng dụng MoMo', icon: '💜', color: '#AE2070' },
    { id: 'bank', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản qua internet banking', icon: '🏦', color: '#FF6B2B' },
];

export default function Cart() {
    const { items, removeItem, updateQty, clearCart, totalItems, totalPrice } = useCart();
    const [ordered, setOrdered] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [payMethod, setPayMethod] = useState('cod');
    const [formErrors, setFormErrors] = useState({});
    const [info, setInfo] = useState({ name: '', phone: '', address: '', note: '' });

    const shippingFee = totalPrice >= 200000 ? 0 : 30000;
    const grandTotal = totalPrice + shippingFee;

    const validate = () => {
        const errs = {};
        if (!info.name.trim()) errs.name = 'Vui lòng nhập họ tên';
        if (!info.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
        else if (!/^0\d{9}$/.test(info.phone.replace(/\s/g, '')))
            errs.phone = 'SĐT không hợp lệ (VD: 0987654321)';
        if (!info.address.trim()) errs.address = 'Vui lòng nhập địa chỉ nhận hàng';
        return errs;
    };

    const handleOrder = async () => {
        const errs = validate();
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            showToast('Vui lòng điền đầy đủ thông tin!', '⚠️', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // Lấy user_id từ localStorage nếu đã đăng nhập
            const userData = localStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : null;

            await createOrder({
                customer_name: info.name,
                customer_phone: info.phone,
                customer_address: info.address,
                note: info.note,
                payment_method: payMethod,
                user_id: user?.id || null,
                items: items.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    emoji: item.emoji,
                    price: item.price,
                    qty: item.qty,
                })),
            });
            clearCart();
            setOrdered(true);
            showToast('Đặt hàng thành công!', '🎉');
        } catch (err) {
            showToast(err.message || 'Lỗi khi đặt hàng, thử lại!', '❌', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (ordered) {
        return (
            <div className="cart-page">
                <div className="order-success">
                    <div className="success-icon"><FiCheck size={40} /></div>
                    <h2>Đặt hàng thành công! 🎉</h2>
                    <p>Cảm ơn <strong>{info.name}</strong> đã mua hàng tại Ăn Vặt Nhà Pu.<br />
                        Chúng tôi sẽ liên hệ <strong>{info.phone}</strong> để xác nhận đơn sớm nhất!</p>
                    <Link to="/" className="btn btn-primary">Tiếp tục mua sắm</Link>
                </div>
                <Footer />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-empty">
                    <span className="cart-empty__icon">🛒</span>
                    <h2>Giỏ hàng trống</h2>
                    <p>Hãy thêm sản phẩm yêu thích vào giỏ hàng nhé!</p>
                    <Link to="/products" className="btn btn-primary"><FiShoppingCart /> Bắt đầu mua sắm</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-header-bar">
                <div className="container">
                    <h1>🛒 Giỏ Hàng ({totalItems} sản phẩm)</h1>
                    <Link to="/products" className="btn-ghost"><FiArrowLeft /> Tiếp tục mua sắm</Link>
                </div>
            </div>

            <div className="container cart-body">
                {/* Danh sách sản phẩm */}
                <div className="cart-items">
                    <div className="cart-items__header">
                        <span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span><span />
                    </div>
                    {items.map(item => (
                        <div key={item.id} className="cart-item">
                            <div className="cart-item__product">
                                <div className="cart-item__img" style={{ background: `linear-gradient(135deg, ${item.color}22, ${item.color}44)` }}>
                                    <span>{item.emoji}</span>
                                </div>
                                <div className="cart-item__info">
                                    <p className="cart-item__name">{item.name}</p>
                                    <p className="cart-item__cat">{item.category_name || item.category || item.category_id || ''}</p>
                                </div>
                            </div>
                            <span className="cart-item__price">{item.price.toLocaleString('vi-VN')}₫</span>
                            <div className="cart-item__qty">
                                <button onClick={() => updateQty(item.id, item.qty - 1)} disabled={item.qty <= 1}><FiMinus size={13} /></button>
                                <span>{item.qty}</span>
                                <button onClick={() => updateQty(item.id, item.qty + 1)}><FiPlus size={13} /></button>
                            </div>
                            <span className="cart-item__total">{(item.price * item.qty).toLocaleString('vi-VN')}₫</span>
                            <button className="cart-item__remove" onClick={() => { removeItem(item.id); showToast('Đã xóa sản phẩm', '🗑️', 'error'); }}>
                                <FiTrash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Tóm tắt & Thanh toán */}
                <div className="cart-summary">
                    <h3 className="summary-title">Tóm tắt đơn hàng</h3>
                    <div className="summary-rows">
                        <div className="summary-row"><span>Tạm tính ({totalItems} sp)</span><span>{totalPrice.toLocaleString('vi-VN')}₫</span></div>
                        <div className="summary-row">
                            <span>Phí vận chuyển</span>
                            <span className="free">{shippingFee === 0 ? 'Miễn phí 🎉' : '30.000₫'}</span>
                        </div>
                        {shippingFee > 0 && (
                            <div className="summary-row shipping-note">
                                <span>Cần thêm <strong>{(200000 - totalPrice).toLocaleString('vi-VN')}₫</strong> để miễn phí ship!</span>
                            </div>
                        )}
                        <div className="summary-divider" />
                        <div className="summary-row summary-total">
                            <span>Tổng cộng</span>
                            <span>{grandTotal.toLocaleString('vi-VN')}₫</span>
                        </div>
                    </div>

                    {/* Form thông tin nhận hàng */}
                    <div className="order-form">
                        <h4>Thông tin nhận hàng</h4>

                        <div className={`form-field ${formErrors.name ? 'form-field--error' : ''}`}>
                            <div className="form-field-inner">
                                <FiUser size={15} className="form-field-icon" />
                                <input type="text" placeholder="Họ và tên *" value={info.name} className="form-input"
                                    onChange={e => { setInfo(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: '' })); }} />
                            </div>
                            {formErrors.name && <span className="form-field-err">{formErrors.name}</span>}
                        </div>

                        <div className={`form-field ${formErrors.phone ? 'form-field--error' : ''}`}>
                            <div className="form-field-inner">
                                <FiPhone size={15} className="form-field-icon" />
                                <input type="tel" placeholder="Số điện thoại *" value={info.phone} className="form-input"
                                    onChange={e => { setInfo(p => ({ ...p, phone: e.target.value })); setFormErrors(p => ({ ...p, phone: '' })); }} />
                            </div>
                            {formErrors.phone && <span className="form-field-err">{formErrors.phone}</span>}
                        </div>

                        <div className={`form-field ${formErrors.address ? 'form-field--error' : ''}`}>
                            <div className="form-field-inner">
                                <FiMapPin size={15} className="form-field-icon" />
                                <input type="text" placeholder="Địa chỉ nhận hàng *" value={info.address} className="form-input"
                                    onChange={e => { setInfo(p => ({ ...p, address: e.target.value })); setFormErrors(p => ({ ...p, address: '' })); }} />
                            </div>
                            {formErrors.address && <span className="form-field-err">{formErrors.address}</span>}
                        </div>

                        <textarea placeholder="Ghi chú đơn hàng (tuỳ chọn)" className="form-input form-textarea" rows={3}
                            value={info.note} onChange={e => setInfo(p => ({ ...p, note: e.target.value }))} />
                    </div>

                    {/* Phương thức thanh toán */}
                    <div className="payment-section">
                        <h4 className="payment-title">💳 Phương thức thanh toán</h4>
                        <div className="payment-methods">
                            {PAYMENT_METHODS.map(m => (
                                <label key={m.id} className={`payment-method ${payMethod === m.id ? 'payment-method--active' : ''}`}
                                    style={payMethod === m.id ? { '--pay-color': m.color } : {}}>
                                    <input type="radio" name="payment" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} />
                                    <span className="pm-icon">{m.icon}</span>
                                    <div className="pm-info"><span className="pm-label">{m.label}</span><span className="pm-desc">{m.desc}</span></div>
                                    <span className="pm-check"><FiCheck size={13} /></span>
                                </label>
                            ))}
                        </div>

                        {payMethod === 'bank' && (
                            <div className="payment-detail bank-detail">
                                <p className="pay-detail-title">🏦 Thông tin chuyển khoản</p>
                                <div className="bank-info">
                                    <div className="bank-row"><span>Ngân hàng</span><strong>VietcomBank (VCB)</strong></div>
                                    <div className="bank-row"><span>Số tài khoản</span><strong className="bank-acc">0123 4567 8910</strong></div>
                                    <div className="bank-row"><span>Chủ tài khoản</span><strong>NGUYEN THI PU</strong></div>
                                    <div className="bank-row"><span>Số tiền</span><strong className="bank-amount">{grandTotal.toLocaleString('vi-VN')}₫</strong></div>
                                    <div className="bank-row"><span>Nội dung CK</span><strong>ANVAT {info.phone || 'SĐT của bạn'}</strong></div>
                                </div>
                                <p className="pay-note">⚠️ Đơn hàng sẽ được xử lý sau khi nhận được thanh toán</p>
                            </div>
                        )}
                        {payMethod === 'momo' && (
                            <div className="payment-detail momo-detail">
                                <p className="pay-detail-title">💜 Chuyển khoản MoMo</p>
                                <div className="momo-info">
                                    <div className="momo-phone"><span className="momo-icon">📱</span>
                                        <div><p>Số điện thoại MoMo</p><strong>0987 654 321</strong></div>
                                    </div>
                                    <div className="bank-row"><span>Tên tài khoản</span><strong>Ăn Vặt Nhà Pu</strong></div>
                                    <div className="bank-row"><span>Số tiền</span><strong className="momo-amount">{grandTotal.toLocaleString('vi-VN')}₫</strong></div>
                                    <div className="bank-row"><span>Nội dung</span><strong>ANVAT {info.phone || 'SĐT của bạn'}</strong></div>
                                </div>
                                <p className="pay-note">⚠️ Mở app MoMo → Chuyển tiền → Nhập SĐT trên</p>
                            </div>
                        )}
                        {payMethod === 'cod' && (
                            <div className="payment-detail cod-detail">
                                <div className="cod-info">
                                    <span className="cod-icon">✅</span>
                                    <div>
                                        <p className="pay-detail-title">Thanh toán khi nhận hàng (COD)</p>
                                        <p>Bạn sẽ thanh toán <strong>{grandTotal.toLocaleString('vi-VN')}₫</strong> bằng tiền mặt khi shipper giao hàng.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="btn btn-primary order-btn" onClick={handleOrder} disabled={submitting}>
                        {submitting ? '⏳ Đang xử lý...' :
                            payMethod === 'cod' ? '🛵 Đặt hàng - Trả khi nhận' :
                                payMethod === 'momo' ? '💜 Xác nhận & Chuyển MoMo' :
                                    '🏦 Xác nhận & Chuyển khoản'}
                    </button>
                    <button className="clear-cart-btn" onClick={() => { clearCart(); showToast('Đã xóa giỏ hàng', '🗑️', 'error'); }}>
                        Xóa toàn bộ giỏ hàng
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}
