INSERT INTO finance_categories (name, type, is_active, created_at, updated_at)
SELECT v.name, v.type, TRUE, NOW(), NOW()
FROM (VALUES
    ('Bán hàng', 'INCOME'),
    ('Thu nợ khách hàng', 'INCOME'),
    ('Thu khác', 'INCOME'),
    ('Nhập hàng', 'EXPENSE'),
    ('Lương nhân viên', 'EXPENSE'),
    ('Thuê mặt bằng', 'EXPENSE'),
    ('Điện nước', 'EXPENSE'),
    ('Vận chuyển', 'EXPENSE'),
    ('Marketing', 'EXPENSE'),
    ('Chi khác', 'EXPENSE')
) AS v(name, type)
WHERE NOT EXISTS (
    SELECT 1 FROM finance_categories fc WHERE fc.name = v.name AND fc.type = v.type
);
