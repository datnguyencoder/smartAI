package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class SalesReportResponse {
    private String period;           // "2026-06-07" | "2026-06" | "2026"
    private long totalOrders;        // Tổng hóa đơn
    private long cancelledOrders;    // Hóa đơn hủy
    private BigDecimal totalRevenue; // Doanh thu thuần (chỉ COMPLETED)
    private BigDecimal totalCost;    // Giá vốn hàng bán
    private BigDecimal grossProfit;  // Lợi nhuận gộp = revenue - cost
    private long totalItemsSold;     // Tổng sản phẩm bán ra
    private List<TopProductResponse> topProducts; // Top 5 SP bán chạy nhất trong period
}
