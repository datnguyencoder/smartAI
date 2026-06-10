package com.smartmart.config;

import com.smartmart.exception.AiServiceException;
import com.smartmart.service.ai.ForecastOrchestrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ForecastScheduler {

    private static final Logger log = LoggerFactory.getLogger(ForecastScheduler.class);

    private final ForecastOrchestrationService forecastOrchestrationService;

    public ForecastScheduler(ForecastOrchestrationService forecastOrchestrationService) {
        this.forecastOrchestrationService = forecastOrchestrationService;
    }

    @Scheduled(cron = "0 0 2 * * MON")
    public void scheduledTrain() {
        try {
            forecastOrchestrationService.train();
            log.info("Scheduled AI model training completed");
        } catch (AiServiceException ex) {
            log.warn("Scheduled AI training skipped: {}", ex.getMessage());
        } catch (Exception ex) {
            log.warn("Scheduled AI training failed: {}", ex.getMessage());
        }
    }

    @Scheduled(cron = "0 5 2 * * *")
    public void scheduledForecast() {
        try {
            forecastOrchestrationService.runForecast();
            log.info("Scheduled AI forecast completed");
        } catch (AiServiceException ex) {
            log.warn("Scheduled AI forecast skipped: {}", ex.getMessage());
        } catch (Exception ex) {
            log.warn("Scheduled AI forecast failed: {}", ex.getMessage());
        }
    }
}
