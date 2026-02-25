const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/categories - Lấy tất cả danh mục
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY id');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('GET /categories error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
