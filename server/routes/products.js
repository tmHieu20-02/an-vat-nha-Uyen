const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/products
// Query params: ?cat=keo-banh  ?search=bánh  ?sort=price_asc|price_desc|rating|sold|newest
//               ?page=1&limit=16  ?price_min=20000&price_max=50000  ?has_discount=1
router.get('/', async (req, res) => {
    try {
        const { cat, search, sort, page = 1, limit = 16, price_min, price_max, has_discount } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sql = `
            SELECT p.id, p.name, p.category_id, p.price, p.original_price, p.rating, p.reviews,
                   p.sold, p.badge, p.description, p.emoji, p.color, p.image_url, p.stock, p.is_active,
                   p.created_at, c.name AS category_name, c.emoji AS category_emoji
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
        `;
        const params = [];

        if (cat && cat !== 'all') {
            sql += ' AND p.category_id = ?';
            params.push(cat);
        }
        if (search) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (price_min) {
            sql += ' AND p.price >= ?';
            params.push(parseInt(price_min));
        }
        if (price_max) {
            sql += ' AND p.price <= ?';
            params.push(parseInt(price_max));
        }
        if (has_discount === '1') {
            sql += ' AND p.original_price IS NOT NULL AND p.original_price > p.price';
        }

        const sortMap = {
            price_asc: 'p.price ASC',
            price_desc: 'p.price DESC',
            rating: 'p.rating DESC',
            sold: 'p.sold DESC',
            newest: 'p.created_at DESC',
        };
        sql += ` ORDER BY ${sortMap[sort] || 'p.sold DESC'}`;
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(sql, params);

        // Count total
        let countSql = 'SELECT COUNT(*) AS total FROM products p WHERE p.is_active = 1';
        const countParams = [];
        if (cat && cat !== 'all') { countSql += ' AND p.category_id = ?'; countParams.push(cat); }
        if (search) { countSql += ' AND (p.name LIKE ? OR p.description LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }
        if (price_min) { countSql += ' AND p.price >= ?'; countParams.push(parseInt(price_min)); }
        if (price_max) { countSql += ' AND p.price <= ?'; countParams.push(parseInt(price_max)); }
        if (has_discount === '1') { countSql += ' AND p.original_price IS NOT NULL AND p.original_price > p.price'; }

        const [[{ total }]] = await pool.query(countSql, countParams);

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('GET /products error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category_name, c.emoji AS category_emoji
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ? AND p.is_active = 1`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('GET /products/:id error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/products (admin/staff only - handled via staff route)
router.post('/', async (req, res) => {
    try {
        const { name, category_id, price, original_price, rating, reviews, sold, badge, description, emoji, color, stock } = req.body;
        if (!name || !category_id || !price || !description || !emoji) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        const [result] = await pool.query(
            `INSERT INTO products (name, category_id, price, original_price, rating, reviews, sold, badge, description, emoji, color, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id, price, original_price || null, rating || 0, reviews || 0, sold || 0,
                badge || null, description, emoji, color || '#FF9B85', stock !== undefined ? stock : -1]
        );
        res.status(201).json({ success: true, message: 'Đã thêm sản phẩm', id: result.insertId });
    } catch (err) {
        console.error('POST /products error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, category_id, price, original_price, rating, reviews, sold, badge, description, emoji, color, is_active, stock } = req.body;
        const [result] = await pool.query(
            `UPDATE products SET
                name           = COALESCE(?, name),
                category_id    = COALESCE(?, category_id),
                price          = COALESCE(?, price),
                original_price = ?,
                rating         = COALESCE(?, rating),
                reviews        = COALESCE(?, reviews),
                sold           = COALESCE(?, sold),
                badge          = ?,
                description    = COALESCE(?, description),
                emoji          = COALESCE(?, emoji),
                color          = COALESCE(?, color),
                is_active      = COALESCE(?, is_active),
                stock          = COALESCE(?, stock)
             WHERE id = ?`,
            [name, category_id, price,
                original_price !== undefined ? original_price : undefined,
                rating, reviews, sold,
                badge !== undefined ? badge : undefined,
                description, emoji, color, is_active,
                stock !== undefined ? stock : undefined,
                req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        res.json({ success: true, message: 'Đã cập nhật sản phẩm' });
    } catch (err) {
        console.error('PUT /products/:id error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// DELETE /api/products/:id - Xóa mềm
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        res.json({ success: true, message: 'Đã ẩn sản phẩm' });
    } catch (err) {
        console.error('DELETE /products/:id error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
