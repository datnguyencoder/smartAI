CREATE TABLE IF NOT EXISTS supplier_items (
                                              id BIGSERIAL PRIMARY KEY,
                                              supplier_id BIGINT NOT NULL,
                                              sku_item VARCHAR(255) NOT NULL,
    default_cost_price NUMERIC(19, 4),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_supplier_items_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),

    CONSTRAINT fk_supplier_items_item_code
    FOREIGN KEY (sku_item) REFERENCES items(item_code),

    CONSTRAINT uk_supplier_items_supplier_sku
    UNIQUE (supplier_id, sku_item)
    );

CREATE INDEX IF NOT EXISTS idx_supplier_items_supplier
    ON supplier_items(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_items_sku
    ON supplier_items(sku_item);