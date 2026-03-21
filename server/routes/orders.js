const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

// POST /api/orders - Tạo đơn hàng mới (có hoặc không cần đăng nhập)
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            customer_name,
            customer_phone,
            customer_address,
            note,
            payment_method = 'cod',
            items,           // [{ product_id, product_name, emoji, price, qty }]
            user_id = null,
        } = req.body;

        // Validation
        if (!customer_name || !customer_phone || !customer_address) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ success: false, message: 'Thiếu thông tin người nhận' });
        }
        if (!items || items.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ success: false, message: 'Đơn hàng không có sản phẩm' });
        }

        // Kiểm tra user_id nếu có
        if (user_id) {
            const [users] = await conn.query('SELECT id FROM users WHERE id = ?', [user_id]);
            if (users.length === 0) {
                await conn.rollback();
                conn.release();
                return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ (có thể do reset DB). Vui lòng đăng xuất và đăng nhập lại!' });
            }
        }

        // Tính tổng tiền
        const total_price = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        const shipping_fee = total_price >= 200000 ? 0 : 30000;
        const grand_total = total_price + shipping_fee;

        // Tạo order
        const [orderResult] = await conn.query(
            `INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, note, payment_method, total_price, shipping_fee)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, customer_name, customer_phone, customer_address, note || null, payment_method, grand_total, shipping_fee]
        );
        const orderId = orderResult.insertId;

        // Tạo order_items
        for (const item of items) {
            await conn.query(
                `INSERT INTO order_items (order_id, product_id, product_name, emoji, price, qty)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id || null, item.product_name, item.emoji || '🛍️', item.price, item.qty]
            );

            // Cập nhật số lượng đã bán + trừ tồn kho (nếu có giới hạn)
            if (item.product_id) {
                try {
                    await conn.query(
                        'UPDATE products SET sold = sold + ? WHERE id = ?',
                        [item.qty, item.product_id]
                    );
                    // Trừ stock chỉ khi stock > 0 (stock=-1 = không giới hạn)
                    await conn.query(
                        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ? AND stock > 0',
                        [item.qty, item.product_id]
                    );
                } catch (updateErr) {
                    console.warn('⚠️ Không thể cập nhật sold/stock:', updateErr.message);
                }
            }
        }

        await conn.commit();
        conn.release();

        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công!',
            data: {
                order_id: orderId,
                total_price: grand_total,
                shipping_fee,
                payment_method,
                status: 'pending',
            },
        });
    } catch (err) {
        await conn.rollback();
        conn.release();
        console.error('POST /orders error:', err);
        res.status(500).json({ success: false, message: err.message || 'Lỗi server khi tạo đơn hàng' });
    }
});

// GET /api/orders - Lấy tất cả đơn hàng (admin, cần token)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sql = `
            SELECT o.*,
                   COUNT(oi.id) AS item_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
        `;
        const params = [];

        // Nếu không phải admin → chỉ thấy đơn của mình
        if (req.user.role !== 'admin') {
            sql += ' WHERE o.user_id = ?';
            params.push(req.user.id);
            if (status) { sql += ' AND o.status = ?'; params.push(status); }
        } else {
            if (status) { sql += ' WHERE o.status = ?'; params.push(status); }
        }

        sql += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('GET /orders error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/orders/:id - Chi tiết đơn hàng
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const order = orders[0];
        // Chỉ admin hoặc chủ đơn mới xem được
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Không có quyền xem đơn hàng này' });
        }

        const [items] = await pool.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        res.json({ success: true, data: { ...order, items } });
    } catch (err) {
        console.error('GET /orders/:id error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PATCH /api/orders/:id/status - Cập nhật trạng thái đơn hàng (admin)
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Chỉ admin mới có thể cập nhật trạng thái' });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'shipping', 'done', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        const [result] = await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
        res.json({ success: true, message: `Đã cập nhật trạng thái: ${status}` });
    } catch (err) {
        console.error('PATCH /orders/:id/status error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/orders/user/:userId - Lịch sử đơn hàng của user
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
        }

        const [orders] = await pool.query(
            `SELECT o.*,
                    GROUP_CONCAT(oi.product_name  ORDER BY oi.id SEPARATOR '|||') AS product_names,
                    GROUP_CONCAT(oi.qty           ORDER BY oi.id SEPARATOR '|||') AS product_qtys,
                    GROUP_CONCAT(COALESCE(oi.emoji,'🛍️') ORDER BY oi.id SEPARATOR '|||') AS product_emojis,
                    GROUP_CONCAT(COALESCE(p.image_url,'') ORDER BY oi.id SEPARATOR '|||') AS product_images,
                    GROUP_CONCAT(COALESCE(oi.product_id,0) ORDER BY oi.id SEPARATOR '|||') AS product_ids,
                    SUM(oi.qty) AS total_qty
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json({ success: true, data: orders });
    } catch (err) {
        console.error('GET /orders/user/:userId error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
