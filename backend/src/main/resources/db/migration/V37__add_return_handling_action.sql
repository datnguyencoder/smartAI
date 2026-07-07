ALTER TABLE return_order_items
    ADD COLUMN IF NOT EXISTS handling_action VARCHAR(30);

UPDATE return_order_items
SET handling_action = 'RESTOCK'
WHERE handling_action IS NULL;

ALTER TABLE return_order_items
    ALTER COLUMN handling_action SET NOT NULL;