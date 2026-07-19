-- Seed default system settings for store info, receipt, and VAT
INSERT INTO settings (setting_key, setting_value, description)
VALUES
    ('store_name',          'SMARTMART AI',                         'Tên cửa hàng hiển thị trên hóa đơn'),
    ('store_address',       'TP. Hồ Chí Minh',                     'Địa chỉ cửa hàng hiển thị trên hóa đơn'),
    ('store_phone',         '',                                     'Số hotline hiển thị trên hóa đơn'),
    ('receipt_footer',      'Cảm ơn quý khách và hẹn gặp lại',    'Chân hóa đơn'),
    ('receipt_paper_width', '80mm',                                 'Khổ giấy in hóa đơn'),
    ('vat_rate',            '0',                                    'Thuế VAT (%) áp dụng cho đơn hàng'),
    ('LOYALTY_REDEEM_RATE', '1',                                    'Tỷ lệ quy đổi điểm sang VND (1 điểm = ? VND)')
ON CONFLICT (setting_key) DO NOTHING;
