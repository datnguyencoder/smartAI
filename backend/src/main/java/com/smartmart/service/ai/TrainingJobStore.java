package com.smartmart.service.ai;

import com.smartmart.dto.response.TrainJobResponse;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;


@Component
public class TrainingJobStore {

    private static final int RETENTION_MINUTES = 30;
    private final Map<String, TrainJobResponse> jobs = new ConcurrentHashMap<>();

    public void put(String jobId, TrainJobResponse job) {
        jobs.put(jobId, job);
    }

    public Optional<TrainJobResponse> get(String jobId) {
        return Optional.ofNullable(jobs.get(jobId));
    }

    /** Scheduled cleanup: remove completed/failed jobs older than 30 minutes */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void cleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(RETENTION_MINUTES);
        jobs.entrySet().removeIf(e -> {
            TrainJobResponse job = e.getValue();
            LocalDateTime completedAt = job.getCompletedAt();
            return completedAt != null && completedAt.isBefore(cutoff);
        });
    }
}
