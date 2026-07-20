package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ShiftReturnedItemResponse {
    private Long shiftId;
    private Long returnOrderId;
    private Long returnItemId;
    private String originalOrderCode;
    private LocalDateTime returnedAt;
    private Long itemId;
    private String itemName;
    private BigDecimal quantity;
    private BigDecimal refundAmount;
    private String paymentMethods;
}
