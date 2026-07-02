ALTER TABLE shifts ADD COLUMN IF NOT EXISTS staff_mismatch_reported BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS manager_note TEXT;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS admin_note TEXT;

CREATE INDEX IF NOT EXISTS idx_shifts_status_closed_at ON shifts(status, closed_at);
