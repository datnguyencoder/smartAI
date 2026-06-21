package com.smartmart.config;

import com.smartmart.dto.response.TrainResultResponse;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.service.ai.ForecastOrchestrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
public class AiAutoTrainListener implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(AiAutoTrainListener.class);

    private final ForecastOrchestrationService forecastOrchestrationService;
    private final ForecastResultRepository forecastResultRepository;

    @Value("${app.ai.auto-train-on-startup:true}")
    private boolean autoTrainOnStartup;

    public AiAutoTrainListener(
            ForecastOrchestrationService forecastOrchestrationService,
            ForecastResultRepository forecastResultRepository
    ) {
        this.forecastOrchestrationService = forecastOrchestrationService;
        this.forecastResultRepository = forecastResultRepository;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if (!autoTrainOnStartup) {
            return;
        }
        if (forecastResultRepository.count() > 0) {
            log.info("AI auto-train skipped: {} forecast results already exist", forecastResultRepository.count());
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                log.info("AI auto-train starting (no forecast results in DB)...");
                TrainResultResponse result = forecastOrchestrationService.train();
                log.info(
                        "AI auto-train completed: modelType={}, itemsForecasted={}",
                        result.getModelType(),
                        result.getItemsForecasted()
                );
            } catch (Exception ex) {
                log.warn("AI auto-train failed (run manually via POST /api/v1/forecast/train): {}", ex.getMessage());
            }
        });
    }
}
