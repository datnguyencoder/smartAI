package com.smartmart.dto.response;

import com.smartmart.enums.OrderStatus;
import com.smartmart.enums.PaymentMethod;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OrderResponse {
    private Long id;
    private String orderCode;
    private String customerName;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private List<OrderItemResponse> items;
}
