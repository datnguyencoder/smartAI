CREATE TABLE IF NOT EXISTS finance_transactions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(32) NOT NULL,
    category VARCHAR(120) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    payment_account VARCHAR(32) NOT NULL,
    transaction_date DATE NOT NULL,
    note VARCHAR(500),
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_type_date ON finance_transactions(type, transaction_date DESC);
