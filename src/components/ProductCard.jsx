import { useState, useCallback } from 'react';
import { FiShoppingCart, FiHeart, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toggleWishlist } from '../services/api';
import { showToast } from './Toast';
import './ProductCard.css';

const IMG_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

const badgeClass = {
    'Bán chạy': 'badge-hot',
    'Hot': 'badge-hot',
    'Mới': 'badge-new',
    'Trending': 'badge-new',
    'Healthy': 'badge-healthy',
    'Ăn kiêng': 'badge-healthy',
    'Cao cấp': 'badge-new',
    'Premium': 'badge-new',
    'default': 'badge-default',
};

function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
}

export default function ProductCard({ product, onAddToCart, wishlisted = false, onWishlistChange }) {
    const { addItem } = useCart();
    const { isLogged } = useAuth();
    const [liked, setLiked] = useState(wishlisted);
    const [adding, setAdding] = useState(false);
    const [wishLoading, setWishLoading] = useState(false);

    const isOutOfStock = product.stock === 0;

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (adding || isOutOfStock) return;
        setAdding(true);
        addItem(product);
        onAddToCart && onAddToCart(product);
        setTimeout(() => setAdding(false), 800);
    };

    const handleWishlist = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLogged) {
            showToast('Vui lòng đăng nhập để lưu yêu thích', '💛', 'error');
            return;
        }
        if (wishLoading) return;
        setWishLoading(true);
        try {
            const res = await toggleWishlist(product.id);
            setLiked(res.added);
            showToast(res.message, res.added ? '❤️' : '💔');
            onWishlistChange && onWishlistChange(product.id, res.added);
        } catch {
            showToast('Lỗi cập nhật wishlist', '❌', 'error');
        } finally {
            setWishLoading(false);
        }
    }, [isLogged, wishLoading, product.id, onWishlistChange]);

    const discount = (product.original_price || product.originalPrice)
        ? Math.round((1 - product.price / (product.original_price || product.originalPrice)) * 100)
        : null;

    const bClass = badgeClass[product.badge] || badgeClass.default;

    return (
        <article className={`product-card ${isOutOfStock ? 'product-card--out-of-stock' : ''}`}>
            {/* Image area */}
            <div className="product-card__img-wrap">
                <div
                    className="product-card__img"
                    style={{ background: `linear-gradient(135deg, ${product.color}22, ${product.color}44)` }}
                >
                    {product.image_url ? (
                        <img
                            src={IMG_BASE + product.image_url}
                            alt={product.name}
                            className="product-card__photo"
                            loading="lazy"
                        />
                    ) : (
                        <span className="product-card__emoji">{product.emoji}</span>
                    )}
                </div>

                {/* Badges */}
                <div className="product-card__badges">
                    {isOutOfStock && <span className="badge badge-oos">Hết hàng</span>}
                    {!isOutOfStock && product.badge && <span className={`badge ${bClass}`}>{product.badge}</span>}
                    {!isOutOfStock && discount && <span className="badge badge-sale">-{discount}%</span>}
                </div>

                {/* Hover actions */}
                <div className="product-card__hover-actions">
                    <button
                        className={`card-action-btn ${liked ? 'liked' : ''}`}
                        onClick={handleWishlist}
                        aria-label="Yêu thích"
                        disabled={wishLoading}
                    >
                        <FiHeart size={16} fill={liked ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="product-card__info">
                <p className="product-card__cat">{(product.category_name || product.category || product.category_id || '').replace(/-/g, ' ')}</p>
                <h3 className="product-card__name">{product.name}</h3>

                {/* Rating */}
                <div className="product-card__rating">
                    <FiStar size={12} fill="var(--secondary-dark)" stroke="none" />
                    <span className="rating-score">{product.rating}</span>
                    <span className="rating-count">({product.reviews})</span>
                    <span className="rating-sold">· Đã bán {Number(product.sold || 0).toLocaleString()}</span>
                </div>

                {/* Stock badge (nếu sắp hết) */}
                {product.stock > 0 && product.stock <= 10 && (
                    <p className="product-card__low-stock">⚠️ Còn {product.stock} sản phẩm</p>
                )}

                {/* Price */}
                <div className="product-card__price-row">
                    <span className="product-card__price">{formatPrice(product.price)}</span>
                    {(product.original_price || product.originalPrice) && (
                        <span className="product-card__original">{formatPrice(product.original_price || product.originalPrice)}</span>
                    )}
                </div>

                {/* CTA */}
                <button
                    className={`product-card__cta ${adding ? 'product-card__cta--adding' : ''} ${isOutOfStock ? 'product-card__cta--disabled' : ''}`}
                    onClick={handleAdd}
                    disabled={adding || isOutOfStock}
                >
                    {isOutOfStock ? (
                        <>😔 Hết hàng</>
                    ) : adding ? (
                        <><span className="cta-check">✓</span> Đã thêm!</>
                    ) : (
                        <><FiShoppingCart size={15} /> Thêm vào giỏ</>
                    )}
                </button>
            </div>
        </article>
    );
}
