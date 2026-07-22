CREATE TABLE IF NOT EXISTS discount_plan_bundles (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES discount_plans(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    required_qty INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_discount_plan_bundles_plan ON discount_plan_bundles(plan_id);
CREATE INDEX IF NOT EXISTS idx_discount_plan_bundles_item ON discount_plan_bundles(item_id);
