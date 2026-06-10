-- Customer master + Promotion CRUD + Order discount linkage
CREATE TABLE IF NOT EXISTS customers (
    id             BIGSERIAL PRIMARY KEY,
    full_name      VARCHAR(150) NOT NULL,
    phone          VARCHAR(15)  NOT NULL UNIQUE,
    email          VARCHAR(150),
    loyalty_points INT          NOT NULL DEFAULT 0,
    tier           VARCHAR(20)  NOT NULL DEFAULT 'REGULAR',
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    code       VARCHAR(50)  UNIQUE,
    type       VARCHAR(20)  NOT NULL,
    value      NUMERIC(10, 2) NOT NULL,
    min_order  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    start_date DATE,
    end_date   DATE,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id),
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(15),
    ADD COLUMN IF NOT EXISTS promotion_id BIGINT REFERENCES promotions(id),
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

INSERT INTO promotions (name, code, type, value, min_order, start_date, end_date, is_active)
VALUES
    ('Giảm 10% cuối tuần', 'WEEKEND10', 'PERCENTAGE', 10, 100000, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days', TRUE),
    ('Giảm 50k đơn từ 500k', 'SAVE50K', 'FIXED_AMOUNT', 50000, 500000, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days', TRUE)
ON CONFLICT (code) DO NOTHING;
