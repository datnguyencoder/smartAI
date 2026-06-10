package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class InventoryReportResponse {
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String categoryName;
    private BigDecimal currentStock;         // Tồn hiện tại
    private BigDecimal totalPurchased;       // Tổng nhập trong period
    private BigDecimal totalSold;            // Tổng bán trong period
    private BigDecimal totalScrapped;        // Tổng hủy trong period
    private BigDecimal shrinkage;            // Hao hụt = purchased - sold - scrapped - currentStock delta
    private BigDecimal turnoverRate;         // Quay vòng = sold / currentStock (tránh /0)
    private LocalDate nearestExpiryDate;     // Hạn sử dụng gần nhất (nếu có)
    private Integer daysUntilExpiry;         // Số ngày còn lại (null nếu không có)
}
