package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ForecastItemDetailResponse {

    private Long itemId;
    private String itemName;
    private BigDecimal pred7d;
    private BigDecimal pred14d;
    private BigDecimal pred30d;
    private String modelType;
    private LocalDateTime forecastDate;
    private List<DailyPoint> dailySeries;

    @Data
    @Builder
    public static class DailyPoint {
        private String date;
        private BigDecimal predictedQty;
    }
}
