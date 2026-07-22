ALTER TABLE promotions ADD COLUMN IF NOT EXISTS max_usage INT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS usage_count INT NOT NULL DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS max_per_customer INT;

CREATE TABLE IF NOT EXISTS promotion_usages (
    id BIGSERIAL PRIMARY KEY,
    promotion_id BIGINT NOT NULL REFERENCES promotions(id),
    customer_id BIGINT REFERENCES customers(id),
    order_id BIGINT NOT NULL REFERENCES orders(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion ON promotion_usages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_customer ON promotion_usages(promotion_id, customer_id);
