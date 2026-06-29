CREATE TABLE IF NOT EXISTS customer_debts (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    amount NUMERIC(19, 2) NOT NULL,
    paid_amount NUMERIC(19, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
    note VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_debt_payments (
    id BIGSERIAL PRIMARY KEY,
    customer_debt_id BIGINT NOT NULL REFERENCES customer_debts(id) ON DELETE CASCADE,
    amount NUMERIC(19, 2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(64),
    note VARCHAR(255),
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_debts_status ON customer_debts(status);
CREATE INDEX IF NOT EXISTS idx_customer_debts_customer ON customer_debts(customer_id);
