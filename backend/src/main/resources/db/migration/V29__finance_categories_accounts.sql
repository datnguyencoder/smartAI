CREATE TABLE IF NOT EXISTS finance_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(32) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_name VARCHAR(120) NOT NULL,
    account_type VARCHAR(32) NOT NULL,
    balance NUMERIC(19, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_transfers (
    id BIGSERIAL PRIMARY KEY,
    from_account_id BIGINT NOT NULL REFERENCES cash_accounts(id),
    to_account_id BIGINT NOT NULL REFERENCES cash_accounts(id),
    amount NUMERIC(19, 2) NOT NULL,
    transfer_date DATE NOT NULL,
    note VARCHAR(500),
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES finance_categories(id);
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS cash_account_id BIGINT REFERENCES cash_accounts(id);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_cash_account ON finance_transactions(cash_account_id);
