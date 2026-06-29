ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS uom_categories VARCHAR(255);

UPDATE categories
SET uom_categories = CASE
                         WHEN category_name IN ('Đồ uống', 'Đồ uống & bán lẻ') THEN 'VOLUME,PACKAGE'
                         WHEN category_name IN ('Sữa & trứng lạnh') THEN 'COUNT,VOLUME,PACKAGE'
                         WHEN category_name IN ('Thực phẩm khô', 'Mì & thực phẩm khô', 'Snack & bánh kẹo') THEN 'COUNT,WEIGHT,PACKAGE'
                         WHEN category_name IN ('Gia vị', 'Gia vị & dầu ăn') THEN 'WEIGHT,VOLUME,PACKAGE'
                         WHEN category_name IN ('Chăm sóc cá nhân', 'Vệ sinh nhà cửa') THEN 'COUNT,VOLUME,PACKAGE'
                         ELSE uom_categories
    END
WHERE uom_categories IS NULL OR uom_categories = '';

UPDATE categories
SET uom_categories = 'COUNT,PACKAGE'
WHERE uom_categories IS NULL OR uom_categories = '';

ALTER TABLE items
    ADD COLUMN IF NOT EXISTS purchase_conversion_ratio NUMERIC(19, 4);

UPDATE items
SET purchase_conversion_ratio = 1
WHERE purchase_conversion_ratio IS NULL;

ALTER TABLE uoms
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

UPDATE uoms
SET category = CASE
                   WHEN uom_name IN ('Cái', 'Hộp', 'Gói', 'Chai', 'Lon') THEN 'COUNT'
                   WHEN uom_name IN ('Thùng', 'Lốc', 'Bao', 'Túi') THEN 'PACKAGE'
                   WHEN uom_name IN ('Kg', 'Gram', 'G', 'Tấn') THEN 'WEIGHT'
                   WHEN uom_name IN ('Lít', 'Ml', 'L') THEN 'VOLUME'
                   ELSE category
    END;

UPDATE uoms
SET is_active = TRUE
WHERE is_active IS NULL;

ALTER TABLE items
    ALTER COLUMN purchase_conversion_ratio SET NOT NULL;

ALTER TABLE uoms
    ALTER COLUMN is_active SET NOT NULL;