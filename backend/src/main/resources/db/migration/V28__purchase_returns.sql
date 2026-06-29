CREATE TABLE IF NOT EXISTS purchase_return_orders (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    location_id BIGINT NOT NULL REFERENCES locations(id),
    purchase_order_id BIGINT REFERENCES purchase_orders(id),
    status VARCHAR(32) NOT NULL,
    return_date TIMESTAMP,
    total_amount NUMERIC(19, 2) NOT NULL,
    created_by BIGINT,
    note VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_return_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_return_id BIGINT NOT NULL REFERENCES purchase_return_orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    quantity NUMERIC(19, 3) NOT NULL,
    unit_price NUMERIC(19, 2) NOT NULL,
    subtotal NUMERIC(19, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_return_orders_supplier ON purchase_return_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_return_orders_status ON purchase_return_orders(status);
