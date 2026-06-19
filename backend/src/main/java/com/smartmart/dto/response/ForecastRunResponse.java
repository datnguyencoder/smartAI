package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ForecastRunResponse {
    private int itemsForecasted;
    private int itemsSubmitted;
    private String source;
    private LocalDateTime ranAt;
    private String message;
}
