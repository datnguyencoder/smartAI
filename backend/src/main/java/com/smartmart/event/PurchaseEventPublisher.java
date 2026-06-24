package com.smartmart.event;

import com.smartmart.constant.KafkaTopicConstant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
public class PurchaseEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(PurchaseEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PurchaseEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPurchaseOrderStatusEvent(PurchaseOrderStatusEvent event) {
        Long purchaseId = event.getPurchaseId();
        String eventType = event.getEventType();
        try {
            kafkaTemplate.send(KafkaTopicConstant.PURCHASE_ORDERS, String.valueOf(purchaseId),
                    Map.of("purchaseId", purchaseId, "event", eventType));
            log.info("Successfully published Kafka event {} for purchase order {}", eventType, purchaseId);
        } catch (Exception ex) {
            log.warn("Kafka publish failed for purchase {} event {}: {}", purchaseId, eventType, ex.getMessage());
        }
    }
}
