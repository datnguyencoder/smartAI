package com.smartmart.controller;

import com.smartmart.security.SecurityUtils;
import com.smartmart.service.SseNotificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Thông báo real-time (SSE)")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class NotificationStreamController {

    private final SseNotificationService sseNotificationService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter stream() {
        Long userId = SecurityUtils.getCurrentUserId().orElse(0L);
        return sseNotificationService.createEmitter(userId);
    }
}
