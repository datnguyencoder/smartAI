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
    private BigDecimal currentStock;
    private BigDecimal totalPurchased;
    private BigDecimal totalSold;
    private BigDecimal totalScrapped;
    private BigDecimal shrinkage;
    private BigDecimal turnoverRate;
    private LocalDate nearestExpiryDate;
    private Integer daysUntilExpiry;
}
