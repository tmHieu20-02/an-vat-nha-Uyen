-- =====================================================
-- MIGRATION: Thêm staff role + image_url + tài khoản staff
-- Chạy trong MySQL Workbench (kết nối đến database anvatnhapu)
-- =====================================================

USE anvatnhapu;

-- BƯỚC 1: Thêm role 'staff' vào ENUM của bảng users
ALTER TABLE users 
MODIFY COLUMN role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer';

-- BƯỚC 2: Thêm cột image_url vào bảng products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER color;

-- BƯỚC 3: Tạo tài khoản staff (password: staff123)
INSERT INTO users (email, password_hash, full_name, phone, role)
VALUES (
    'staff@anvatnhapu.vn',
    '$2a$10$rC6PQ2r7k8grNaFvgo4Y.tEs8jBxaOeXee7ZjsNPrP24',
    'Nhân Viên Shop',
    '0911111111',
    'staff'
)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2a$10$rC6PQ2r7k8grNaFvgo4Y.tEs8jBxaOeXee7ZjsNPrP24',
    role = 'staff';

-- BƯỚC 4: Kiểm tra kết quả
SELECT id, email, full_name, role, phone FROM users ORDER BY id;
SELECT 'image_url column:' AS info, COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA='anvatnhapu' AND TABLE_NAME='products' AND COLUMN_NAME='image_url';
