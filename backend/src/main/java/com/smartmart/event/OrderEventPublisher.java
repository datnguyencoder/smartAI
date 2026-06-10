package com.smartmart.event;

import com.smartmart.constant.KafkaTopicConstant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import org.springframework.scheduling.annotation.Async;
import java.util.Map;

@Component
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Async
    public void publishOrderCreated(Long orderId, String orderCode) {
        try {
            kafkaTemplate.send(KafkaTopicConstant.SALES_ORDERS, orderCode,
                    Map.of("orderId", orderId, "orderCode", orderCode, "event", "ORDER_CREATED"));
        } catch (Exception ex) {
            log.warn("Kafka publish failed for order {}: {}", orderCode, ex.getMessage());
        }
    }
}
