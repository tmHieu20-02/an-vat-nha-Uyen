-- Chạy trong MySQL Workbench
USE anvatnhapu;

-- Thêm cột image_url vào bảng products
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER color;

SELECT 'Done! Column image_url added.' AS result;
