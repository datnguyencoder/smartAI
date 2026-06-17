-- supplier_debts.status is VARCHAR; this migration documents the new OVERDUE lifecycle state.
CREATE INDEX IF NOT EXISTS idx_supplier_debts_due_status
    ON supplier_debts(due_date, status);
