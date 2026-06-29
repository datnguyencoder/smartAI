ALTER TABLE uoms
    ADD COLUMN IF NOT EXISTS conversion_uom_id BIGINT;

UPDATE uoms
SET conversion_uom_id = id
WHERE conversion_uom_id IS NULL;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_uoms_conversion_uom'
    ) THEN
ALTER TABLE uoms
    ADD CONSTRAINT fk_uoms_conversion_uom
        FOREIGN KEY (conversion_uom_id) REFERENCES uoms(id);
END IF;
END $$;

UPDATE uoms
SET category = 'Bán lẻ'
WHERE category IN ('COUNT', 'WEIGHT', 'VOLUME', 'LENGTH', 'OTHER');

UPDATE uoms
SET category = 'Đóng gói'
WHERE category = 'PACKAGE';

UPDATE categories
SET uom_categories = 'Bán lẻ,Đóng gói'
WHERE uom_categories IS NULL
   OR uom_categories = ''
   OR uom_categories LIKE '%COUNT%'
   OR uom_categories LIKE '%WEIGHT%'
   OR uom_categories LIKE '%VOLUME%'
   OR uom_categories LIKE '%PACKAGE%'
   OR uom_categories LIKE '%LENGTH%'
   OR uom_categories LIKE '%OTHER%';