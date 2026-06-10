-- Convert identity tables (users, audit_logs, settings) and user FK columns from UUID to BIGINT.
-- Preserves users via username mapping; re-links created_by / user_id on existing rows.

ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_created_by_fkey;
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_created_by_fkey;
ALTER TABLE scrap_orders DROP CONSTRAINT IF EXISTS scrap_orders_created_by_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

CREATE TABLE users_new (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new (username, password_hash, email, full_name, role, status, created_at, updated_at)
SELECT username, password_hash, email, full_name, role, status, created_at, updated_at
FROM users
ORDER BY created_at;

CREATE TEMP TABLE user_id_map (
    old_id UUID NOT NULL,
    new_id BIGINT NOT NULL
);

INSERT INTO user_id_map (old_id, new_id)
SELECT u.id, n.id
FROM users u
JOIN users_new n ON u.username = n.username;

-- inventory_logs.user_id
ALTER TABLE inventory_logs ADD COLUMN user_id_new BIGINT;
UPDATE inventory_logs il
SET user_id_new = m.new_id
FROM user_id_map m
WHERE il.user_id = m.old_id;
ALTER TABLE inventory_logs DROP COLUMN user_id;
ALTER TABLE inventory_logs RENAME COLUMN user_id_new TO user_id;
ALTER TABLE inventory_logs
    ADD CONSTRAINT inventory_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users_new(id);

-- orders.created_by
ALTER TABLE orders ADD COLUMN created_by_new BIGINT;
UPDATE orders o
SET created_by_new = m.new_id
FROM user_id_map m
WHERE o.created_by = m.old_id;
ALTER TABLE orders DROP COLUMN created_by;
ALTER TABLE orders RENAME COLUMN created_by_new TO created_by;
ALTER TABLE orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES users_new(id);

-- purchase_orders.created_by
ALTER TABLE purchase_orders ADD COLUMN created_by_new BIGINT;
UPDATE purchase_orders po
SET created_by_new = m.new_id
FROM user_id_map m
WHERE po.created_by = m.old_id;
ALTER TABLE purchase_orders DROP COLUMN created_by;
ALTER TABLE purchase_orders RENAME COLUMN created_by_new TO created_by;
ALTER TABLE purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES users_new(id);

-- scrap_orders.created_by
ALTER TABLE scrap_orders ADD COLUMN created_by_new BIGINT;
UPDATE scrap_orders so
SET created_by_new = m.new_id
FROM user_id_map m
WHERE so.created_by = m.old_id;
ALTER TABLE scrap_orders DROP COLUMN created_by;
ALTER TABLE scrap_orders RENAME COLUMN created_by_new TO created_by;
ALTER TABLE scrap_orders
    ADD CONSTRAINT scrap_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES users_new(id);

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- audit_logs: recreate with BIGINT PK (audit history reset; user FK remapped)
DROP TABLE IF EXISTS audit_logs;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    detail TEXT,
    ip_address VARCHAR(64),
    user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- settings: recreate with BIGINT PK
DROP TABLE IF EXISTS settings;

CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
