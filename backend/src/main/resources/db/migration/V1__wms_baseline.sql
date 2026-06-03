-- SmartMart WMS baseline schema (ERD source of truth)

CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES categories(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE uoms (
    id BIGSERIAL PRIMARY KEY,
    uom_name VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    conversion_ratio DECIMAL(18, 6) NOT NULL DEFAULT 1,
    is_base_unit BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50),
    parent_id BIGINT REFERENCES locations(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    item_name VARCHAR(150) NOT NULL,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    item_type VARCHAR(50),
    category_id BIGINT REFERENCES categories(id),
    base_uom_id BIGINT NOT NULL REFERENCES uoms(id),
    purchase_uom_id BIGINT REFERENCES uoms(id),
    cost_price DECIMAL(14, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(14, 2) NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,
    has_expiry BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_lots (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_number VARCHAR(50) NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id, lot_number)
);

CREATE TABLE current_inventory (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    location_id BIGINT NOT NULL REFERENCES locations(id),
    lot_id BIGINT REFERENCES item_lots(id),
    quantity DECIMAL(18, 4) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(18, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id, location_id, lot_id)
);

CREATE TABLE inventory_logs (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    location_id BIGINT NOT NULL REFERENCES locations(id),
    lot_id BIGINT REFERENCES item_lots(id),
    user_id UUID REFERENCES users(id),
    reference_type VARCHAR(50),
    reference_id BIGINT,
    action_type VARCHAR(50) NOT NULL,
    quantity_before DECIMAL(18, 4) NOT NULL,
    quantity_change DECIMAL(18, 4) NOT NULL,
    quantity_after DECIMAL(18, 4) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    location_id BIGINT NOT NULL REFERENCES locations(id),
    created_by UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL,
    purchase_date TIMESTAMP,
    completed_at TIMESTAMP,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    ordered_qty DECIMAL(18, 4) NOT NULL,
    received_qty DECIMAL(18, 4) NOT NULL DEFAULT 0,
    unit_price DECIMAL(14, 2) NOT NULL,
    subtotal DECIMAL(14, 2) NOT NULL DEFAULT 0
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    created_by UUID REFERENCES users(id),
    customer_name VARCHAR(150),
    order_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(30),
    note VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL,
    subtotal DECIMAL(14, 2) NOT NULL
);

CREATE TABLE scrap_orders (
    id BIGSERIAL PRIMARY KEY,
    location_id BIGINT NOT NULL REFERENCES locations(id),
    created_by UUID REFERENCES users(id),
    scrap_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scrap_order_items (
    id BIGSERIAL PRIMARY KEY,
    scrap_id BIGINT NOT NULL REFERENCES scrap_orders(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    lot_id BIGINT REFERENCES item_lots(id),
    uom_id BIGINT REFERENCES uoms(id),
    quantity DECIMAL(18, 4) NOT NULL,
    reason VARCHAR(255)
);

-- AI extension tables (FK -> items)
CREATE TABLE model_training_history (
    id BIGSERIAL PRIMARY KEY,
    model_type VARCHAR(50) NOT NULL,
    mae DECIMAL(12, 4),
    rmse DECIMAL(12, 4),
    mape DECIMAL(12, 4),
    trained_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forecast_results (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    model_training_id BIGINT REFERENCES model_training_history(id),
    forecast_date TIMESTAMP NOT NULL,
    predicted_quantity DECIMAL(14, 4) NOT NULL,
    confidence_level DECIMAL(8, 4),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_logs_item ON inventory_logs(item_id);
CREATE INDEX idx_current_inventory_item ON current_inventory(item_id);
CREATE INDEX idx_orders_date ON orders(order_date);
