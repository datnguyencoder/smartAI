-- Trước đây xoá 1 chiến dịch/mã KM đã từng được dùng bán hàng sẽ bị chặn bởi FK constraint
-- (order_items.discount_plan_id, promotion_usages.promotion_id, orders.promotion_id) — quản lý
-- không thể dọn dẹp các chiến dịch cũ đã hết hạn dù không còn cần dùng nữa. Đổi sang
-- ON DELETE SET NULL: xoá được chiến dịch/mã KM, đơn hàng cũ vẫn giữ nguyên discount_amount/
-- discount_reason đã áp dụng — chỉ mất liên kết ngược về chiến dịch (dùng cho thống kê realtime,
-- không phải nguồn sự thật duy nhất của số tiền đã giảm).

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_discount_plan_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_discount_plan_id_fkey
    FOREIGN KEY (discount_plan_id) REFERENCES discount_plans(id) ON DELETE SET NULL;

ALTER TABLE promotion_usages ALTER COLUMN promotion_id DROP NOT NULL;
ALTER TABLE promotion_usages DROP CONSTRAINT IF EXISTS promotion_usages_promotion_id_fkey;
ALTER TABLE promotion_usages ADD CONSTRAINT promotion_usages_promotion_id_fkey
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_promotion_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_promotion_id_fkey
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;
