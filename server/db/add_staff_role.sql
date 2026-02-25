-- Chạy script này trong MySQL Workbench để thêm role staff
-- Kết nối vào database anvatnhapu trước

USE anvatnhapu;

-- Bước 1: Thêm role 'staff' vào ENUM
ALTER TABLE users MODIFY COLUMN role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer';

-- Bước 2: Tạo tài khoản staff mẫu (password: staff123)
-- bcrypt hash của "staff123"
INSERT INTO users (email, password_hash, full_name, phone, role)
VALUES ('staff@anvatnhapu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', 'Nhân Viên Shop', '0911111111', 'staff')
ON DUPLICATE KEY UPDATE role = 'staff';

-- Kiểm tra kết quả
SELECT id, email, full_name, role FROM users;
