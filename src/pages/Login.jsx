import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import './Login.css';

export default function Login() {
    const { login, register, isStaff } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('login');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [regForm, setRegForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!loginForm.email || !loginForm.password) { setError('Vui lòng điền đầy đủ thông tin!'); return; }
        setLoading(true);
        try {
            const user = await login(loginForm);
            showToast(`Chào mừng ${user.full_name}! 👋`, '✅');
            // Redirect theo role
            if (user.role === 'staff' || user.role === 'admin') navigate('/staff');
            else navigate('/profile');
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally { setLoading(false); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (!regForm.full_name || !regForm.email || !regForm.password) { setError('Vui lòng điền đầy đủ thông tin!'); return; }
        if (regForm.password !== regForm.confirm) { setError('Mật khẩu xác nhận không khớp!'); return; }
        if (regForm.password.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự!'); return; }
        setLoading(true);
        try {
            const user = await register(regForm);
            showToast('Đăng ký thành công! 🎉', '✅');
            navigate('/profile');
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <Link to="/" className="login-logo">
                    <img src="/logo.png" alt="Ăn Vặt Nhà Pu" />
                    <span>Ăn Vặt Nhà <strong>Pu</strong></span>
                </Link>

                <div className="login-tabs">
                    <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError(''); }}>
                        Đăng nhập
                    </button>
                    <button className={tab === 'register' ? 'active' : ''} onClick={() => { setTab('register'); setError(''); }}>
                        Đăng ký
                    </button>
                </div>

                {error && <div className="login-error">⚠️ {error}</div>}

                {/* ĐĂNG NHẬP */}
                {tab === 'login' && (
                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="field">
                            <FiMail className="field-icon" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={loginForm.email}
                                onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                                autoComplete="email"
                            />
                        </div>
                        <div className="field">
                            <FiLock className="field-icon" />
                            <input
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Mật khẩu"
                                value={loginForm.password}
                                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                            />
                            <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                                {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                            {loading ? '⏳ Đang đăng nhập...' : '👤 Đăng nhập'}
                        </button>
                    </form>
                )}

                {/* ĐĂNG KÝ */}
                {tab === 'register' && (
                    <form className="login-form" onSubmit={handleRegister}>
                        <div className="field">
                            <FiUser className="field-icon" />
                            <input
                                type="text"
                                placeholder="Họ và tên *"
                                value={regForm.full_name}
                                onChange={e => setRegForm(p => ({ ...p, full_name: e.target.value }))}
                            />
                        </div>
                        <div className="field">
                            <FiMail className="field-icon" />
                            <input
                                type="email"
                                placeholder="Email *"
                                value={regForm.email}
                                onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                            />
                        </div>
                        <div className="field">
                            <FiPhone className="field-icon" />
                            <input
                                type="tel"
                                placeholder="Số điện thoại"
                                value={regForm.phone}
                                onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))}
                            />
                        </div>
                        <div className="field">
                            <FiLock className="field-icon" />
                            <input
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Mật khẩu (≥6 ký tự) *"
                                value={regForm.password}
                                onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                            />
                            <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                                {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        <div className="field">
                            <FiLock className="field-icon" />
                            <input
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Xác nhận mật khẩu *"
                                value={regForm.confirm}
                                onChange={e => setRegForm(p => ({ ...p, confirm: e.target.value }))}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                            {loading ? '⏳ Đang đăng ký...' : '🎉 Tạo tài khoản'}
                        </button>
                    </form>
                )}

                <p className="login-note"><Link to="/">← Quay về trang chủ</Link></p>
            </div>
        </div>
    );
}
