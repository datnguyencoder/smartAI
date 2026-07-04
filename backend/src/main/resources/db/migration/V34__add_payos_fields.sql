ALTER TABLE orders ADD COLUMN payos_order_code BIGINT UNIQUE;

ALTER TABLE order_payments ADD COLUMN payment_link_id VARCHAR(255);
ALTER TABLE order_payments ADD COLUMN checkout_url TEXT;
ALTER TABLE order_payments ADD COLUMN transaction_id VARCHAR(255);
ALTER TABLE order_payments ADD COLUMN paid_at TIMESTAMP;
