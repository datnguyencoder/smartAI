package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class TrainResultResponse {
    private String modelType;
    private BigDecimal mae;
    private BigDecimal rmse;
    private BigDecimal mape;
    private LocalDateTime trainedAt;
    private int trainingSamples;
    private int nItemsMl;
    private int nItemsMa;
    private int itemsForecasted;
    private int itemsSubmitted;
    private String forecastSource;
    private LocalDateTime ranAt;
}
