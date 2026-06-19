package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ForecastResultResponse {
    private Long itemId;
    private String itemCode;
    private String itemName;
    private BigDecimal pred7d;
    private BigDecimal pred14d;
    private BigDecimal pred30d;
    private String modelType;
    private LocalDateTime forecastDate;
    private BigDecimal confidenceLow;
    private BigDecimal confidenceHigh;
    private BigDecimal stockOnHand;
    private BigDecimal shortageQty;
    private BigDecimal surplusQty;
    private String riskLevel;
    private String recommendation;
}
