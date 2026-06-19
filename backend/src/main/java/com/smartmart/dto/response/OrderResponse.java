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
    private String customerPhone;
    private BigDecimal subtotalBeforeDiscount;
    private BigDecimal discountAmount;
    private String promotionCode;
    private String cashierName;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private Integer loyaltyPointsRedeemed;
    private Integer loyaltyPointsEarned;
    private Integer customerLoyaltyPoints;
    private String customerTier;
    private List<OrderPaymentResponse> payments;
    private List<OrderItemResponse> items;
}
