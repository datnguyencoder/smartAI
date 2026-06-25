package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.AiStatusResponse;
import com.smartmart.dto.response.ForecastItemDetailResponse;
import com.smartmart.dto.response.ForecastResultResponse;
import com.smartmart.dto.response.ForecastRunResponse;
import com.smartmart.dto.response.TrainJobResponse;
import com.smartmart.entity.ModelTrainingHistory;
import com.smartmart.service.ai.ForecastOrchestrationService;
import com.smartmart.service.ai.ReorderRecommendationService;
import com.smartmart.service.ai.TrainingJobStore;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
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
    private final TrainingJobStore trainingJobStore;

    public ForecastController(
            ForecastOrchestrationService forecastOrchestrationService,
            ReorderRecommendationService reorderRecommendationService,
            TrainingJobStore trainingJobStore
    ) {
        this.forecastOrchestrationService = forecastOrchestrationService;
        this.reorderRecommendationService = reorderRecommendationService;
        this.trainingJobStore = trainingJobStore;
    }

    @PostMapping("/train")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Bắt đầu huấn luyện mô hình AI (async, trả về jobId để poll trạng thái)")
    public ResponseEntity<ApiResponse<Map<String, String>>> train() {
        String jobId = forecastOrchestrationService.submitTrainAsync();
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Yêu cầu huấn luyện đã được ghi nhận", Map.of("jobId", jobId)));
    }

    @GetMapping("/train/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Kiểm tra trạng thái công việc huấn luyện (QUEUED/RUNNING/DONE/FAILED)")
    public ResponseEntity<ApiResponse<TrainJobResponse>> trainStatus(@RequestParam String jobId) {
        TrainJobResponse job = trainingJobStore.get(jobId)
                .orElse(null);
        if (job == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy job huấn luyện: " + jobId));
        }
        return ResponseEntity.ok(ApiResponse.success(job));
    }

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chạy dự báo toàn hệ thống")
    public ResponseEntity<ApiResponse<ForecastRunResponse>> run() {
        return ResponseEntity.ok(ApiResponse.success("Dự báo thành công", forecastOrchestrationService.runForecast()));
    }

    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Kết quả dự báo")
    public ResponseEntity<ApiResponse<List<ForecastResultResponse>>> results() {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.listResults()));
    }

    @GetMapping("/results/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Chi tiết dự báo theo SKU (kèm daily series)")
    public ResponseEntity<ApiResponse<ForecastItemDetailResponse>> resultByItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.getItemResult(itemId)));
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Gợi ý đặt hàng")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> recommendations() {
        return ResponseEntity.ok(ApiResponse.success(reorderRecommendationService.listActive()));
    }

    @GetMapping("/model-history")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Lịch sử huấn luyện")
    public ResponseEntity<ApiResponse<List<ModelTrainingHistory>>> modelHistory() {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.modelHistory()));
    }

    @GetMapping("/ai-status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Trạng thái dịch vụ AI")
    public ResponseEntity<ApiResponse<AiStatusResponse>> aiStatus() {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.getAiStatus()));
    }

    @GetMapping("/model-metrics")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    @Operation(summary = "Metrics mô hình ML từ AI service (MAPE, model type per SKU)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> modelMetrics() {
        return ResponseEntity.ok(ApiResponse.success(forecastOrchestrationService.getModelMetrics()));
    }
}
