package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.service.ai.GeminiInsightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai-insight")
@Tag(name = "AI Insight", description = "Gemini trợ lý")
@SecurityRequirement(name = "bearerAuth")
public class AiInsightController {

    private final GeminiInsightService geminiInsightService;

    public AiInsightController(GeminiInsightService geminiInsightService) {
        this.geminiInsightService = geminiInsightService;
    }

    @PostMapping("/explain-risk")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Giải thích rủi ro tồn kho")
    public ResponseEntity<ApiResponse<String>> explainRisk(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ApiResponse.success(geminiInsightService.explainRisk(payload)));
    }

    @PostMapping("/chat")
    @Operation(summary = "Chat trợ lý AI")
    public ResponseEntity<ApiResponse<String>> chat(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(geminiInsightService.chat(body.getOrDefault("message", ""))));
    }
}
