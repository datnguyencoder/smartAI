package com.smartmart.service.ai;

import java.util.Map;

public interface GeminiInsightService {

    String explainRisk(Map<String, Object> payload);

    String explainForecast(Long itemId);

    String suggestPromotion(Long itemId);

    String chat(String message);
}
