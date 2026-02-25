const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');
require('dotenv').config();

// POST /api/auth/register - Đăng ký tài khoản
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải ít nhất 6 ký tự' });
        }

        // Kiểm tra email đã tồn tại chưa
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
            [email, password_hash, full_name, phone || null]
        );

        // Tạo JWT
        const token = jwt.sign(
            { id: result.insertId, email, full_name, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
            token,
            user: { id: result.insertId, email, full_name, phone: phone || null, role: 'customer' },
        });
    } catch (err) {
        console.error('POST /auth/register error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/auth/login - Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('POST /auth/login error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/auth/me - Lấy thông tin user hiện tại (cần token)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, email, full_name, phone, address, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('GET /auth/me error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT /api/auth/profile - Cập nhật thông tin cá nhân
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;
        await pool.query(
            'UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?',
            [full_name, phone, address, req.user.id]
        );
        res.json({ success: true, message: 'Đã cập nhật thông tin' });
    } catch (err) {
        console.error('PUT /auth/profile error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT /api/auth/change-password - Đổi mật khẩu
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải ít nhất 6 ký tự' });
        }

        const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }

        const newHash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
        res.json({ success: true, message: 'Đã đổi mật khẩu thành công' });
    } catch (err) {
        console.error('PUT /auth/change-password error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
