const path = require('path');
const pool = require(path.join(__dirname, '../db/connection'));

async function fix() {
    const alters = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER phone",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT NULL AFTER customer_address",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee INT NOT NULL DEFAULT 0 AFTER total_price",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER color",
        "ALTER TABLE users MODIFY COLUMN role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer'",
    ];
    for (const sql of alters) {
        try { await pool.query(sql); console.log('OK:', sql.slice(0, 60)); }
        catch (e) { console.log('Skip:', e.message.slice(0, 80)); }
    }
    const [u] = await pool.query('SHOW COLUMNS FROM users');
    console.log('Users cols:', u.map(c => c.Field).join(', '));
    const [o] = await pool.query('SHOW COLUMNS FROM orders');
    console.log('Orders cols:', o.map(c => c.Field).join(', '));
    process.exit(0);
}
fix().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
