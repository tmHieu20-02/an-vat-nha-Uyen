const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/connection');
const staffMiddleware = require('../middleware/staff');

// ── Upload config ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1000);
        cb(null, unique + path.extname(file.originalname));
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_, file, cb) => {
        const ok = /jpeg|jpg|png|webp|gif/.test(file.mimetype);
        cb(ok ? null : new Error('Chỉ chấp nhận ảnh JPG/PNG/WEBP/GIF'), ok);
    },
});

// Tất cả routes đều cần xác thực staff/admin
router.use(staffMiddleware);

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    try {
        const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
        const [[{ pendingOrders }]] = await pool.query("SELECT COUNT(*) AS pendingOrders FROM orders WHERE status='pending'");
        const [[{ totalRevenue }]] = await pool.query("SELECT COALESCE(SUM(total_price),0) AS totalRevenue FROM orders WHERE status!='cancelled'");
        const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products WHERE is_active=1');
        const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role='customer'");
        const [recentOrders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10');

        res.json({ success: true, data: { totalOrders, pendingOrders, totalRevenue, totalProducts, totalUsers, recentOrders } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ── Orders ────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];

        let sql = `
            SELECT o.*,
                   COUNT(oi.id) AS item_count,
                   GROUP_CONCAT(oi.product_name SEPARATOR ', ') AS products_summary
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
        `;
        if (status) { sql += ' WHERE o.status = ?'; params.push(status); }
        sql += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(sql, params);

        let countSql = 'SELECT COUNT(*) AS total FROM orders';
        const countParams = [];
        if (status) { countSql += ' WHERE status = ?'; countParams.push(status); }
        const [[{ total }]] = await pool.query(countSql, countParams);

        res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!orders.length) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
        const [items] = await pool.query(`
            SELECT oi.*, p.image_url AS product_image_url
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        `, [req.params.id]);
        res.json({ success: true, data: { ...orders[0], items } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.patch('/orders/:id/status', async (req, res) => {
    try {
        // Parse body: multer không xử lý JSON, cần dùng express.json đã cài sẵn
        const status = req.body.status;
        const valid = ['pending', 'confirmed', 'shipping', 'done', 'cancelled'];
        if (!valid.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ: ' + status });
        }
        const [result] = await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
        res.json({ success: true, message: `Đã cập nhật: ${status}` });
    } catch (err) {
        console.error('PATCH orders status error:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
});

// ── Products ──────────────────────────────────────────────────
router.get('/products', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST - Thêm sản phẩm (có ảnh)
router.post('/products', upload.single('image'), async (req, res) => {
    try {
        const { name, category_id, price, original_price, description, emoji, color, badge, stock } = req.body;
        if (!name || !category_id || !price || !description || !emoji) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (tên, danh mục, giá, mô tả, emoji)' });
        }
        const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;
        const stockVal = stock !== undefined && stock !== '' ? parseInt(stock) : -1;

        const [result] = await pool.query(
            `INSERT INTO products (name, category_id, price, original_price, description, emoji, color, badge, image_url, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id, parseInt(price), original_price ? parseInt(original_price) : null,
                description, emoji, color || '#FF9B85', badge || null, image_url, stockVal]
        );
        res.status(201).json({ success: true, message: 'Đã thêm sản phẩm', id: result.insertId, image_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT - Sửa sản phẩm (có thể đổi ảnh)
router.put('/products/:id', upload.single('image'), async (req, res) => {
    try {
        const b = req.body;
        // FormData gửi mọi thứ đều là string — cần clean trước
        const name = b.name?.trim() || null;
        const category_id = b.category_id?.trim() || null;
        const price = b.price ? parseInt(b.price) : null;
        const original_price = b.original_price ? parseInt(b.original_price) : null;
        const description = b.description?.trim() || null;
        const emoji = b.emoji?.trim() || null;
        const color = b.color?.trim() || null;
        const badge = b.badge?.trim() || null;
        const is_active = b.is_active !== undefined && b.is_active !== '' ? parseInt(b.is_active) : null;
        const stock = b.stock !== undefined && b.stock !== '' ? parseInt(b.stock) : null;

        // Lấy ảnh cũ
        const [[old]] = await pool.query('SELECT image_url FROM products WHERE id = ?', [req.params.id]);
        if (!old) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

        let image_url = old.image_url;
        if (req.file) {
            image_url = `/uploads/products/${req.file.filename}`;
            if (old.image_url) {
                const oldPath = path.join(__dirname, '../../', old.image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        await pool.query(
            `UPDATE products SET
                name           = COALESCE(?, name),
                category_id    = COALESCE(?, category_id),
                price          = COALESCE(?, price),
                original_price = ?,
                description    = COALESCE(?, description),
                emoji          = COALESCE(?, emoji),
                color          = COALESCE(?, color),
                badge          = ?,
                image_url      = ?,
                is_active      = COALESCE(?, is_active),
                stock          = COALESCE(?, stock)
             WHERE id = ?`,
            [name, category_id, price, original_price,
                description, emoji, color, badge, image_url,
                is_active, stock, req.params.id]
        );
        res.json({ success: true, message: 'Đã cập nhật sản phẩm', image_url });
    } catch (err) {
        console.error('PUT /products/:id error:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi: ' + err.message });
    }
});

// DELETE - Xoá sản phẩm
router.delete('/products/:id', async (req, res) => {
    try {
        const [[product]] = await pool.query('SELECT image_url FROM products WHERE id = ?', [req.params.id]);
        if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

        // Xoá ảnh vật lý
        if (product.image_url) {
            const imgPath = path.join(__dirname, '../../', product.image_url);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }

        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Đã xoá sản phẩm' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: có thể sản phẩm đang được tham chiếu trong đơn hàng' });
    }
});

// ── Customers ─────────────────────────────────────────────────
router.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.email, u.full_name, u.phone, u.created_at,
                   COUNT(o.id) AS order_count,
                   COALESCE(SUM(o.total_price), 0) AS total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY total_spent DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ── Categories (cho form thêm sản phẩm) ──────────────────────
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories WHERE id != "all" ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
