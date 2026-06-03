-- Tables required by JPA entities not present in V1/V2 baseline

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    detail TEXT,
    ip_address VARCHAR(64),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
