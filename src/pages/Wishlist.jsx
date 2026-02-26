import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingCart, FiHeart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getWishlist, toggleWishlist } from '../services/api';
import { showToast } from '../components/Toast';
import Footer from '../components/Footer';
import './Wishlist.css';

const IMG_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
}

export default function Wishlist() {
    const { user, isLogged } = useAuth();
    const { addItem } = useCart();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = () => {
        if (!isLogged) { setLoading(false); return; }
        setLoading(true);
        getWishlist()
            .then(res => setItems(res.data))
            .catch(() => showToast('Lỗi tải danh sách yêu thích', '❌', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchWishlist(); }, [isLogged]);

    const handleRemove = async (productId) => {
        try {
            await toggleWishlist(productId);
            setItems(prev => prev.filter(p => p.id !== productId));
            showToast('Đã xoá khỏi danh sách yêu thích', '💔');
        } catch {
            showToast('Lỗi xoá sản phẩm', '❌', 'error');
        }
    };

    const handleAddToCart = (product) => {
        addItem(product);
        showToast(`Đã thêm "${product.name.slice(0, 28)}..." vào giỏ!`, '🛒');
    };

    if (!isLogged) {
        return (
            <div className="wishlist-page">
                <div className="wishlist-empty-auth">
                    <FiHeart size={60} className="wish-icon-big" />
                    <h2>Danh sách yêu thích</h2>
                    <p>Vui lòng đăng nhập để xem và lưu sản phẩm yêu thích.</p>
                    <Link to="/login" className="btn btn-primary">Đăng nhập ngay</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <div className="wishlist-header container">
                <h1 className="wishlist-title">❤️ Danh sách yêu thích</h1>
                <p className="wishlist-sub">{items.length} sản phẩm đã lưu</p>
            </div>

            <div className="container wishlist-body">
                {loading && (
                    <div className="wishlist-loading">
                        <span>⏳</span><p>Đang tải...</p>
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="wishlist-empty">
                        <FiHeart size={60} className="wish-icon-big" />
                        <h3>Chưa có sản phẩm yêu thích</h3>
                        <p>Bấm ❤️ trên sản phẩm để lưu vào đây nhé!</p>
                        <Link to="/products" className="btn btn-primary">Khám phá sản phẩm</Link>
                    </div>
                )}

                {!loading && items.length > 0 && (
                    <div className="wishlist-grid">
                        {items.map(p => (
                            <div key={p.id} className="wish-item">
                                <div className="wish-item__img">
                                    {p.image_url ? (
                                        <img src={IMG_BASE + p.image_url} alt={p.name} loading="lazy" />
                                    ) : (
                                        <span className="wish-emoji" style={{ background: `${p.color}33` }}>{p.emoji}</span>
                                    )}
                                    {p.stock === 0 && <span className="wish-oos">Hết hàng</span>}
                                </div>
                                <div className="wish-item__info">
                                    <p className="wish-cat">{p.category_name}</p>
                                    <h3 className="wish-name">{p.name}</h3>
                                    {p.badge && <span className="wish-badge">{p.badge}</span>}
                                    <div className="wish-price-row">
                                        <span className="wish-price">{formatPrice(p.price)}</span>
                                        {p.original_price && (
                                            <span className="wish-original">{formatPrice(p.original_price)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="wish-item__actions">
                                    <button
                                        className="wish-add-btn"
                                        onClick={() => handleAddToCart(p)}
                                        disabled={p.stock === 0}
                                    >
                                        <FiShoppingCart size={15} />
                                        {p.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                                    </button>
                                    <button
                                        className="wish-remove-btn"
                                        onClick={() => handleRemove(p.id)}
                                        aria-label="Xoá"
                                    >
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
