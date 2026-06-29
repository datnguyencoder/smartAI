package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class ProductExpiryReportResponse {
    private Long itemId;
    private String itemCode;
    private String itemName;
    private Long lotId;
    private String lotNumber;
    private LocalDate expiryDate;
    private Integer daysUntilExpiry;
    private BigDecimal quantity;
    private String locationName;
}
