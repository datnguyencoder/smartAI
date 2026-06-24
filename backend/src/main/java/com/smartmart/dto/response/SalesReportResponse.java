package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class SalesReportResponse {
    private String period;
    private long totalOrders;
    private long cancelledOrders;
    private BigDecimal totalRevenue;
    private BigDecimal totalCost;
    private BigDecimal grossProfit;
    private long totalItemsSold;
    private List<TopProductResponse> topProducts;
}
