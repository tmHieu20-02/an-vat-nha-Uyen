import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiX, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { getProducts, getCategories, getWishlistIds } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import './Products.css';

const sortOptions = [
    { value: 'sold', label: 'Phổ biến nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá tăng dần' },
    { value: 'price_desc', label: 'Giá giảm dần' },
    { value: 'rating', label: 'Đánh giá cao' },
];

const LIMIT = 16;

export default function Products() {
    const [params, setParams] = useSearchParams();
    const { isLogged } = useAuth();

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('sold');
    const [filterOpen, setFilterOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([{ id: 'all', name: 'Tất cả', emoji: '🛍️' }]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [wishlistIds, setWishlistIds] = useState(new Set());

    // Price range from sidebar inputs
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [appliedPrice, setAppliedPrice] = useState({ min: '', max: '' });

    const activeCat = params.get('cat') || 'all';
    const currentPage = parseInt(params.get('page') || '1');

    const setCat = (id) => {
        const p = {};
        if (id !== 'all') p.cat = id;
        setParams(p); // reset page when changing category
    };

    const setPage = (pg) => {
        const p = {};
        if (activeCat !== 'all') p.cat = activeCat;
        if (pg > 1) p.page = pg;
        setParams(p);
    };

    // Load categories
    useEffect(() => {
        getCategories()
            .then(res => setCategories(res.data))
            .catch(() => { });
    }, []);

    // Load wishlist IDs (only if logged in)
    useEffect(() => {
        if (!isLogged) { setWishlistIds(new Set()); return; }
        getWishlistIds()
            .then(res => setWishlistIds(new Set(res.data)))
            .catch(() => { });
    }, [isLogged]);

    // Fetch products
    const fetchProducts = useCallback(() => {
        setLoading(true);
        setError(null);
        const apiParams = { sort, page: currentPage, limit: LIMIT };
        if (activeCat !== 'all') apiParams.cat = activeCat;
        if (search.trim()) apiParams.search = search.trim();
        if (appliedPrice.min) apiParams.price_min = appliedPrice.min;
        if (appliedPrice.max) apiParams.price_max = appliedPrice.max;

        getProducts(apiParams)
            .then(res => {
                setProducts(res.data);
                setPagination(res.pagination || { total: res.data.length, page: currentPage, totalPages: 1 });
            })
            .catch(err => { setError(err.message); showToast('Lỗi tải sản phẩm', '❌', 'error'); })
            .finally(() => setLoading(false));
    }, [activeCat, sort, search, currentPage, appliedPrice]);

    // Debounce search + immediate re-fetch on others
    useEffect(() => {
        const t = setTimeout(fetchProducts, 350);
        return () => clearTimeout(t);
    }, [fetchProducts]);

    const handleAddToCart = (product) => {
        showToast(`Đã thêm "${product.name.slice(0, 28)}${product.name.length > 28 ? '...' : ''}" vào giỏ!`, '🛒');
    };

    const handleWishlistChange = (productId, added) => {
        setWishlistIds(prev => {
            const next = new Set(prev);
            added ? next.add(productId) : next.delete(productId);
            return next;
        });
    };

    const applyPrice = () => {
        setAppliedPrice({ min: priceMin, max: priceMax });
        setPage(1);
        setFilterOpen(false);
    };
    const clearPrice = () => {
        setPriceMin(''); setPriceMax('');
        setAppliedPrice({ min: '', max: '' });
    };

    const activeCatInfo = categories.find(c => c.id === activeCat);
    const activeCatName = activeCatInfo?.name || 'Tất cả';

    const hasFilter = activeCat !== 'all' || search || appliedPrice.min || appliedPrice.max;

    return (
        <div className="products-page">
            <div className="products-page__header">
                <div className="container">
                    <h1 className="products-page__title">🛍️ {activeCatName}</h1>
                    <p className="products-page__count">
                        {loading ? '...' : `${pagination.total} sản phẩm`}
                    </p>
                </div>
            </div>

            <div className="container products-page__body">
                {/* Sidebar */}
                <aside className={`products-sidebar ${filterOpen ? 'products-sidebar--open' : ''}`}>
                    <div className="sidebar-header">
                        <h3>Bộ lọc</h3>
                        <button className="sidebar-close" onClick={() => setFilterOpen(false)}>
                            <FiX size={18} />
                        </button>
                    </div>

                    {/* Category */}
                    <div className="sidebar-section">
                        <h4 className="sidebar-section__title">Danh mục</h4>
                        <div className="sidebar-cats">
                            {categories.filter(c => c.id !== 'all').map(cat => (
                                <button
                                    key={cat.id}
                                    className={`sidebar-cat ${activeCat === cat.id ? 'sidebar-cat--active' : ''}`}
                                    onClick={() => { setCat(cat.id); setFilterOpen(false); }}
                                >
                                    <span>{cat.emoji}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                            <button
                                className={`sidebar-cat ${activeCat === 'all' ? 'sidebar-cat--active' : ''}`}
                                onClick={() => { setCat('all'); setFilterOpen(false); }}
                            >
                                <span>🛍️</span><span>Tất cả</span>
                            </button>
                        </div>
                    </div>

                    {/* Price range */}
                    <div className="sidebar-section">
                        <h4 className="sidebar-section__title">Khoảng giá</h4>
                        <div className="price-range">
                            <input
                                type="number"
                                placeholder="Từ (₫)"
                                value={priceMin}
                                min={0}
                                onChange={e => setPriceMin(e.target.value)}
                                className="price-input"
                            />
                            <span className="price-dash">–</span>
                            <input
                                type="number"
                                placeholder="Đến (₫)"
                                value={priceMax}
                                min={0}
                                onChange={e => setPriceMax(e.target.value)}
                                className="price-input"
                            />
                        </div>
                        <div className="price-actions">
                            <button className="price-apply-btn" onClick={applyPrice}>Áp dụng</button>
                            {(appliedPrice.min || appliedPrice.max) &&
                                <button className="price-clear-btn" onClick={clearPrice}>Xoá</button>}
                        </div>
                    </div>
                </aside>
                {filterOpen && <div className="overlay" onClick={() => setFilterOpen(false)} />}

                {/* Main */}
                <div className="products-main">
                    {/* Toolbar */}
                    <div className="products-toolbar">
                        <button className="toolbar-filter-btn" onClick={() => setFilterOpen(true)}>
                            <FiSliders size={16} /> Lọc
                        </button>
                        <div className="toolbar-search">
                            <FiSearch size={15} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm sản phẩm..."
                            />
                            {search && <button className="clear-btn" onClick={() => setSearch('')}><FiX size={13} /></button>}
                        </div>
                        <div className="toolbar-sort">
                            <FiChevronDown size={14} />
                            <select value={sort} onChange={e => setSort(e.target.value)}>
                                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Active filter tags */}
                    {hasFilter && (
                        <div className="active-filters">
                            {activeCat !== 'all' && (
                                <span className="filter-tag">
                                    {activeCatInfo?.emoji} {activeCatName}
                                    <button onClick={() => setCat('all')}><FiX size={11} /></button>
                                </span>
                            )}
                            {search && (
                                <span className="filter-tag">
                                    🔍 "{search}"
                                    <button onClick={() => setSearch('')}><FiX size={11} /></button>
                                </span>
                            )}
                            {(appliedPrice.min || appliedPrice.max) && (
                                <span className="filter-tag">
                                    💰 {appliedPrice.min ? Number(appliedPrice.min).toLocaleString('vi-VN') + '₫' : '0₫'}
                                    {' – '}
                                    {appliedPrice.max ? Number(appliedPrice.max).toLocaleString('vi-VN') + '₫' : '∞'}
                                    <button onClick={clearPrice}><FiX size={11} /></button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* States */}
                    {loading && (
                        <div className="products-empty">
                            <span style={{ fontSize: 40 }}>⏳</span>
                            <h3>Đang tải sản phẩm...</h3>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="products-empty">
                            <span>❌</span>
                            <h3>Không thể tải sản phẩm</h3>
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={fetchProducts}>Thử lại</button>
                        </div>
                    )}
                    {!loading && !error && products.length === 0 && (
                        <div className="products-empty">
                            <span>😅</span>
                            <h3>Không tìm thấy sản phẩm</h3>
                            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                            <button className="btn btn-primary" onClick={() => { setCat('all'); setSearch(''); clearPrice(); }}>
                                Xem tất cả
                            </button>
                        </div>
                    )}
                    {!loading && !error && products.length > 0 && (
                        <div className="products-grid">
                            {products.map(p => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    onAddToCart={handleAddToCart}
                                    wishlisted={wishlistIds.has(p.id)}
                                    onWishlistChange={handleWishlistChange}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                <FiChevronLeft size={16} /> Trước
                            </button>

                            <div className="page-nums">
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(pg => pg === 1 || pg === pagination.totalPages || Math.abs(pg - currentPage) <= 2)
                                    .reduce((acc, pg, idx, arr) => {
                                        if (idx > 0 && pg - arr[idx - 1] > 1) acc.push('…');
                                        acc.push(pg);
                                        return acc;
                                    }, [])
                                    .map((pg, idx) =>
                                        pg === '…'
                                            ? <span key={`e${idx}`} className="page-ellipsis">…</span>
                                            : <button
                                                key={pg}
                                                className={`page-num ${pg === currentPage ? 'active' : ''}`}
                                                onClick={() => setPage(pg)}
                                            >{pg}</button>
                                    )
                                }
                            </div>

                            <button
                                className="page-btn"
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage >= pagination.totalPages}
                            >
                                Sau <FiChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
