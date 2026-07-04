package com.smartmart.service.impl;

import com.smartmart.repository.InventoryAlertRepository;
import com.smartmart.service.SseNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseNotificationServiceImpl implements SseNotificationService {

    private final InventoryAlertRepository inventoryAlertRepository;

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseNotificationServiceImpl(InventoryAlertRepository inventoryAlertRepository) {
        this.inventoryAlertRepository = inventoryAlertRepository;
    }

    @Override
    public SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            emitter.complete();
        });
        emitter.onError(e -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("init").data("Connected"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    @Override
    public void sendPaymentSuccess(Long orderId) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("payment-success")
                        .data(Map.of("orderId", orderId, "status", "COMPLETED")));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    @Scheduled(fixedRate = 30000)
    public void sendInventoryAlerts() {
        if (emitters.isEmpty()) {
            return;
        }
        long unresolved = inventoryAlertRepository.countByResolvedFalse();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("inventory-alerts")
                        .data(Map.of("unresolvedCount", unresolved)));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}
