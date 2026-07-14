-- Xóa các tính năng không phù hợp với mô hình mini supermarket:
-- Chat nội bộ, Đơn hàng online, Báo giá, Thẻ quà tặng.

-- Chat
DROP TABLE IF EXISTS message_reads CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Đơn hàng online
DROP TABLE IF EXISTS online_order_requests CASCADE;

-- Báo giá
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;

-- Thẻ quà tặng
DROP TABLE IF EXISTS gift_cards CASCADE;
