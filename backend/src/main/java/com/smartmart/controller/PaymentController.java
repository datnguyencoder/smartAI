package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.PaymentRequest;
import com.smartmart.dto.response.PaymentResponse;
import com.smartmart.service.PaymentService;
import com.smartmart.service.OrderService;
import vn.payos.PayOS;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;
import java.util.Map;
import com.smartmart.service.SseNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Quản lý thanh toán qua PayOS")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;
    private final PayOS payOS;
    private final SseNotificationService sseNotificationService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Tạo link thanh toán PayOS")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(@Valid @RequestBody PaymentRequest request)
            throws Exception {
        PaymentResponse response = paymentService.createPaymentLink(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo link thanh toán thành công", response));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Webhook nhận thông báo thanh toán từ PayOS")
    public ResponseEntity<Object> payosWebhook(@RequestBody Webhook request) {
        try {
            log.info("Nhận webhook từ PayOS: code={}, success={}", request.getCode(), request.getSuccess());
            WebhookData data = payOS.webhooks().verify(request);

            if (data != null && "00".equals(data.getCode())) {
                Long payosOrderCode = data.getOrderCode();
                log.info("Webhook xác thực thành công. payosOrderCode={}, amount={}", payosOrderCode, data.getAmount());
                Long orderId = orderService.completeOrderFromWebhook(payosOrderCode);
                sseNotificationService.sendPaymentSuccess(orderId);
                log.info("Đã gửi SSE payment-success cho orderId={}", orderId);
            } else {
                log.warn("Webhook data code không phải 00: {}", data != null ? data.getCode() : "null data");
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Webhook verified and processed successfully"));
        } catch (Exception e) {
            log.error("Lỗi khi xử lý Webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Webhook received but processing failed: " + e.getMessage()));
        }
    }
}
