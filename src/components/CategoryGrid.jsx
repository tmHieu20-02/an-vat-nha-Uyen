import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categories as staticCategories } from '../data/products';
import { getCategories } from '../services/api';
import './CategoryGrid.css';

const catColors = [
    '#FF6B2B', '#A0522D', '#FF6B8A', '#FF8C00', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#06B6D4',
];

export default function CategoryGrid() {
    const [categories, setCategories] = useState(staticCategories.filter(c => c.id !== 'all'));

    useEffect(() => {
        getCategories()
            .then(res => {
                const cats = res.data.filter(c => c.id !== 'all');
                if (cats.length > 0) setCategories(cats);
            })
            .catch(() => { }); // fallback về static data nếu API lỗi
    }, []);

    return (
        <section className="cat-section section">
            <div className="container">
                <div className="section-header">
                    <span className="section-tag">🗂️ Danh mục</span>
                    <h2 className="section-title">Khám Phá Theo Danh Mục</h2>
                    <p className="section-subtitle">Tìm đồ ăn vặt yêu thích theo từng thể loại</p>
                </div>
                <div className="cat-grid">
                    {categories.map((cat, i) => (
                        <Link
                            key={cat.id}
                            to={`/products?cat=${cat.id}`}
                            className="cat-card"
                            style={{ '--cat-color': catColors[i % catColors.length] }}
                        >
                            <div className="cat-card__icon">{cat.emoji}</div>
                            <span className="cat-card__name">{cat.name}</span>
                            <div className="cat-card__shine" />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
