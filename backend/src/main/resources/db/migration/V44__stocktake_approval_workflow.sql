ALTER TABLE stocktakes
    ADD COLUMN IF NOT EXISTS submitted_by BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_stocktakes_submitted_by ON stocktakes(submitted_by);
CREATE INDEX IF NOT EXISTS idx_stocktakes_approved_by ON stocktakes(approved_by);
