const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/testimonials - Lấy đánh giá
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM testimonials ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('GET /testimonials error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/testimonials - Thêm đánh giá
router.post('/', async (req, res) => {
    try {
        const { name, avatar, rating, comment, product } = req.body;
        if (!name || !comment || !product) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        const [result] = await pool.query(
            'INSERT INTO testimonials (name, avatar, rating, comment, product) VALUES (?, ?, ?, ?, ?)',
            [name, avatar || '👤', rating || 5, comment, product]
        );
        res.status(201).json({ success: true, message: 'Cảm ơn đánh giá của bạn!', id: result.insertId });
    } catch (err) {
        console.error('POST /testimonials error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
