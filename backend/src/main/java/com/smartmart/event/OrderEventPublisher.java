package com.smartmart.event;

import com.smartmart.constant.KafkaTopicConstant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // SALE-04: chỉ publish sau khi transaction tạo đơn hàng commit thành công,
    // tránh gửi sự kiện cho đơn hàng đã bị rollback.
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        try {
            kafkaTemplate.send(KafkaTopicConstant.SALES_ORDERS, event.getOrderCode(),
                    Map.of("orderId", event.getOrderId(), "orderCode", event.getOrderCode(), "event", "ORDER_CREATED"));
        } catch (Exception ex) {
            log.warn("Kafka publish failed for order {}: {}", event.getOrderCode(), ex.getMessage());
        }
    }
}
