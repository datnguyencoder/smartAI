package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.ForecastItemDetailResponse;
import com.smartmart.entity.ModelTrainingHistory;
import com.smartmart.service.ai.ForecastOrchestrationService;
import com.smartmart.service.ai.ReorderRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/forecast")
@Tag(name = "Forecast", description = "Dự báo AI & gợi ý nhập")
@SecurityRequirement(name = "bearerAuth")
public class ForecastController {

    private final ForecastOrchestrationService forecastOrchestrationService;
    private final ReorderRecommendationService reorderRecommendationService;

    public ForecastController(
            ForecastOrchestrationService forecastOrchestrationService,
            ReorderRecommendationService reorderRecommendationService
    ) {
        this.forecastOrchestrationService = forecastOrchestrationService;
        this.reorderRecommendationService = reorderRecommendationService;
    }

    @PostMapping("/train")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Huấn luyện mô hình AI")
    public ResponseEntity<ApiResponse<Map<String, Object>>> train() {
        return ResponseEntity.ok(ApiResponse.success("Huấn luyện thành công", forecastOrchestrationService.train()));
    }

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chạy dự báo toàn hệ thống")
    public ResponseEntity<ApiResponse<Map<String, Object>>> run() {
        return ResponseEntity.ok(ApiResponse.success("Dự báo thành công", forecastOrchestrationService.runForecast()));
    }

    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Kết quả dự báo")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> results() {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.listResults()));
    }

    @GetMapping("/results/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chi tiết dự báo theo SKU (kèm daily series)")
    public ResponseEntity<ApiResponse<ForecastItemDetailResponse>> resultByItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.getItemResult(itemId)));
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Gợi ý đặt hàng")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> recommendations() {
        return ResponseEntity.ok(ApiResponse.success(reorderRecommendationService.listActive()));
    }

    @GetMapping("/model-history")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Lịch sử huấn luyện")
    public ResponseEntity<ApiResponse<List<ModelTrainingHistory>>> modelHistory() {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.modelHistory()));
    }

    @GetMapping("/ai-status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Trạng thái dịch vụ AI")
    public ResponseEntity<ApiResponse<Map<String, Object>>> aiStatus() {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.getAiStatus()));
    }
}
