const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

// GET /api/reviews?product_id=X  – lấy đánh giá của sản phẩm
router.get('/', async (req, res) => {
    try {
        const { product_id, page = 1, limit = 10 } = req.query;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu product_id' });
        }
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [rows] = await pool.query(
            `SELECT id, user_name, rating, comment, created_at
             FROM reviews
             WHERE product_id = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [product_id, parseInt(limit), offset]
        );

        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM reviews WHERE product_id = ?',
            [product_id]
        );

        res.json({
            success: true,
            data: rows,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) {
        console.error('GET /reviews error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/reviews  – đăng đánh giá (cần đăng nhập)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;

        if (!product_id || !rating || !comment?.trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating phải từ 1–5' });
        }

        // Kiểm tra sản phẩm tồn tại
        const [[product]] = await pool.query('SELECT id FROM products WHERE id = ? AND is_active = 1', [product_id]);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // Kiểm tra đã đánh giá chưa
        const [[existing]] = await pool.query(
            'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
            [product_id, req.user.id]
        );
        if (existing) {
            return res.status(409).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
        }

        // Thêm đánh giá
        await pool.query(
            'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [product_id, req.user.id, req.user.full_name || 'Khách', rating, comment.trim()]
        );

        // Cập nhật rating & số lượt đánh giá cho sản phẩm
        await pool.query(
            `UPDATE products
             SET rating  = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ?),
                 reviews = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
             WHERE id = ?`,
            [product_id, product_id, product_id]
        );

        res.status(201).json({ success: true, message: 'Cảm ơn đánh giá của bạn!' });
    } catch (err) {
        console.error('POST /reviews error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
