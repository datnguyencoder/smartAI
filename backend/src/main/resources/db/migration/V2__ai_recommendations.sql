-- AI recommendations extension (V2)

ALTER TABLE forecast_results ADD COLUMN IF NOT EXISTS horizon_days INT;
ALTER TABLE forecast_results ADD COLUMN IF NOT EXISTS predicted_qty_7d DECIMAL(14, 4);
ALTER TABLE forecast_results ADD COLUMN IF NOT EXISTS predicted_qty_14d DECIMAL(14, 4);
ALTER TABLE forecast_results ADD COLUMN IF NOT EXISTS predicted_qty_30d DECIMAL(14, 4);

CREATE TABLE IF NOT EXISTS reorder_recommendations (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    suggested_qty DECIMAL(14, 4) NOT NULL DEFAULT 0,
    current_available DECIMAL(14, 4) NOT NULL DEFAULT 0,
    predicted_demand_7d DECIMAL(14, 4),
    risk_level VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_recommendations (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reorder_item ON reorder_recommendations(item_id);
CREATE INDEX IF NOT EXISTS idx_promotion_item ON promotion_recommendations(item_id);
