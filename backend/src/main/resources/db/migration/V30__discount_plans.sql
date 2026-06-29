CREATE TABLE IF NOT EXISTS discount_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(120) NOT NULL,
    plan_type VARCHAR(32) NOT NULL,
    category_id BIGINT REFERENCES categories(id),
    item_id BIGINT REFERENCES items(id),
    discount_percent NUMERIC(5, 2) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discount_plans_type ON discount_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_discount_plans_category ON discount_plans(category_id);
CREATE INDEX IF NOT EXISTS idx_discount_plans_item ON discount_plans(item_id);
