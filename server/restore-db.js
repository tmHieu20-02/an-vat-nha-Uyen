require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : undefined,
        multipleStatements: true
    });
    
    try {
        console.log('Đang kết nối vào database...');
        const sqlPath = path.join(__dirname, 'db', 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Tiến hành chạy schema.sql...');
        await connection.query(sql);
        console.log('✅ Đã phục hồi database thành công!');
    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await connection.end();
    }
}

run();
