-- Confidence interval bounds from AI forecast response
ALTER TABLE forecast_results
    ADD COLUMN IF NOT EXISTS confidence_low NUMERIC(12,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS confidence_high NUMERIC(12,4) DEFAULT 0;
