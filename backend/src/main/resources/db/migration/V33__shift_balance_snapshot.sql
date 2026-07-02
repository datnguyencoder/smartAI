ALTER TABLE shifts ADD COLUMN IF NOT EXISTS opening_balance_source_shift_id BIGINT REFERENCES shifts(id);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS closing_note TEXT;

CREATE INDEX IF NOT EXISTS idx_shifts_closing_balance ON shifts(closed_at DESC) WHERE closing_cash IS NOT NULL;
