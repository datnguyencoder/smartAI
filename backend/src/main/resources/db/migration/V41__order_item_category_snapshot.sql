-- Snapshot category on sales lines so historical reports/AI are not rewritten
-- when an item's current category changes later.
--
-- Backfill below is best-effort only: it uses the item's current category at
-- migration time because older category history was not stored before this.
-- New orders after this migration will store the category at sale time.

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS category_id_at_sale BIGINT,
    ADD COLUMN IF NOT EXISTS category_name_at_sale VARCHAR(100);

UPDATE order_items oi
SET category_id_at_sale = i.category_id,
    category_name_at_sale = c.category_name
FROM items i
LEFT JOIN categories c ON c.id = i.category_id
WHERE oi.item_id = i.id
  AND oi.category_id_at_sale IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_category_at_sale
    ON order_items(category_id_at_sale);
