ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);

UPDATE categories
SET image_url = '/media/categories/default.svg'
WHERE image_url IS NULL OR TRIM(image_url) = '';

UPDATE items
SET image_url = '/media/items/' || LOWER(REGEXP_REPLACE(item_code, '[^a-zA-Z0-9]+', '-', 'g')) || '.svg'
WHERE image_url IS NULL OR TRIM(image_url) = '';
