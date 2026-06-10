package com.smartmart.event;

import org.springframework.context.ApplicationEvent;

public class ScrapOrderCompletedEvent extends ApplicationEvent {
    private final Long scrapOrderId;

    public ScrapOrderCompletedEvent(Object source, Long scrapOrderId) {
        super(source);
        this.scrapOrderId = scrapOrderId;
    }

    public Long getScrapOrderId() {
        return scrapOrderId;
    }
}
