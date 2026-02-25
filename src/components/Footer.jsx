import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer" id="contact">
            <div className="footer-top">
                <div className="container footer-grid">
                    {/* Brand */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/logo.png" alt="Ăn Vặt Nhà Pu" className="footer-logo-img" />
                            <span className="footer-logo-text">Ăn Vặt Nhà <strong>Pu</strong></span>
                        </div>
                        <p className="footer-desc">
                            Thiên đường snack, bánh kẹo, đồ sấy và đủ món ngon hấp dẫn.
                            Mua online siêu tiện, chất lượng tốt, giao hàng nhanh tận tay!
                        </p>
                        <div className="footer-socials">
                            {[
                                { icon: <FiFacebook />, href: 'https://www.facebook.com/profile.php?id=61588473474639', label: 'Facebook' },
                                { icon: <FiInstagram />, href: '#', label: 'Instagram' },
                                { icon: <FiYoutube />, href: '#', label: 'Youtube' },
                            ].map(s => (
                                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="social-btn" aria-label={s.label}>{s.icon}</a>
                            ))}
                        </div>
                    </div>

                    {/* Products */}
                    <div className="footer-col">
                        <h4 className="footer-col__title">Sản Phẩm</h4>
                        <ul className="footer-links">
                            {[
                                ['Kẹo bánh', '/products?cat=keo-banh'],
                                ['Đồ khô', '/products?cat=do-kho'],
                                ['Ô mai', '/products?cat=o-mai'],
                                ['Đồ sấy', '/products?cat=do-say'],
                                ['Đồ uống', '/products?cat=do-uong'],
                                ['Healthy', '/products?cat=healthy'],
                            ].map(([name, href]) => (
                                <li key={name}><Link to={href} className="footer-link">{name}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Policy */}
                    <div className="footer-col">
                        <h4 className="footer-col__title">Chính Sách</h4>
                        <ul className="footer-links">
                            {[
                                ['Chính sách vận chuyển', '#'],
                                ['Chính sách đổi trả', '#'],
                                ['Chính sách bảo mật', '#'],
                                ['Chính sách thanh toán', '#'],
                                ['Câu hỏi thường gặp', '#'],
                            ].map(([name, href]) => (
                                <li key={name}><a href={href} className="footer-link">{name}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-col">
                        <h4 className="footer-col__title">Liên Hệ</h4>
                        <ul className="footer-contact">
                            <li><FiPhone size={14} /> <span>0869 157 975</span></li>
                            <li><FiMail size={14} /> <span>hello@anvatuyen.vn</span></li>
                            <li><FiMapPin size={14} /> <span>84B TTH20 phường Tân Thới Hiệp quận 12</span></li>
                        </ul>
                        <div className="footer-payment">
                            <p className="footer-col__title" style={{ marginBottom: 10 }}>Thanh Toán</p>
                            <div className="payment-methods">
                                {[
                                    { icon: '💵', label: 'Tiền mặt' },
                                    { icon: '🏦', label: 'Chuyển khoản' },
                                    { icon: '📱', label: 'MoMo' },
                                    { icon: '💳', label: 'Visa / MC' },
                                ].map(p => (
                                    <span key={p.label} className="payment-pill">
                                        {p.icon} {p.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-inner">
                    <p>© 2026 Ăn Vặt Nhà Pu — Ăn Vặt Không Mập, Chỉ Mập Niềm Vui 🍿</p>
                    <a
                        href="https://www.facebook.com/profile.php?id=61588473474639"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-fb-link"
                    >
                        <FiFacebook size={14} /> Theo dõi Facebook
                    </a>
                </div>
            </div>
        </footer>
    );
}
