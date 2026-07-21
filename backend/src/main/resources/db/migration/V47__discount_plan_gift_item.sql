ALTER TABLE discount_plans ADD COLUMN IF NOT EXISTS gift_item_id BIGINT REFERENCES items(id);
CREATE INDEX IF NOT EXISTS idx_discount_plans_gift_item ON discount_plans(gift_item_id);
