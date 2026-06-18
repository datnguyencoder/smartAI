ALTER TABLE promotion_recommendations
    ADD COLUMN IF NOT EXISTS promotion_id BIGINT,
    ADD COLUMN IF NOT EXISTS promotion_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_promo_recommendations_promotion_code
    ON promotion_recommendations(promotion_code);
