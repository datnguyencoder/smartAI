ALTER TABLE reorder_recommendations
    ADD COLUMN IF NOT EXISTS predicted_demand_14d DECIMAL(14, 4);
