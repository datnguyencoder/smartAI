package com.smartmart.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface SseNotificationService {
    SseEmitter createEmitter(Long userId);
    void sendPaymentSuccess(Long orderId);
}
