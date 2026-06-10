ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(255),
    ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS before_data TEXT,
    ADD COLUMN IF NOT EXISTS after_data TEXT;

UPDATE audit_logs
SET entity_type = 'SYSTEM'
WHERE entity_type IS NULL;

ALTER TABLE audit_logs
    ALTER COLUMN entity_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON audit_logs(action);