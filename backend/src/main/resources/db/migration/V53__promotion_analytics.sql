ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_plan_id BIGINT REFERENCES discount_plans(id);
CREATE INDEX IF NOT EXISTS idx_order_items_discount_plan ON order_items(discount_plan_id);

ALTER TABLE promotion_usages ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(19, 2) NOT NULL DEFAULT 0;
