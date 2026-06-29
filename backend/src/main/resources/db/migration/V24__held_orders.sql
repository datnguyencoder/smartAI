CREATE TABLE IF NOT EXISTS held_orders (
    id BIGSERIAL PRIMARY KEY,
    hold_code VARCHAR(64) NOT NULL UNIQUE,
    cashier_id BIGINT,
    shift_id BIGINT REFERENCES shifts(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(32),
    promotion_code VARCHAR(100),
    loyalty_points_redeemed INTEGER,
    subtotal_amount NUMERIC(19, 2) NOT NULL DEFAULT 0,
    note VARCHAR(500),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS held_order_items (
    id BIGSERIAL PRIMARY KEY,
    held_order_id BIGINT NOT NULL REFERENCES held_orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    quantity NUMERIC(19, 2) NOT NULL,
    unit_price NUMERIC(19, 2) NOT NULL,
    subtotal NUMERIC(19, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_held_orders_status_created_at ON held_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_held_orders_cashier_status ON held_orders(cashier_id, status);
CREATE INDEX IF NOT EXISTS idx_held_order_items_order ON held_order_items(held_order_id);
