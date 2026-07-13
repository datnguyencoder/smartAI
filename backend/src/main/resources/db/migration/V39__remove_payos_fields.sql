ALTER TABLE orders DROP COLUMN IF EXISTS payos_order_code;

ALTER TABLE order_payments DROP COLUMN IF EXISTS payment_link_id;
ALTER TABLE order_payments DROP COLUMN IF EXISTS checkout_url;
ALTER TABLE order_payments DROP COLUMN IF EXISTS transaction_id;
ALTER TABLE order_payments DROP COLUMN IF EXISTS paid_at;
