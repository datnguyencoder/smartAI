package com.smartmart.config;

import com.smartmart.exception.AiServiceException;
import com.smartmart.service.ai.ForecastOrchestrationService;
import com.smartmart.service.ai.PromotionRecommendationService;
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
    private final PromotionRecommendationService promotionRecommendationService;

    public ForecastScheduler(
            ForecastOrchestrationService forecastOrchestrationService,
            PromotionRecommendationService promotionRecommendationService) {
        this.forecastOrchestrationService = forecastOrchestrationService;
        this.promotionRecommendationService = promotionRecommendationService;
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

    @Scheduled(cron = "0 20 2 * * *")
    public void scheduledPromotionAutoSuggest() {
        try {
            int created = promotionRecommendationService.autoSuggestFromForecast();
            log.info("Scheduled promotion auto-suggest completed: {} đề xuất mới", created);
        } catch (Exception ex) {
            log.warn("Scheduled promotion auto-suggest failed: {}", ex.getMessage());
        }
    }
}
