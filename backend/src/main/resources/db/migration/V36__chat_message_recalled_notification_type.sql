ALTER TABLE messages ADD COLUMN recalled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN sender_id BIGINT;
ALTER TABLE notifications ADD CONSTRAINT fk_notification_sender FOREIGN KEY (sender_id) REFERENCES users(id);
