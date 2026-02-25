import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiRefreshCcw, FiShield, FiZap } from 'react-icons/fi';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import ProductCard from '../components/ProductCard';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import { getProducts } from '../services/api';
import { showToast } from '../components/Toast';
import './Home.css';

const policies = [
    { icon: <FiTruck />, title: 'Giao hàng nhanh', desc: 'Giao trong 2-4h nội thành, 1-3 ngày toàn quốc' },
    { icon: <FiRefreshCcw />, title: 'Đổi trả dễ dàng', desc: 'Đổi trả miễn phí trong 7 ngày nếu có lỗi từ shop' },
    { icon: <FiShield />, title: 'Đảm bảo chất lượng', desc: 'Sản phẩm chính hãng, nguồn gốc rõ ràng' },
    { icon: <FiZap />, title: 'Thanh toán an toàn', desc: 'COD, chuyển khoản, Momo, ZaloPay' },
];

export default function Home() {
    const [bestSellers, setBestSellers] = useState([]);
    const [onSale, setOnSale] = useState([]);

    useEffect(() => {
        // Sản phẩm bán chạy
        getProducts({ sort: 'sold', limit: 8 })
            .then(res => setBestSellers(res.data))
            .catch(() => { });

        // Sản phẩm có giảm giá – dùng has_discount=1 thay vì fetch 50 rồi filter
        getProducts({ has_discount: 1, sort: 'sold', limit: 8 })
            .then(res => setOnSale(res.data))
            .catch(() => { });
    }, []);

    const handleAddToCart = (product) => {
        showToast(`Đã thêm "${product.name.slice(0, 28)}..." vào giỏ!`, '🛒');
    };

    return (
        <main>
            <Hero />

            {/* Policy strip */}
            <section className="policy-strip">
                <div className="container policy-grid">
                    {policies.map((p, i) => (
                        <div key={i} className="policy-item">
                            <div className="policy-icon">{p.icon}</div>
                            <div>
                                <p className="policy-title">{p.title}</p>
                                <p className="policy-desc">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <CategoryGrid />

            {/* Best sellers */}
            {bestSellers.length > 0 && (
                <section className="section products-section">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-tag">🔥 Bán chạy</span>
                            <h2 className="section-title">Sản Phẩm Bán Chạy</h2>
                            <p className="section-subtitle">Được hàng nghìn khách hàng yêu thích và tin dùng</p>
                        </div>
                        <div className="products-grid">
                            {bestSellers.map(p => (
                                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                            ))}
                        </div>
                        <div className="section-cta">
                            <Link to="/products" className="btn btn-secondary">
                                Xem tất cả sản phẩm <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Promo banner */}
            <section className="promo-banner">
                <div className="container promo-inner">
                    <div className="promo-content">
                        <span className="promo-tag">⚡ Flash Sale</span>
                        <h2 className="promo-title">Giảm đến 30%<br />Đồ Ăn Vặt Mỗi Ngày!</h2>
                        <p className="promo-sub">Hàng trăm sản phẩm sale sốc, số lượng có hạn!</p>
                        <Link to="/products" className="btn btn-secondary promo-cta">
                            Mua ngay <FiArrowRight />
                        </Link>
                    </div>
                    <div className="promo-emojis" aria-hidden>
                        {['🎉', '🔥', '💥', '⚡', '🎊', '✨', '🎁', '🏆'].map((em, i) => (
                            <span key={i} style={{ '--delay': `${i * 0.4}s` }}>{em}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* On sale */}
            {onSale.length > 0 && (
                <section className="section products-section">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-tag">🏷️ Giảm giá</span>
                            <h2 className="section-title">Sản Phẩm Giảm Giá</h2>
                            <p className="section-subtitle">Tiết kiệm hơn với hàng trăm sản phẩm đang sale</p>
                        </div>
                        <div className="products-grid">
                            {onSale.map(p => (
                                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                            ))}
                        </div>
                        <div className="section-cta">
                            <Link to="/products" className="btn btn-secondary">
                                Xem tất cả <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <Testimonials />
            <Footer />
        </main>
    );
}
