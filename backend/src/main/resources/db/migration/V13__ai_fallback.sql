-- AI fallback metadata for reorder recommendations + per-item model types in training history
ALTER TABLE reorder_recommendations
    ADD COLUMN IF NOT EXISTS reason VARCHAR(255),
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'AI';

ALTER TABLE model_training_history
    ADD COLUMN IF NOT EXISTS per_item_model_types TEXT;
