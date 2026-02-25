require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pool = require('./db/connection');

// Import routes
const productsRoute = require('./routes/products');
const categoriesRoute = require('./routes/categories');
const ordersRoute = require('./routes/orders');
const authRoute = require('./routes/auth');
const testimonialsRoute = require('./routes/testimonials');
const staffRoute = require('./routes/staff');
const reviewsRoute = require('./routes/reviews');
const wishlistRoute = require('./routes/wishlist');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ─────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────
// Toàn bộ API: 200 req / 1 phút
app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
}));

// Auth endpoints: 15 req / 15 phút (chống brute-force)
app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { success: false, message: 'Quá nhiều lần đăng nhập sai, thử lại sau 15 phút.' },
}));
app.use('/api/auth/register', rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Quá nhiều lần đăng ký từ IP này.' },
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🍿 Ăn Vặt Nhà Pu API is running!',
        version: '2.0.0',
        endpoints: { products: '/api/products', categories: '/api/categories', orders: '/api/orders', auth: '/api/auth', staff: '/api/staff', reviews: '/api/reviews', wishlist: '/api/wishlist' },
    });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/products', productsRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/auth', authRoute);
app.use('/api/testimonials', testimonialsRoute);
app.use('/api/staff', staffRoute);
app.use('/api/reviews', reviewsRoute);
app.use('/api/wishlist', wishlistRoute);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại` });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi server không xác định' });
});

// ── Auto migrate DB schema ────────────────────────────────────
async function autoMigrate() {
    const migrations = [
        // users: thêm role staff
        `ALTER TABLE users MODIFY COLUMN role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer'`,
        // users: thêm address
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER phone`,
        // products: thêm image_url
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER color`,
        // products: thêm stock (-1 = không giới hạn)
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT -1 AFTER image_url`,
        // products: thêm updated_at
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP`,
        // orders: thêm updated_at
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP`,
        // orders: thêm shipping_fee
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee INT NOT NULL DEFAULT 0 AFTER total_price`,
        // orders: thêm note
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT NULL AFTER customer_address`,
        // Bảng reviews
        `CREATE TABLE IF NOT EXISTS reviews (
            id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            user_id    INT NULL,
            user_name  VARCHAR(100) NOT NULL,
            rating     TINYINT NOT NULL DEFAULT 5,
            comment    TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        // Bảng wishlist
        `CREATE TABLE IF NOT EXISTS wishlist (
            id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id    INT NOT NULL,
            product_id INT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_product (user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        // Indexes
        `CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id)`,
        `CREATE INDEX IF NOT EXISTS idx_products_active_sold ON products(is_active, sold)`,
        `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at)`,
        `CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`,
    ];

    for (const sql of migrations) {
        try {
            await pool.query(sql);
        } catch (err) {
            if (!err.message.includes('Duplicate column') &&
                !err.message.includes('already exists') &&
                !err.message.includes('Duplicate key name')) {
                console.warn('⚠️  Migration warn:', err.message.slice(0, 120));
            }
        }
    }
    console.log('🔄 DB schema OK');
}

// ── Start server ──────────────────────────────────────────────
async function startServer() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        conn.release();

        await autoMigrate();

        app.listen(PORT, () => {
            console.log(`🚀 Server: http://localhost:${PORT}`);
            console.log(`📦 API:    http://localhost:${PORT}/api/products`);
        });
    } catch (err) {
        console.error('❌ Không thể kết nối MySQL:', err.message);
        process.exit(1);
    }
}

startServer();
