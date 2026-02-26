import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiChevronDown, FiPhone, FiUser, FiHeart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { categories } from '../data/products';
import { getProducts } from '../services/api';
import './Header.css';

export default function Header({ onSearch }) {
    const { totalItems } = useCart();
    const { user, isStaff, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchVal, setSearchVal] = useState('');
    const [catOpen, setCatOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
        setCatOpen(false);
    }, [location]);

    useEffect(() => {
        if (searchOpen) searchRef.current?.focus();
    }, [searchOpen]);

    useEffect(() => {
        if (!searchVal.trim()) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            setIsSearching(true);
            getProducts({ search: searchVal.trim(), limit: 5 })
                .then(res => setSuggestions(res.data || []))
                .catch(() => { })
                .finally(() => setIsSearching(false));
        }, 350);
        return () => clearTimeout(timer);
    }, [searchVal]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (onSearch) onSearch(searchVal);
        setSearchOpen(false);
    };

    const navLinks = [
        { label: 'Trang chủ', to: '/' },
        { label: 'Sản phẩm', to: '/products', hasDropdown: true },
        { label: 'Giỏ hàng', to: '/cart' },
        { label: 'Liên hệ', to: '/#contact' },
    ];

    const catLinks = categories.filter(c => c.id !== 'all');

    return (
        <>
            {/* Top bar */}
            <div className="topbar">
                <div className="container topbar-inner">
                    <span>🚚 Miễn phí vận chuyển đơn từ 200k!</span>
                    <span className="topbar-divider" />
                    <span><FiPhone size={12} /> 0869 157 975</span>
                </div>
            </div>

            {/* Main header */}
            <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
                <div className="container header-inner">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <img
                            src="/logo.png"
                            alt="Ăn Vặt Nhà Pu"
                            className="logo-img"
                        />
                        <span className="logo-text">
                            Ăn Vặt Nhà <strong>Pu</strong>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="nav-desktop">
                        {navLinks.map(link => (
                            link.hasDropdown ? (
                                <div
                                    key={link.to}
                                    className="nav-item has-dropdown"
                                    onMouseEnter={() => setCatOpen(true)}
                                    onMouseLeave={() => setCatOpen(false)}
                                >
                                    <Link to={link.to} className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}>
                                        {link.label} <FiChevronDown size={14} className={`chevron ${catOpen ? 'open' : ''}`} />
                                    </Link>
                                    <div className={`dropdown ${catOpen ? 'dropdown--open' : ''}`}>
                                        {catLinks.map(cat => (
                                            <Link key={cat.id} to={`/products?cat=${cat.id}`} className="dropdown-item">
                                                <span className="dropdown-emoji">{cat.emoji}</span>
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link key={link.to} to={link.to} className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}>
                                    {link.label}
                                </Link>
                            )
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="header-actions">
                        <button className="icon-btn" onClick={() => setSearchOpen(v => !v)} aria-label="Tìm kiếm">
                            <FiSearch size={20} />
                        </button>
                        <Link to="/cart" className="icon-btn cart-btn" aria-label="Giỏ hàng">
                            <FiShoppingCart size={20} />
                            {totalItems > 0 && (
                                <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>
                            )}
                        </Link>

                        {/* Wishlist (chỉ hiện khi đã đăng nhập) */}
                        {user && (
                            <Link to="/wishlist" className="icon-btn" aria-label="Yêu thích" title="Danh sách yêu thích" style={{ color: '#FF6B6B' }}>
                                <FiHeart size={20} />
                            </Link>
                        )}

                        {/* Auth: Login hoặc Profile/Staff */}
                        {user ? (
                            <div className="user-menu">
                                {isStaff
                                    ? <Link to="/staff" className="icon-btn user-btn" aria-label="Staff" title={`${user.full_name} (${user.role})`}><FiUser size={20} /><span className="user-role-dot staff" /></Link>
                                    : <Link to="/profile" className="icon-btn user-btn" aria-label="Tài khoản" title={user.full_name}><FiUser size={20} /></Link>
                                }
                            </div>
                        ) : (
                            <Link to="/login" className="icon-btn" aria-label="Đăng nhập" title="Đăng nhập">
                                <FiUser size={20} />
                            </Link>
                        )}

                        <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
                            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                <div className={`search-bar ${searchOpen ? 'search-bar--open' : ''}`}>
                    <div className="container">
                        <form onSubmit={handleSearch} className="search-form">
                            <FiSearch size={18} className="search-icon" />
                            <input
                                ref={searchRef}
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                placeholder="Tìm kiếm đồ ăn vặt..."
                                className="search-input"
                            />
                            {isSearching && <span className="search-spinner" />}
                            <button type="submit" className="btn btn-primary search-submit">Tìm</button>
                        </form>

                        {/* Search Suggestions */}
                        {searchVal.trim().length > 0 && (
                            <div className="search-suggestions">
                                {suggestions.length > 0 ? (
                                    suggestions.map(p => (
                                        <Link
                                            key={p.id}
                                            to={`/products?search=${encodeURIComponent(p.name)}`}
                                            className="suggestion-item"
                                            onClick={() => {
                                                setSearchOpen(false);
                                                if (onSearch) onSearch(p.name);
                                            }}
                                        >
                                            {p.image_url
                                                ? <img src={(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '') + p.image_url} alt={p.name} className="suggestion-img" />
                                                : <span className="suggestion-emoji">{p.emoji}</span>}
                                            <div className="suggestion-info">
                                                <p className="suggestion-name">{p.name}</p>
                                                <p className="suggestion-price">{Number(p.price).toLocaleString('vi-VN')}₫</p>
                                            </div>
                                        </Link>
                                    ))
                                ) : !isSearching && (
                                    <div className="suggestion-empty">Không tìm thấy sản phẩm "{searchVal}"</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile menu */}
            <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
                <div className="mobile-menu-inner">
                    {navLinks.map(link => (
                        <Link key={link.to} to={link.to} className="mobile-link">
                            {link.label}
                        </Link>
                    ))}
                    {user && (
                        <Link to="/wishlist" className="mobile-link" style={{ color: '#FF6B6B' }}>❤️ Yêu thích</Link>
                    )}
                    <div className="mobile-cats">
                        <p className="mobile-cats-title">Danh mục</p>
                        <div className="mobile-cats-grid">
                            {catLinks.map(cat => (
                                <Link key={cat.id} to={`/products?cat=${cat.id}`} className="mobile-cat-item">
                                    <span>{cat.emoji}</span>
                                    <span>{cat.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
        </>
    );
}
