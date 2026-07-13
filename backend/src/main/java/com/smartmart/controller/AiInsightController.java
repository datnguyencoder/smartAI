package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.PromotionSuggestionResponse;
import com.smartmart.service.ai.CerebrasInsightService;
import com.smartmart.service.ai.GeminiAgentService;
import com.smartmart.service.ai.GeminiInsightService;
import com.smartmart.service.ai.KnowledgeBaseIngestionService;
import com.smartmart.service.ai.PromotionRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/v1/ai-insight")
@Tag(name = "AI Insight", description = "Gemini phân tích sâu + agent tool-calling + Cerebras chat nhanh")
@SecurityRequirement(name = "bearerAuth")
public class AiInsightController {

    private static final Logger log = LoggerFactory.getLogger(AiInsightController.class);

    private final GeminiInsightService geminiInsightService;
    private final GeminiAgentService geminiAgentService;
    private final CerebrasInsightService cerebrasInsightService;
    private final PromotionRecommendationService promotionRecommendationService;
    private final KnowledgeBaseIngestionService knowledgeBaseIngestionService;

    public AiInsightController(
            GeminiInsightService geminiInsightService,
            GeminiAgentService geminiAgentService,
            CerebrasInsightService cerebrasInsightService,
            PromotionRecommendationService promotionRecommendationService,
            KnowledgeBaseIngestionService knowledgeBaseIngestionService
    ) {
        this.geminiInsightService = geminiInsightService;
        this.geminiAgentService = geminiAgentService;
        this.cerebrasInsightService = cerebrasInsightService;
        this.promotionRecommendationService = promotionRecommendationService;
        this.knowledgeBaseIngestionService = knowledgeBaseIngestionService;
    }

    @PostMapping("/explain-risk")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Giải thích rủi ro tồn kho (Gemini)")
    public ResponseEntity<ApiResponse<String>> explainRisk(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ApiResponse.success(geminiInsightService.explainRisk(payload)));
    }

    @PostMapping("/explain-forecast/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Giải thích dự báo theo SKU (Gemini + DB context)")
    public ResponseEntity<ApiResponse<String>> explainForecast(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(geminiInsightService.explainForecast(itemId)));
    }

    @PostMapping("/suggest-promotion/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Đề xuất khuyến mãi theo SKU (Gemini, tự fallback nếu lỗi)")
    public ResponseEntity<ApiResponse<PromotionSuggestionResponse>> suggestPromotion(@PathVariable Long itemId) {
        PromotionSuggestionResponse result = promotionRecommendationService.suggestWithFallback(itemId);
        return ResponseEntity.ok(ApiResponse.success("Đề xuất khuyến mãi", result));
    }

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Chat trợ lý vận hành: Gemini agent (function-calling + RAG chính sách), fallback Cerebras nếu Gemini lỗi/chưa cấu hình")
    public ResponseEntity<ApiResponse<String>> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "");
        if (geminiAgentService.isAvailable()) {
            try {
                String answer = geminiAgentService.chat(message);
                if (answer != null && !answer.isBlank()) {
                    return ResponseEntity.ok(ApiResponse.success(answer));
                }
            } catch (Exception ex) {
                log.warn("Gemini agent chat lỗi, fallback Cerebras: {}", ex.getMessage());
            }
        }
        // SYS-10: Gemini agent lỗi/chưa cấu hình không được làm sập chat — fallback sang Cerebras (không tool-calling)
        return ResponseEntity.ok(ApiResponse.success(cerebrasInsightService.chat(message)));
    }

    @PostMapping("/rag/reindex")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Nạp lại tài liệu chính sách/quy tắc nghiệp vụ vào knowledge base cho RAG")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> reindexKnowledgeBase() {
        Map<String, Integer> result = knowledgeBaseIngestionService.reindexAll();
        return ResponseEntity.ok(ApiResponse.success("Đã nạp lại knowledge base", result));
    }
}
