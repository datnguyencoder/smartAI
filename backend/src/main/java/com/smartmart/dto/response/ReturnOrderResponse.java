package com.smartmart.dto.response;

import com.smartmart.enums.ReturnOrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ReturnOrderResponse {
    private Long id;
    private Long originalOrderId;
    private String originalOrderCode;
    private Long createdBy;
    private LocalDateTime returnDate;
    private ReturnOrderStatus status;
    private String reason;
    private BigDecimal refundAmount;
    private String note;
    private List<ReturnOrderItemResponse> items;
}
