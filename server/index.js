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

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

// ── Helper: thêm cột nếu chưa có (tương thích mọi phiên bản MySQL) ──
async function addColumnIfMissing(table, column, definition) {
    const [[{ cnt }]] = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    if (cnt === 0) {
        await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`  ✚ ${table}.${column} added`);
    }
}

// ── Helper: tạo index nếu chưa có ────────────────────────────
async function addIndexIfMissing(indexName, table, columns) {
    const [[{ cnt }]] = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, indexName]
    );
    if (cnt === 0) {
        await pool.query(`CREATE INDEX \`${indexName}\` ON \`${table}\`(${columns})`);
        console.log(`  ✚ index ${indexName} added`);
    }
}

// ── Auto migrate DB schema ────────────────────────────────────
async function autoMigrate() {
    // 1. Sửa kiểu cột role (bọc try/catch vì MODIFY không có IF NOT EXISTS)
    try {
        await pool.query(`ALTER TABLE users MODIFY COLUMN role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer'`);
    } catch (e) { /* bỏ qua nếu đã đúng kiểu */ }

    // 2. Thêm các cột còn thiếu
    await addColumnIfMissing('users', 'address', 'VARCHAR(500) NULL');
    await addColumnIfMissing('products', 'image_url', 'VARCHAR(500) NULL');
    await addColumnIfMissing('products', 'stock', 'INT NOT NULL DEFAULT -1');
    await addColumnIfMissing('products', 'updated_at', 'TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP');
    await addColumnIfMissing('orders', 'updated_at', 'TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP');
    await addColumnIfMissing('orders', 'shipping_fee', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('orders', 'note', 'TEXT NULL');
    await addColumnIfMissing('order_items', 'emoji', "VARCHAR(10) NOT NULL DEFAULT '🛍️'");

    // 3. Tạo bảng reviews & wishlist nếu chưa có
    await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
            id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            user_id    INT NULL,
            user_name  VARCHAR(100) NOT NULL,
            rating     TINYINT NOT NULL DEFAULT 5,
            comment    TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS wishlist (
            id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id    INT NOT NULL,
            product_id INT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_product (user_id, product_id),
            FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Indexes
    await addIndexIfMissing('idx_products_cat', 'products', 'category_id');
    await addIndexIfMissing('idx_products_active_sold', 'products', 'is_active, sold');
    await addIndexIfMissing('idx_orders_user', 'orders', 'user_id');
    await addIndexIfMissing('idx_orders_status', 'orders', 'status, created_at');
    await addIndexIfMissing('idx_reviews_product', 'reviews', 'product_id');

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

// ── Graceful shutdown ─────────────────────────────────────────
function shutdown(signal) {
    console.log(`\n[${signal}] Server đang tắt...`);
    pool.end().then(() => {
        console.log('DB pool đã đóng. Bye! 👋');
        process.exit(0);
    }).catch(() => process.exit(1));
    setTimeout(() => process.exit(1), 8000); // force exit sau 8s
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Chống crash vì lỗi không được bắt ────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
    // Không exit để server tiếp tục chạy (chỉ log)
});
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    // Không exit — lỗi đã được log, route-level try/catch vẫn hoạt động
});
