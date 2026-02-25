import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiZap } from 'react-icons/fi';
import './Hero.css';

const slides = [
    {
        id: 1,
        tag: '🔥 Siêu Sale Mỗi Ngày',
        title: 'Thiên Đường\nĐồ Ăn Vặt',
        subtitle: 'Snack, bánh kẹo, ô mai, đồ sấy... Tất cả đều ngon & rẻ!',
        cta: 'Mua ngay',
        ctaLink: '/products',
        accent: 'Giao hàng siêu tốc · Miễn phí 200k+',
        emoji: ['🍿', '🍬', '🎂', '🥩', '🧋', '🌸', '🍊', '🍑'],
        photo: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=480&q=85&auto=format&fit=crop',
        gradient: 'linear-gradient(135deg, #FF6B2B 0%, #FF4B6E 50%, #7C3AED 100%)',
        light: 'linear-gradient(135deg, #FFF5EE 0%, #FFE8F5 60%, #F0E8FF 100%)',
    },
    {
        id: 2,
        tag: '🥩 Đặc Sản Miền Nam',
        title: 'Đồ Khô &\nĐồ Sấy',
        subtitle: 'Mực rim, khô bò, tôm khô, hải sản sấy... hương vị đậm đà, ăn là ghiền!',
        cta: 'Khám phá ngay',
        ctaLink: '/products?cat=do-kho',
        accent: 'Khô bò · Mực rim · Tôm khô · Hải sản sấy',
        emoji: ['🦑', '🐟', '🦐', '🦀', '🌶️', '🔥', '🧄', '🥩'],
        photo: '/slide-dokho.png',
        gradient: 'linear-gradient(135deg, #B45309 0%, #92400E 50%, #78350F 100%)',
        light: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 60%, #FDE68A 100%)',
    },
    {
        id: 3,
        tag: '💚 Healthy Snacks',
        title: 'Ăn Vặt\nSức Khỏe',
        subtitle: 'Đồ ăn vặt healthy: hoa quả sấy, bánh ngũ cốc, không chất bảo quản',
        cta: 'Xem ngay',
        ctaLink: '/products?cat=healthy',
        accent: '100% Tự nhiên · Không chất bảo quản',
        emoji: ['🥗', '🍎', '🥦', '🌾', '🥕', '🍇', '🥝', '🫐'],
        photo: '/slide-healthy.png',
        gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 50%, #059669 100%)',
        light: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 60%, #D1FAE5 100%)',
    },
];


export default function Hero() {
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);

    // Auto-slide
    useEffect(() => {
        const t = setInterval(() => goTo((current + 1) % slides.length), 5000);
        return () => clearInterval(t);
    }, [current]);

    const goTo = (idx) => {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => { setCurrent(idx); setAnimating(false); }, 300);
    };

    const slide = slides[current];

    return (
        <section className="hero" style={{ background: slide.light }}>
            {/* Animated emoji rain */}
            <div className="hero-emojis" aria-hidden>
                {slide.emoji.map((em, i) => (
                    <span key={i} className="hero-emoji" style={{ '--i': i }}>{em}</span>
                ))}
            </div>

            <div className="container hero-inner">
                {/* Text side */}
                <div className={`hero-text ${animating ? 'hero-text--exit' : 'hero-text--enter'}`}>
                    <span className="hero-tag">{slide.tag}</span>
                    <h1 className="hero-title" style={{ '--gradient': slide.gradient }}>
                        {slide.title.split('\n').map((line, i) => (
                            <span key={i}>{line}<br /></span>
                        ))}
                    </h1>
                    <p className="hero-subtitle">{slide.subtitle}</p>
                    <div className="hero-accent">
                        <FiZap fill="currentColor" size={14} /> {slide.accent}
                    </div>
                    <div className="hero-ctas">
                        <Link to={slide.ctaLink} className="btn btn-primary hero-cta-main">
                            {slide.cta} <FiArrowRight />
                        </Link>
                        <Link to="/products" className="btn btn-secondary hero-cta-ghost">
                            Xem tất cả
                        </Link>
                    </div>


                </div>

                {/* Visual side */}
                <div className={`hero-visual ${animating ? 'hero-visual--exit' : 'hero-visual--enter'}`}>
                    <div className="hero-blob" style={{ background: slide.gradient }}>
                        <img src={slide.photo} alt={slide.title} className="hero-blob-img" />
                    </div>
                    <div className="hero-floating-cards">
                        <div className="f-card f-card--1">
                            <img src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=40&h=40&fit=crop&q=90" alt="Giao nhanh" className="f-card-img" />
                            Giao nhanh 2h
                        </div>
                        <div className="f-card f-card--2">
                            <img src="https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c?w=40&h=40&fit=crop&q=90" alt="Chất lượng" className="f-card-img" />
                            Đảm bảo chất lượng
                        </div>
                        <div className="f-card f-card--3">
                            <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=40&h=40&fit=crop&q=90" alt="Quà tặng" className="f-card-img" />
                            Quà tặng kèm
                        </div>
                    </div>
                </div>
            </div>

            {/* Dots */}
            <div className="hero-dots">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        className={`hero-dot ${i === current ? 'hero-dot--active' : ''}`}
                        style={i === current ? { background: slide.gradient } : {}}
                        onClick={() => goTo(i)}
                        aria-label={`Slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Wave */}
            <div className="hero-wave">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#FFFBF7" />
                </svg>
            </div>
        </section>
    );
}
