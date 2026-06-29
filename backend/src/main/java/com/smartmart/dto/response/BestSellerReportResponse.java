package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class BestSellerReportResponse {
    private Long itemId;
    private String itemCode;
    private String itemName;
    private BigDecimal quantitySold;
    private BigDecimal revenue;
}
