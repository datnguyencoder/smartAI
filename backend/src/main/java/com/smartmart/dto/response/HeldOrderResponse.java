package com.smartmart.dto.response;

import com.smartmart.enums.HeldOrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class HeldOrderResponse {
    private Long id;
    private String holdCode;
    private Long cashierId;
    private Long shiftId;
    private String customerName;
    private String customerPhone;
    private String promotionCode;
    private Integer loyaltyPointsRedeemed;
    private BigDecimal subtotalAmount;
    private String note;
    private HeldOrderStatus status;
    private LocalDateTime createdAt;
    private List<HeldOrderItemResponse> items;
}
