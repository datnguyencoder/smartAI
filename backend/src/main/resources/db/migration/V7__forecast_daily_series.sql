ALTER TABLE forecast_results ADD COLUMN IF NOT EXISTS model_type VARCHAR(30);

CREATE TABLE forecast_daily_points (
    id BIGSERIAL PRIMARY KEY,
    forecast_result_id BIGINT NOT NULL REFERENCES forecast_results(id) ON DELETE CASCADE,
    point_date DATE NOT NULL,
    predicted_qty NUMERIC(14, 4) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forecast_daily_points_result ON forecast_daily_points(forecast_result_id);
