package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.entity.PromotionRecommendation;
import com.smartmart.service.ai.CerebrasInsightService;
import com.smartmart.service.ai.GeminiInsightService;
import com.smartmart.service.ai.PromotionRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai-insight")
@Tag(name = "AI Insight", description = "Gemini phân tích sâu + Cerebras chat nhanh")
@SecurityRequirement(name = "bearerAuth")
public class AiInsightController {

    private final GeminiInsightService geminiInsightService;
    private final CerebrasInsightService cerebrasInsightService;
    private final PromotionRecommendationService promotionRecommendationService;

    public AiInsightController(
            GeminiInsightService geminiInsightService,
            CerebrasInsightService cerebrasInsightService,
            PromotionRecommendationService promotionRecommendationService
    ) {
        this.geminiInsightService = geminiInsightService;
        this.cerebrasInsightService = cerebrasInsightService;
        this.promotionRecommendationService = promotionRecommendationService;
    }

    @PostMapping("/explain-risk")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Giải thích rủi ro tồn kho (Gemini)")
    public ResponseEntity<ApiResponse<String>> explainRisk(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ApiResponse.success(geminiInsightService.explainRisk(payload)));
    }

    @PostMapping("/explain-forecast/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Giải thích dự báo theo SKU (Gemini + DB context)")
    public ResponseEntity<ApiResponse<String>> explainForecast(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(geminiInsightService.explainForecast(itemId)));
    }

    @PostMapping("/suggest-promotion/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Đề xuất khuyến mãi theo SKU (Gemini)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> suggestPromotion(@PathVariable Long itemId) {
        String suggestion = geminiInsightService.suggestPromotion(itemId);
        PromotionRecommendation saved = promotionRecommendationService.saveSuggestion(itemId, suggestion);
        Map<String, Object> data = Map.of(
                "suggestion", suggestion,
                "promotionId", saved.getId(),
                "discountPercent", saved.getDiscountPercent(),
                "status", saved.getStatus()
        );
        return ResponseEntity.ok(ApiResponse.success("Đề xuất khuyến mãi", data));
    }

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chat trợ lý vận hành (Cerebras)")
    public ResponseEntity<ApiResponse<String>> chat(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(cerebrasInsightService.chat(body.getOrDefault("message", ""))));
    }
}
