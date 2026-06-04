package com.smartmart.event;

import com.smartmart.constant.KafkaTopicConstant;
import com.smartmart.repository.OrderRepository;
import com.smartmart.service.InventoryAlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "spring.kafka.listener.enabled", havingValue = "true", matchIfMissing = true)
public class OrderInventoryAlertListener {

    private static final Logger log = LoggerFactory.getLogger(OrderInventoryAlertListener.class);

    private final OrderRepository orderRepository;
    private final InventoryAlertService inventoryAlertService;

    public OrderInventoryAlertListener(OrderRepository orderRepository, InventoryAlertService inventoryAlertService) {
        this.orderRepository = orderRepository;
        this.inventoryAlertService = inventoryAlertService;
    }

    @KafkaListener(topics = KafkaTopicConstant.SALES_ORDERS, groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderEvent(Map<String, Object> payload) {
        if (payload == null || !"ORDER_CREATED".equals(payload.get("event"))) {
            return;
        }
        Object orderIdObj = payload.get("orderId");
        if (orderIdObj == null) {
            return;
        }
        long orderId = orderIdObj instanceof Number n ? n.longValue() : Long.parseLong(orderIdObj.toString());
        try {
            orderRepository.findByIdWithItems(orderId).ifPresent(order ->
                    order.getItems().forEach(oi ->
                            inventoryAlertService.evaluateStockAfterSale(oi.getItem().getId())));
        } catch (Exception ex) {
            log.warn("Inventory alert evaluation failed for order {}: {}", orderId, ex.getMessage());
        }
    }
}
