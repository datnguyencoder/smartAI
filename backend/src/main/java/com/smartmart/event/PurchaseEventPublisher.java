package com.smartmart.event;

import com.smartmart.constant.KafkaTopicConstant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import org.springframework.scheduling.annotation.Async;
import java.util.Map;

@Component
public class PurchaseEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(PurchaseEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PurchaseEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Async
    public void publishPurchaseCreated(Long purchaseId) {
        try {
            kafkaTemplate.send(KafkaTopicConstant.PURCHASE_ORDERS, String.valueOf(purchaseId),
                    Map.of("purchaseId", purchaseId, "event", "PURCHASE_CREATED"));
        } catch (Exception ex) {
            log.warn("Kafka publish failed for purchase created {}: {}", purchaseId, ex.getMessage());
        }
    }

    @Async
    public void publishPurchaseReceived(Long purchaseId) {
        try {
            kafkaTemplate.send(KafkaTopicConstant.PURCHASE_ORDERS, String.valueOf(purchaseId),
                    Map.of("purchaseId", purchaseId, "event", "PURCHASE_RECEIVED"));
        } catch (Exception ex) {
            log.warn("Kafka publish failed for purchase {}: {}", purchaseId, ex.getMessage());
        }
    }

    @Async
    public void publishPurchaseCancelled(Long purchaseId) {
        try {
            kafkaTemplate.send(KafkaTopicConstant.PURCHASE_ORDERS, String.valueOf(purchaseId),
                    Map.of("purchaseId", purchaseId, "event", "PURCHASE_CANCELLED"));
        } catch (Exception ex) {
            log.warn("Kafka publish failed for purchase cancelled {}: {}", purchaseId, ex.getMessage());
        }
    }
}
