-- 1. Sử dụng database test (theo cấu hình Render của bạn)
USE test;

-- 2. Tắt kiểm tra khóa ngoại để dọn dẹp database
SET FOREIGN_KEY_CHECKS = 0;

-- 3. Xóa các bảng cũ (Thứ tự ưu tiên bảng con trước)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 4. Bật lại kiểm tra khóa ngoại để bắt đầu tạo mới
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TẠO CẤU TRÚC BẢNG
-- ============================================================

-- Bảng categories
CREATE TABLE categories (
    id VARCHAR(30) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng products
CREATE TABLE products (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(30) NOT NULL,
    price INT NOT NULL,
    original_price INT NULL,
    rating DECIMAL(2,1) NOT NULL DEFAULT 0,
    reviews INT NOT NULL DEFAULT 0,
    sold INT NOT NULL DEFAULT 0,
    badge VARCHAR(50) NULL,
    description TEXT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#FF9B85',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng users
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng orders
CREATE TABLE orders (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    note TEXT NULL,
    payment_method ENUM('cod','momo','bank') NOT NULL DEFAULT 'cod',
    status ENUM('pending','confirmed','shipping','done','cancelled') NOT NULL DEFAULT 'pending',
    total_price INT NOT NULL,
    shipping_fee INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng order_items
CREATE TABLE order_items (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL DEFAULT '🛍️',
    price INT NOT NULL,
    qty INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng testimonials
CREATE TABLE testimonials (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) NOT NULL DEFAULT '👤',
    rating INT NOT NULL DEFAULT 5,
    comment TEXT NOT NULL,
    product VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NẠP DỮ LIỆU MẪU
-- ============================================================

-- Categories
INSERT INTO categories (id, name, emoji) VALUES 
('an-vat-man', 'Ăn Vặt Mặn', '🥨'),
('trai-cay-say', 'Trái Cây Sấy', '🥭'),
('banh-ngot', 'Bánh Ngọt', '🍪');

-- Products
INSERT INTO products (name, category_id, price, original_price, rating, reviews, sold, badge, description, emoji, color) VALUES 
('Cơm cháy chà bông', 'an-vat-man', 35000, NULL, 5.0, 0, 0, 'Hot', 'Cơm cháy chà bông giòn rụm, thơm ngon', '🍚', '#FF9B85'),
('Xoài sấy', 'trai-cay-say', 40000, NULL, 5.0, 0, 0, NULL, 'Xoài sấy tự nhiên, chua ngọt dễ ăn', '🥭', '#FFD166'),
('Xoài sấy dẻo muối ớt', 'trai-cay-say', 45000, NULL, 5.0, 0, 0, 'Bán chạy', 'Xoài sấy dẻo muối ớt cay chua ngọt', '🌶️', '#FF6B8A'),
('Chuối mè sấy giòn', 'trai-cay-say', 30000, NULL, 5.0, 0, 0, NULL, 'Chuối sấy tẩm hạt mè giòn tan', '🍌', '#F7D47A'),
('Bánh gấu nhân kem', 'banh-ngot', 40000, NULL, 5.0, 0, 0, 'Giảm 10%', 'Bánh gấu nhân kem sữa tuổi thơ', '🐻', '#C9A96E'),
('Bánh tai heo', 'banh-ngot', 25000, NULL, 5.0, 0, 0, NULL, 'Bánh tai heo giòn tan thơm béo', '🐷', '#FF9B85'),
('Khoai tây phô mai', 'an-vat-man', 35000, NULL, 5.0, 0, 0, 'Hot', 'Khoai tây lắc phô mai thơm ngon đậm đà', '🧀', '#FFD166'),
('Khoai tây sấy', 'an-vat-man', 30000, NULL, 5.0, 0, 0, NULL, 'Khoai tây sấy giòn ăn vặt cực dính', '🥔', '#F4A261'),
('Khoai tây sấy rong biển', 'an-vat-man', 38000, NULL, 5.0, 0, 0, 'Bán chạy', 'Khoai tây sấy tẩm rong biển mặn mặn thơm thơm', '🌿', '#8BC34A'),
('Thèo lèo', 'an-vat-man', 20000, NULL, 5.0, 0, 0, NULL, 'Thèo lèo đậu phộng giòn xốp truyền thống', '🥜', '#F4A261');

-- Users (Dùng ON DUPLICATE KEY để tránh lỗi lặp email)
INSERT INTO users (email, password_hash, full_name, phone, role) 
VALUES 
(
  'toh9082@gmail.com', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', 
  'Toh Hieu Admin', 
  '0817161828', 
  'admin'
),
(
  'tominhhieu2022@gmail.com', 
  '$2a$10$1.VuajH8ojPc/FAfU2yGp.hbSA5eP.Ys...', 
  'tominhhieu', 
  '0817161828', 
  'staff'
)
ON DUPLICATE KEY UPDATE role = VALUES(role);

SELECT '✅ Hệ thống đã sẵn sàng: Bảng sạch, dữ liệu chuẩn, Admin/Staff đã được cấp quyền!' AS message;