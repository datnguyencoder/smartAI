package com.smartmart.event;

import org.springframework.context.ApplicationEvent;

public class OrderCreatedEvent extends ApplicationEvent {
    private final Long orderId;
    private final String orderCode;

    public OrderCreatedEvent(Object source, Long orderId, String orderCode) {
        super(source);
        this.orderId = orderId;
        this.orderCode = orderCode;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderCode() {
        return orderCode;
    }
}
