package com.smartmart.service.ai;

import com.smartmart.dto.response.PromotionRecommendationResponse;
import com.smartmart.dto.response.PromotionSuggestionResponse;
import com.smartmart.entity.PromotionRecommendation;

import java.util.List;

public interface PromotionRecommendationService {

    PromotionSuggestionResponse suggestWithFallback(Long itemId);

    PromotionRecommendation saveSuggestion(Long itemId, String geminiText);

    List<PromotionRecommendationResponse> listPending();

    List<PromotionRecommendationResponse> listAll();

    PromotionRecommendationResponse approve(Long id);

    PromotionRecommendationResponse reject(Long id);
}
