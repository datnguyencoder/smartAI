CREATE TABLE IF NOT EXISTS brands (
    id BIGSERIAL PRIMARY KEY,
    brand_name VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

ALTER TABLE items ADD COLUMN IF NOT EXISTS brand_id BIGINT REFERENCES brands(id);

CREATE TABLE IF NOT EXISTS quotations (
    id BIGSERIAL PRIMARY KEY,
    quote_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(32),
    status VARCHAR(32) NOT NULL,
    subtotal_amount NUMERIC(19, 2) NOT NULL,
    valid_until DATE,
    note VARCHAR(500),
    created_by BIGINT,
    converted_order_id BIGINT REFERENCES orders(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    quantity NUMERIC(19, 3) NOT NULL,
    unit_price NUMERIC(19, 2) NOT NULL,
    subtotal NUMERIC(19, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS gift_cards (
    id BIGSERIAL PRIMARY KEY,
    card_code VARCHAR(50) NOT NULL UNIQUE,
    initial_balance NUMERIC(19, 2) NOT NULL,
    current_balance NUMERIC(19, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    issued_at TIMESTAMP,
    expires_at DATE,
    issued_by BIGINT,
    note VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS online_order_requests (
    id BIGSERIAL PRIMARY KEY,
    request_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(32),
    delivery_address VARCHAR(500),
    status VARCHAR(32) NOT NULL,
    total_amount NUMERIC(19, 2) NOT NULL DEFAULT 0,
    note VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_brand ON items(brand_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_online_order_requests_status ON online_order_requests(status);
