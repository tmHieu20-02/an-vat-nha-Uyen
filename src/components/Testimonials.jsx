import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { getTestimonials } from '../services/api';
import { testimonials as staticData } from '../data/products';
import './Testimonials.css';

export default function Testimonials() {
    const [testimonials, setTestimonials] = useState(staticData);

    useEffect(() => {
        getTestimonials()
            .then(res => { if (res.data?.length > 0) setTestimonials(res.data); })
            .catch(() => { }); // fallback về static data
    }, []);

    return (
        <section className="testimonials section">
            <div className="container">
                <div className="section-header">
                    <span className="section-tag">💬 Đánh giá</span>
                    <h2 className="section-title">Khách Hàng Nói Gì?</h2>
                    <p className="section-subtitle">Hàng nghìn khách hàng hài lòng với sản phẩm của chúng tôi</p>
                </div>

                <div className="testimonials-grid">
                    {testimonials.map((t) => (
                        <div key={t.id} className="testimonial-card">
                            <div className="t-card__stars">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <FiStar
                                        key={i}
                                        size={14}
                                        fill={i < t.rating ? 'var(--secondary-dark)' : 'none'}
                                        stroke={i < t.rating ? 'var(--secondary-dark)' : 'var(--text-light)'}
                                    />
                                ))}
                            </div>
                            <p className="t-card__comment">"{t.comment}"</p>
                            <div className="t-card__product">
                                <span className="t-card__product-tag">📦 {t.product}</span>
                            </div>
                            <div className="t-card__author">
                                <span className="t-card__avatar">{t.avatar}</span>
                                <div>
                                    <p className="t-card__name">{t.name}</p>
                                    <p className="t-card__date">{t.date || t.created_at?.slice(0, 10) || ''}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary bar */}
                <div className="testimonials-summary">
                    <div className="summary-score">
                        <span className="score-big">4.9</span>
                        <div>
                            <div className="score-stars">
                                {Array.from({ length: 5 }).map((_, i) => <FiStar key={i} size={18} fill="var(--secondary-dark)" stroke="none" />)}
                            </div>
                            <p className="score-label">Dựa trên 2.400+ đánh giá</p>
                        </div>
                    </div>
                    <div className="summary-bars">
                        {[['5 sao', 82], ['4 sao', 12], ['3 sao', 4], ['2 sao', 1], ['1 sao', 1]].map(([label, pct]) => (
                            <div key={label} className="bar-row">
                                <span className="bar-label">{label}</span>
                                <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                                <span className="bar-pct">{pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
