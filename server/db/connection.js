const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'anvatnhapu',
    charset: 'utf8mb4',
    timezone: '+07:00',

    // Pool config
    waitForConnections: true,
    connectionLimit: 20,     // tối đa 20 kết nối đồng thời
    queueLimit: 50,     // tối đa 50 request xếp hàng chờ (0 = unlimited → RAM leak!)
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,

    // Timeout settings
    connectTimeout: 10000,      // 10s kết nối DB timeout
});

module.exports = pool;