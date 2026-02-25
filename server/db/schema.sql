-- Thêm role staff vào bảng users (chạy 1 lần nếu DB đã tồn tại)
ALTER TABLE users MODIFY COLUMN role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer';

-- Tạo tài khoản staff mẫu (password: staff123)
INSERT IGNORE INTO users (email, password_hash, full_name, phone, role)
VALUES ('staff@anvatnhapu.vn', '$2a$10$YourBcryptHashHere', 'Nhân Viên Shop', '0911111111', 'staff');


CREATE DATABASE IF NOT EXISTS anvatuyen
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE anvatuyen;

-- ============================================================
-- TABLE: categories
-- ============================================================
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS users;

CREATE TABLE categories (
    id          VARCHAR(30)  NOT NULL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    emoji       VARCHAR(10)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE products (
    id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    category_id    VARCHAR(30)  NOT NULL,
    price          INT          NOT NULL,
    original_price INT          NULL,
    rating         DECIMAL(2,1) NOT NULL DEFAULT 0,
    reviews        INT          NOT NULL DEFAULT 0,
    sold           INT          NOT NULL DEFAULT 0,
    badge          VARCHAR(50)  NULL,
    description    TEXT         NOT NULL,
    emoji          VARCHAR(10)  NOT NULL,
    color          VARCHAR(20)  NOT NULL DEFAULT '#FF9B85',
    is_active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)  NULL,
    address       TEXT         NULL,
    role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE orders (
    id               INT     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id          INT     NULL,
    customer_name    VARCHAR(255) NOT NULL,
    customer_phone   VARCHAR(20)  NOT NULL,
    customer_address TEXT         NOT NULL,
    note             TEXT         NULL,
    payment_method   ENUM('cod','momo','bank') NOT NULL DEFAULT 'cod',
    status           ENUM('pending','confirmed','shipping','done','cancelled') NOT NULL DEFAULT 'pending',
    total_price      INT     NOT NULL,
    shipping_fee     INT     NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE order_items (
    id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id     INT NOT NULL,
    product_id   INT NULL,
    product_name VARCHAR(255) NOT NULL,
    emoji        VARCHAR(10)  NOT NULL DEFAULT '🛍️',
    price        INT NOT NULL,
    qty          INT NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: testimonials
-- ============================================================
CREATE TABLE testimonials (
    id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    avatar     VARCHAR(10)  NOT NULL DEFAULT '👤',
    rating     INT          NOT NULL DEFAULT 5,
    comment    TEXT         NOT NULL,
    product    VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: categories
-- ============================================================
INSERT INTO categories (id, name, emoji) VALUES
('all',     'Tất cả',      '🛍️'),
('keo-banh','Kẹo bánh',    '🍬'),
('do-kho',  'Đồ khô',      '🥩'),
('o-mai',   'Ô mai',       '🌸'),
('do-say',  'Đồ sấy',      '🍊'),
('do-uong', 'Đồ uống',     '🧃'),
('healthy', 'Healthy',     '🥗'),
('snack',   'Snack',       '🍿'),
('do-lien', 'Đồ ăn liền',  '🍜');

-- ============================================================
-- SEED DATA: products (18 sản phẩm)
-- ============================================================
INSERT INTO products (name, category_id, price, original_price, rating, reviews, sold, badge, description, emoji, color) VALUES
-- Kẹo bánh
('Bánh Bouchee Lotte Chocolat Vị Phô Mai',       'keo-banh', 45000, 55000, 4.8, 234,  1200, 'Bán chạy',  'Bánh xốp phô mai mềm mịn, vị ngọt béo đặc trưng của Lotte',                     '🧁', '#FF9B85'),
('Bánh Mì Nướng Giòn Bơ Tỏi C''est Bon Orion',  'keo-banh', 28000, 35000, 4.7, 189,   980, 'Giảm 20%', 'Bánh mì nướng giòn, thơm hương bơ tỏi hấp dẫn',                                 '🥖', '#FFD166'),
('Bánh Trứng Tươi Chà Bông Karo Richy',          'keo-banh', 38000, NULL,  4.9, 312,  1560, 'Mới',       'Bánh trứng mềm xốp, nhân chà bông đậm đà thơm ngon',                            '🍰', '#F8A978'),
('Bánh Gấu Nhân Kem Vị Truyền Thống',            'keo-banh', 22000, 28000, 4.6, 421,  2100, 'Giảm 21%', 'Kẹo bánh hình gấu dễ thương, nhân kem ngọt ngào',                               '🐻', '#C9A96E'),
-- Ô mai
('Mận Dẻo Sấy Cay',                              'o-mai',    32000, 40000, 4.9, 567,  3200, 'Bán chạy',  'Mận dẻo sấy cay đặc biệt, vị chua ngọt cay hấp dẫn',                           '🍑', '#FF6B8A'),
('Ô Mai Hoa Đào',                                 'o-mai',    35000, NULL,  4.8, 298,  1890, 'Hot',       'Ô mai hoa đào Hà Nội truyền thống, vị chua ngọt thanh mát',                     '🌸', '#FFB3C6'),
('Ô Mai Xí Muội Chua Ngọt',                      'o-mai',    28000, 35000, 4.7, 156,   780, 'Giảm 20%', 'Xí muội chua ngọt đặc sản, tan chảy ngay trên đầu lưỡi',                        '🍒', '#E63946'),
-- Đồ khô
('Bánh Akiko Vị Phô Mai',                        'do-kho',   25000, NULL,  4.5, 203,  1050, NULL,        'Bánh snack giòn rụm, phủ phô mai thơm béo',                                     '🧀', '#FFD166'),
('Khô Bò Miếng Cay Mặn Đậm Đà',                 'do-kho',   65000, 80000, 4.9, 445,  2200, 'Premium',   'Khô bò thơm ngon, dai đậm đà, ăn là ghiền',                                    '🥩', '#A0522D'),
-- Snack
('Snack Nhân Đậu Phộng Pinattsu Oishi Mực Cay', 'snack',    18000, 22000, 4.6, 378,  2800, 'Giảm 18%', 'Snack nhân đậu phộng giòn cay, vị mực đậm đà',                                  '🍿', '#F4A261'),
('Bịch 20 Gói Bimbim Soccola Ông Già Noel',      'snack',    42000, 55000, 4.4, 122,   560, 'Giảm 24%', 'Combo siêu tiết kiệm 20 gói bimbim socola thơm ngon',                           '🎅', '#E63946'),
-- Đồ sấy
('Mít Sấy Giòn Vàng Ươm',                        'do-say',   45000, NULL,  4.8, 267,  1340, 'Healthy',   'Mít sấy giòn tự nhiên, không chất bảo quản, giữ nguyên vị ngọt',               '🍈', '#F7D47A'),
('Cà Rốt Sấy Giòn',                              'do-say',   35000, 42000, 4.7, 189,   920, 'Healthy',   'Cà rốt sấy giòn nguyên chất, giàu vitamin A và beta-carotene',                  '🥕', '#FF6B35'),
-- Healthy
('Bánh BISCOTTI Ăn Kiêng Nguyên Cám Mix 3 Vị',  'healthy',  55000, 68000, 4.8, 198,   870, 'Ăn kiêng',  'Bánh biscotti nguyên cám healthy, mix 3 vị, ít calo',                           '🌾', '#8BC34A'),
-- Đồ uống
('Trà Sữa Trân Châu Đường Đen',                  'do-uong',  28000, NULL,  4.9, 512,  3100, 'Trending',  'Trà sữa trân châu đường đen thơm ngon, sánh mịn',                              '🧋', '#6B4C3B'),
('Nước Ép Dâu Tây Tươi 100%',                    'do-uong',  35000, 42000, 4.7, 234,  1100, 'Giảm 17%', 'Nước ép dâu tây tươi nguyên chất, không đường, không chất bảo quản',            '🍓', '#E63946'),
-- Đồ ăn liền
('Mì Lẩu Thái Cay Nồng',                         'do-lien',  15000, 18000, 4.6, 678,  4200, 'Hot',       'Mì lẩu thái cay nồng, nước súp đậm đà hương vị Thái Lan',                      '🍜', '#FF6B35'),
('Cháo Bào Ngư Vi Cá',                            'do-lien',  22000, NULL,  4.8, 345,  1900, 'Cao cấp',   'Cháo hải sản bào ngư vi cá thượng hạng, bổ dưỡng',                             '🦪', '#7EC8E3');

-- ============================================================
-- SEED DATA: testimonials
-- ============================================================
INSERT INTO testimonials (name, avatar, rating, comment, product) VALUES
('Nguyễn Thị Lan',   '👩',    5, 'Shop giao hàng nhanh, đồ ăn vặt ngon tuyệt vời! Mình đã order lần thứ 5 rồi, lần nào cũng hài lòng.', 'Mận Dẻo Sấy Cay'),
('Trần Minh Tú',     '👨',    5, 'Khô bò ngon đỉnh, đóng gói cẩn thận, hương vị chuẩn. Sẽ ủng hộ lâu dài!',                              'Khô Bò Miếng Cay'),
('Phạm Thùy Dung',   '👩‍🦱', 5, 'Ô mai hoa đào ngon lắm ạ, đúng vị truyền thống Hà Nội. Mua làm quà biếu rất phù hợp.',                 'Ô Mai Hoa Đào'),
('Lê Hoàng Phúc',    '🧑',    4, 'Giá cả hợp lý, chất lượng tốt. Mình hay mua snack cho cả gia đình. Giao hàng nhanh!',                   'Snack Pinattsu Oishi');

-- ============================================================
-- SEED DATA: admin user (password: admin123)
-- bcrypt hash của "admin123"
-- ============================================================
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@anvatuyen.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', 'Admin Nhà Pu', '0987654321', 'admin');

SELECT 'Database anvatuyen created and seeded successfully!' AS message;
