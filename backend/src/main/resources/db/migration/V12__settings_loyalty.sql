-- Default system settings for loyalty and stock alerts
INSERT INTO settings (setting_key, setting_value, description)
VALUES
    ('LOYALTY_POINT_RATE', '1000', 'Số VND trên 1 điểm tích lũy (1 điểm / 1000đ)'),
    ('LOYALTY_SILVER_THRESHOLD', '500', 'Điểm tối thiểu để lên hạng SILVER'),
    ('LOYALTY_GOLD_THRESHOLD', '2000', 'Điểm tối thiểu để lên hạng GOLD'),
    ('MIN_STOCK_ALERT_THRESHOLD', '10', 'Ngưỡng cảnh báo tồn kho thấp mặc định')
ON CONFLICT (setting_key) DO NOTHING;
