const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

// Tất cả wishlist routes đều cần đăng nhập
router.use(authMiddleware);

// GET /api/wishlist  – lấy danh sách sản phẩm yêu thích
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.id, p.name, p.price, p.original_price, p.image_url, p.emoji, p.color, p.rating, p.reviews, p.badge, p.stock,
                    c.name AS category_name, w.created_at AS saved_at
             FROM wishlist w
             JOIN products p ON p.id = w.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE w.user_id = ? AND p.is_active = 1
             ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('GET /wishlist error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/wishlist/ids  – lấy danh sách product_id đã yêu thích (dùng cho UI hiển thị trạng thái)
router.get('/ids', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT product_id FROM wishlist WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ success: true, data: rows.map(r => r.product_id) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/wishlist/:productId  – toggle thêm/xoá khỏi wishlist
router.post('/:productId', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        if (isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        // Kiểm tra sản phẩm tồn tại
        const [[product]] = await pool.query('SELECT id FROM products WHERE id = ? AND is_active = 1', [productId]);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // Kiểm tra đã có trong wishlist chưa
        const [[existing]] = await pool.query(
            'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
            [req.user.id, productId]
        );

        if (existing) {
            // Đã có → xoá
            await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
            return res.json({ success: true, added: false, message: 'Đã xoá khỏi danh sách yêu thích' });
        } else {
            // Chưa có → thêm
            await pool.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
            return res.json({ success: true, added: true, message: 'Đã thêm vào danh sách yêu thích' });
        }
    } catch (err) {
        console.error('POST /wishlist/:id error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// DELETE /api/wishlist/:productId  – xoá khỏi wishlist (alternative)
router.delete('/:productId', async (req, res) => {
    try {
        await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
        res.json({ success: true, message: 'Đã xoá khỏi danh sách yêu thích' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
