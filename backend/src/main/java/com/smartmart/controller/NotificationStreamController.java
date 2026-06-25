package com.smartmart.controller;

import com.smartmart.repository.InventoryAlertRepository;
import com.smartmart.security.SecurityUtils;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Thông báo real-time (SSE)")
@SecurityRequirement(name = "bearerAuth")
public class NotificationStreamController {

    private final InventoryAlertRepository inventoryAlertRepository;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public NotificationStreamController(InventoryAlertRepository inventoryAlertRepository) {
        this.inventoryAlertRepository = inventoryAlertRepository;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter stream() {
        SseEmitter emitter = new SseEmitter(0L);
        Long userId = SecurityUtils.getCurrentUserId().orElse(0L);

        var task = scheduler.scheduleAtFixedRate(() -> {
            try {
                long unresolved = inventoryAlertRepository.countByResolvedFalse();
                emitter.send(SseEmitter.event()
                        .name("inventory-alerts")
                        .data(Map.of("unresolvedCount", unresolved, "userId", userId)));
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
        }, 0, 30, TimeUnit.SECONDS);

        emitter.onCompletion(() -> task.cancel(true));
        emitter.onTimeout(() -> {
            task.cancel(true);
            emitter.complete();
        });
        emitter.onError(e -> task.cancel(true));

        return emitter;
    }
}
