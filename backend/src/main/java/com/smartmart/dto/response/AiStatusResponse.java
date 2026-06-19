package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AiStatusResponse {
    private boolean aiOnline;
    private boolean modelLoaded;
    private String aiVersion;
    private LocalDateTime lastTrainedAt;
    private String modelType;
    private long totalForecasts;
}
