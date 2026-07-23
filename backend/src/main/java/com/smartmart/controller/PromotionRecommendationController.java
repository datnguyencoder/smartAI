package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.PromotionRecommendationResponse;
import com.smartmart.service.ai.PromotionRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/promotions/recommendations")
@Tag(name = "Promotion Recommendations", description = "AI đề xuất khuyến mãi — duyệt/từ chối")
@SecurityRequirement(name = "bearerAuth")
public class PromotionRecommendationController {

    private final PromotionRecommendationService promotionRecommendationService;

    public PromotionRecommendationController(PromotionRecommendationService promotionRecommendationService) {
        this.promotionRecommendationService = promotionRecommendationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách đề xuất KM từ AI")
    public ResponseEntity<ApiResponse<List<PromotionRecommendationResponse>>> list(
            @RequestParam(required = false, defaultValue = "false") boolean pendingOnly
    ) {
        List<PromotionRecommendationResponse> data = pendingOnly
                ? promotionRecommendationService.listPending()
                : promotionRecommendationService.listAll();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/auto-suggest")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Quét dự báo tồn kho, tự động tạo đề xuất KM cho SP có nguy cơ ứ đọng")
    public ResponseEntity<ApiResponse<java.util.Map<String, Integer>>> autoSuggest() {
        int created = promotionRecommendationService.autoSuggestFromForecast();
        return ResponseEntity.ok(ApiResponse.success(
                created > 0 ? "Đã tạo " + created + " đề xuất KM mới" : "Không có SP nào cần đề xuất KM lúc này",
                java.util.Map.of("created", created)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Phê duyệt đề xuất KM — tạo mã giảm giá tự động")
    public ResponseEntity<ApiResponse<PromotionRecommendationResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt thành công", promotionRecommendationService.approve(id)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Từ chối đề xuất KM")
    public ResponseEntity<ApiResponse<PromotionRecommendationResponse>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối đề xuất", promotionRecommendationService.reject(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Xoá đề xuất KM khỏi danh sách (không xoá mã KM đã tạo nếu đã duyệt)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        promotionRecommendationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá đề xuất", null));
    }
}
