CREATE TABLE IF NOT EXISTS stock_transfer_orders (
    id BIGSERIAL PRIMARY KEY,
    transfer_code VARCHAR(50) NOT NULL UNIQUE,
    from_location_id BIGINT NOT NULL REFERENCES locations(id),
    to_location_id BIGINT NOT NULL REFERENCES locations(id),
    status VARCHAR(32) NOT NULL,
    created_by BIGINT,
    note VARCHAR(500),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_order_items (
    id BIGSERIAL PRIMARY KEY,
    transfer_order_id BIGINT NOT NULL REFERENCES stock_transfer_orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    quantity NUMERIC(19, 3) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_orders_status ON stock_transfer_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_orders_from ON stock_transfer_orders(from_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_orders_to ON stock_transfer_orders(to_location_id);
