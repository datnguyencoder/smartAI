-- WMS extensions: stocktake, transfer, return, shift, supplier debt, split payment

CREATE TABLE stocktakes (
    id BIGSERIAL PRIMARY KEY,
    location_id BIGINT NOT NULL REFERENCES locations(id),
    created_by BIGINT,
    stocktake_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    note TEXT,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stocktake_items (
    id BIGSERIAL PRIMARY KEY,
    stocktake_id BIGINT NOT NULL REFERENCES stocktakes(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    system_quantity DECIMAL(18, 4) NOT NULL DEFAULT 0,
    actual_quantity DECIMAL(18, 4),
    variance DECIMAL(18, 4),
    note TEXT
);

CREATE TABLE transfer_orders (
    id BIGSERIAL PRIMARY KEY,
    from_location_id BIGINT NOT NULL REFERENCES locations(id),
    to_location_id BIGINT NOT NULL REFERENCES locations(id),
    created_by BIGINT,
    transfer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    note TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfer_order_items (
    id BIGSERIAL PRIMARY KEY,
    transfer_order_id BIGINT NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    quantity DECIMAL(18, 4) NOT NULL,
    note TEXT
);

CREATE TABLE return_orders (
    id BIGSERIAL PRIMARY KEY,
    original_order_id BIGINT NOT NULL REFERENCES orders(id),
    created_by BIGINT,
    return_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    reason TEXT,
    refund_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE return_order_items (
    id BIGSERIAL PRIMARY KEY,
    return_order_id BIGINT NOT NULL REFERENCES return_orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL,
    subtotal DECIMAL(14, 2) NOT NULL
);

CREATE TABLE shifts (
    id BIGSERIAL PRIMARY KEY,
    cashier_id BIGINT NOT NULL,
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    opening_cash DECIMAL(14, 2) NOT NULL DEFAULT 0,
    closing_cash DECIMAL(14, 2),
    expected_cash DECIMAL(14, 2),
    cash_variance DECIMAL(14, 2),
    total_orders INT NOT NULL DEFAULT 0,
    total_revenue DECIMAL(14, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shift_id BIGINT REFERENCES shifts(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INT NOT NULL DEFAULT 0;

CREATE TABLE order_payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_debts (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    purchase_order_id BIGINT REFERENCES purchase_orders(id),
    amount DECIMAL(14, 2) NOT NULL,
    paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE debt_payments (
    id BIGSERIAL PRIMARY KEY,
    supplier_debt_id BIGINT NOT NULL REFERENCES supplier_debts(id) ON DELETE CASCADE,
    amount DECIMAL(14, 2) NOT NULL,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30),
    note TEXT,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_deferred BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_stocktakes_status ON stocktakes(status);
CREATE INDEX idx_transfer_orders_status ON transfer_orders(status);
CREATE INDEX idx_return_orders_original ON return_orders(original_order_id);
CREATE INDEX idx_shifts_cashier_status ON shifts(cashier_id, status);
CREATE INDEX idx_supplier_debts_supplier ON supplier_debts(supplier_id, status);
