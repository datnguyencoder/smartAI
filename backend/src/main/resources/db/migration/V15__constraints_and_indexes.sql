-- order_items: store sale location for correct cancel/return restoration
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS location_id BIGINT REFERENCES locations(id);

-- Sanitize orphan user references before adding FK constraints
UPDATE stocktakes SET created_by = NULL
WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = stocktakes.created_by);

UPDATE transfer_orders SET created_by = NULL
WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = transfer_orders.created_by);

UPDATE return_orders SET created_by = NULL
WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = return_orders.created_by);

UPDATE debt_payments SET created_by = NULL
WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = debt_payments.created_by);

-- shifts.cashier_id is NOT NULL — remove shifts with invalid cashier (should not exist in prod)
DELETE FROM shifts
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = shifts.cashier_id);

-- FK constraints on V14 user reference columns
ALTER TABLE shifts
    ADD CONSTRAINT fk_shifts_cashier FOREIGN KEY (cashier_id) REFERENCES users(id);

ALTER TABLE stocktakes
    ADD CONSTRAINT fk_stocktakes_created_by FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE transfer_orders
    ADD CONSTRAINT fk_transfer_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE return_orders
    ADD CONSTRAINT fk_return_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE debt_payments
    ADD CONSTRAINT fk_debt_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON orders(shift_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_supplier_debts_purchase_order
    ON supplier_debts(purchase_order_id)
    WHERE purchase_order_id IS NOT NULL;
