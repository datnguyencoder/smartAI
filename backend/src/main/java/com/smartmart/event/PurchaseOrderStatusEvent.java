package com.smartmart.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class PurchaseOrderStatusEvent extends ApplicationEvent {
    private final Long purchaseId;
    private final String eventType;

    public PurchaseOrderStatusEvent(Object source, Long purchaseId, String eventType) {
        super(source);
        this.purchaseId = purchaseId;
        this.eventType = eventType;
    }
}
