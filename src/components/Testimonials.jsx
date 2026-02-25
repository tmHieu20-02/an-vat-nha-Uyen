import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { getTestimonials } from '../services/api';
import './Testimonials.css';

function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Hôm nay';
    if (d === 1) return '1 ngày trước';
    if (d < 7) return `${d} ngày trước`;
    if (d < 30) return `${Math.floor(d / 7)} tuần trước`;
    return `${Math.floor(d / 30)} tháng trước`;
}

function Stars({ rating, size = 14 }) {
    return (
        <span className="t-stars" aria-label={`${rating} sao`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <FiStar
                    key={i}
                    size={size}
                    fill={i < rating ? 'var(--secondary-dark)' : 'none'}
                    stroke={i < rating ? 'var(--secondary-dark)' : 'var(--text-light)'}
                />
            ))}
        </span>
    );
}

export default function Testimonials() {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTestimonials()
            .then(res => {
                if (res.success) {
                    setReviews(res.data || []);
                    setStats(res.stats || null);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const avgRating = stats?.avg_rating ? parseFloat(stats.avg_rating) : 0;
    const total = stats?.total ? parseInt(stats.total) : 0;

    const dist = stats ? [
        { label: '5 sao', count: parseInt(stats.s5 || 0) },
        { label: '4 sao', count: parseInt(stats.s4 || 0) },
        { label: '3 sao', count: parseInt(stats.s3 || 0) },
        { label: '2 sao', count: parseInt(stats.s2 || 0) },
        { label: '1 sao', count: parseInt(stats.s1 || 0) },
    ] : [];

    return (
        <section className="testimonials section">
            <div className="container">
                <div className="section-header">
                    <span className="section-tag">💬 Đánh giá</span>
                    <h2 className="section-title">Khách Hàng Nói Gì?</h2>
                    <p className="section-subtitle">
                        {total > 0
                            ? `${total} khách hàng đã đánh giá sản phẩm của chúng tôi`
                            : 'Hãy mua và chia sẻ cảm nhận của bạn!'}
                    </p>
                </div>

                {loading && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                        ⏳ Đang tải đánh giá...
                    </p>
                )}

                {!loading && reviews.length === 0 && (
                    <div className="testimonials-empty">
                        <span>💬</span>
                        <p>Chưa có đánh giá nào.</p>
                        <small>Mua hàng và hoàn thành đơn để trở thành người đánh giá đầu tiên!</small>
                    </div>
                )}

                {!loading && reviews.length > 0 && (
                    <>
                        <div className="testimonials-grid">
                            {reviews.map((r) => (
                                <div key={r.id} className="testimonial-card">
                                    <div className="t-card__stars">
                                        <Stars rating={r.rating} />
                                    </div>
                                    <p className="t-card__comment">"{r.comment}"</p>
                                    <div className="t-card__product">
                                        <span className="t-card__product-tag">
                                            {r.product_emoji || '📦'} {r.product_name || ''}
                                        </span>
                                    </div>
                                    <div className="t-card__author">
                                        <span className="t-card__avatar">
                                            {(r.user_name || 'K').charAt(0).toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="t-card__name">{r.user_name || 'Khách'}</p>
                                            <p className="t-card__date">{timeAgo(r.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary bar */}
                        {total > 0 && (
                            <div className="testimonials-summary">
                                <div className="summary-score">
                                    <span className="score-big">{avgRating.toFixed(1)}</span>
                                    <div>
                                        <div className="score-stars">
                                            <Stars rating={Math.round(avgRating)} size={18} />
                                        </div>
                                        <p className="score-label">Dựa trên {total} đánh giá</p>
                                    </div>
                                </div>
                                <div className="summary-bars">
                                    {dist.map(({ label, count }) => {
                                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                        return (
                                            <div key={label} className="bar-row">
                                                <span className="bar-label">{label}</span>
                                                <div className="bar-track">
                                                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="bar-pct">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
