-- Demo data bổ sung cho hôm nay (2026-07-20) — CHỈ THÊM, KHÔNG XOÁ/GHI ĐÈ DATA CŨ
-- Dùng subquery theo tên category/uom/supplier/location đã có sẵn trong hệ thống
-- (từ DemoCatalogSeeder) nên an toàn dù ID thực tế trên production là gì.

BEGIN;

WITH new_items(item_code, item_name, category_name, uom_name, supplier_name,
               cost_price, selling_price, minimum_stock, has_expiry, image_url) AS (
    VALUES
    ('DEMO-COLA-330', 'Coca-Cola lon 330ml', 'Đồ uống', 'Cái', 'Coca-Cola Việt Nam',
        6500, 10000, 48, true, NULL),
    ('DEMO-PEPSI-330', 'Pepsi lon 330ml', 'Đồ uống', 'Cái', 'PepsiCo Việt Nam',
        6200, 9500, 48, true, NULL),
    ('DEMO-SUA-TIGER-180', 'Sữa tươi Vinamilk 180ml', 'Sữa & trứng lạnh', 'Cái', 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
        5800, 8500, 60, true, NULL),
    ('DEMO-MYHAO-TOM', 'Mì Hảo Hảo tôm chua cay (thùng 30 gói)', 'Mì & thực phẩm khô', 'Thùng 24 cái', 'Acecook Việt Nam',
        95000, 132000, 10, true, NULL),
    ('DEMO-SNACK-OSTAR', 'Snack Oishi vị bò 40g', 'Snack & bánh kẹo', 'Gói', 'Orion Food Vina',
        4000, 6500, 40, true, NULL),
    ('DEMO-KEMDANH-COL', 'Kem đánh răng Colgate 100g', 'Chăm sóc cá nhân', 'Cái', 'Colgate-Palmolive Việt Nam',
        18000, 27000, 30, false, NULL),
    ('DEMO-NUOCLAU-SUN', 'Nước rửa chén Sunlight 750ml', 'Vệ sinh nhà cửa', 'Cái', 'Unilever Việt Nam',
        22000, 32000, 25, false, NULL),
    ('DEMO-CAFE-TN', 'Cà phê hòa tan G7 hộp 15 gói', 'Mì & thực phẩm khô', 'Hộp', 'Trung Nguyên Legend',
        38000, 55000, 20, true, NULL)
),
inserted_items AS (
    INSERT INTO items (item_name, item_code, item_type, category_id, base_uom_id,
                        purchase_uom_id, cost_price, selling_price, minimum_stock,
                        has_expiry, is_active, image_url, purchase_conversion_ratio,
                        created_at, updated_at)
    SELECT
        ni.item_name, ni.item_code, 'RETAIL',
        c.id, u.id, u.id,
        ni.cost_price, ni.selling_price, ni.minimum_stock,
        ni.has_expiry, true, ni.image_url, 1,
        NOW(), NOW()
    FROM new_items ni
    JOIN categories c ON c.category_name = ni.category_name
    JOIN uoms u ON u.uom_name = ni.uom_name
    WHERE NOT EXISTS (SELECT 1 FROM items ex WHERE ex.item_code = ni.item_code)
    RETURNING id, item_code, has_expiry
),
inserted_lots AS (
    INSERT INTO item_lots (item_id, lot_number, expiry_date, created_at, updated_at)
    SELECT ii.id, 'LOT-' || ii.item_code || '-20260720',
           CASE WHEN ii.has_expiry THEN CURRENT_DATE + INTERVAL '90 days' ELSE NULL END,
           NOW(), NOW()
    FROM inserted_items ii
    RETURNING id, item_id
)
INSERT INTO current_inventory (item_id, location_id, lot_id, quantity, reserved_quantity, created_at, updated_at)
SELECT il.item_id, loc.id, il.id, 200, 0, NOW(), NOW()
FROM inserted_lots il
JOIN locations loc ON loc.location_name = 'Kho bán';

COMMIT;

-- Kiểm tra nhanh sau khi chạy:
-- SELECT item_code, item_name, selling_price FROM items WHERE item_code LIKE 'DEMO-%';
