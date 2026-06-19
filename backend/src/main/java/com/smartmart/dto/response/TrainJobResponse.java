package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class TrainJobResponse {
    private String jobId;
    /** QUEUED | RUNNING | DONE | FAILED */
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private TrainResultResponse result;
    private String errorMessage;
}
