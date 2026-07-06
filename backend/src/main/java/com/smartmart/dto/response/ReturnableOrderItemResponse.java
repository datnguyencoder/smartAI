package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
@Getter
@Builder
public class ReturnableOrderItemResponse {
    private Long itemId;
    private String itemName;
    private Long lotId;
    private String lotNumber;
    private BigDecimal soldQuantity;
    private BigDecimal returnedQuantity;
    private BigDecimal remainingQuantity;
    private BigDecimal unitPrice;
    private BigDecimal estimatedRefund;
}
