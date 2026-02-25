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
            `SELECT r.id, r.user_name, r.rating, r.comment, r.created_at
             FROM reviews r
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC
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

// GET /api/reviews/recent – 8 review mới nhất toàn site (cho trang chủ)
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const [rows] = await pool.query(
            `SELECT r.id, r.user_name, r.rating, r.comment, r.created_at,
                    p.name AS product_name, p.emoji AS product_emoji, p.image_url AS product_image
             FROM reviews r
             LEFT JOIN products p ON p.id = r.product_id
             ORDER BY r.created_at DESC
             LIMIT ?`,
            [limit]
        );

        // Tính thống kê tổng hợp
        const [[stats]] = await pool.query(
            `SELECT
                ROUND(AVG(rating), 1) AS avg_rating,
                COUNT(*) AS total,
                SUM(rating = 5) AS s5,
                SUM(rating = 4) AS s4,
                SUM(rating = 3) AS s3,
                SUM(rating = 2) AS s2,
                SUM(rating = 1) AS s1
             FROM reviews`
        );

        res.json({ success: true, data: rows, stats });
    } catch (err) {
        console.error('GET /reviews/recent error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/reviews/check?product_id=X – kiểm tra user đã đánh giá chưa
router.get('/check', authMiddleware, async (req, res) => {
    try {
        const { product_id } = req.query;
        if (!product_id) return res.json({ success: true, reviewed: false });
        const [[row]] = await pool.query(
            'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
            [product_id, req.user.id]
        );
        res.json({ success: true, reviewed: !!row });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/reviews/my-reviews – tất cả product_id user đã đánh giá (batch check)
router.get('/my-reviews', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT product_id FROM reviews WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ success: true, data: rows.map(r => r.product_id) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/reviews – đăng đánh giá (cần đăng nhập + đơn hoàn thành)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;

        if (!product_id || !rating || !comment?.trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating phải từ 1–5' });
        }

        // Kiểm tra user có đơn "done" chứa sản phẩm này không
        const [[doneOrder]] = await pool.query(
            `SELECT o.id FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = ? AND o.status = 'done' AND oi.product_id = ?
             LIMIT 1`,
            [req.user.id, product_id]
        );
        if (!doneOrder) {
            return res.status(403).json({ success: false, message: 'Bạn chỉ có thể đánh giá sản phẩm trong đơn hàng đã hoàn thành' });
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
