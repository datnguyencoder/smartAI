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

    /**
     * Quét forecast gần nhất của từng SP: nếu dự báo bán 7 ngày tới thấp hơn nhiều so với tồn kho
     * hiện tại (nguy cơ ứ đọng), tự động tạo đề xuất KM (bỏ qua SP đã LOW_STOCK/HIGH_RISK hoặc đã
     * có đề xuất PENDING). Trả về số đề xuất mới được tạo.
     */
    int autoSuggestFromForecast();
}
