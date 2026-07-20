package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
public class RefundReportResponse {
    private BigDecimal totalRefundAmount;
    private BigDecimal damagedRefundAmount;
    private BigDecimal expiredRefundAmount;
    private BigDecimal otherRefundAmount;

    private long totalRefundOrders;
    private long damagedRefundOrders;
    private long expiredRefundOrders;
    private long otherRefundOrders;

    private List<ReturnOrderResponse> refundOrders;
}
