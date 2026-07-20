package com.smartmart.service.ai;

import com.smartmart.dto.request.CreateDiscountPlanRequest;
import com.smartmart.dto.request.CreatePromotionRequest;
import com.smartmart.dto.response.DiscountPlanResponse;
import com.smartmart.dto.response.PromotionResponse;
import com.smartmart.enums.DiscountDealType;
import com.smartmart.enums.DiscountPlanType;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.DiscountPlanService;
import com.smartmart.service.PromotionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Các hành động GHI (write) mà AI agent được phép thực hiện — hiện giới hạn ở
 * nghiệp vụ khuyến mãi (an toàn & có thể đảo ngược: chỉ cần tắt kế hoạch là hết hiệu lực).
 *
 * <p>Chạy {@link Propagation#REQUIRES_NEW} vì {@code AiToolExecutor} bao ngoài là
 * {@code readOnly = true}; write phải mở transaction đọc-ghi mới, không thì Postgres
 * báo lỗi "cannot execute INSERT in a read-only transaction".
 *
 * <p>Mọi hành động đều ghi audit log để truy vết ai/AI đã tạo cái gì.
 */
@Service
public class AiActionService {

    private static final Logger log = LoggerFactory.getLogger(AiActionService.class);

    private final DiscountPlanService discountPlanService;
    private final PromotionService promotionService;
    private final AuditLogService auditLogService;

    public AiActionService(
            DiscountPlanService discountPlanService,
            PromotionService promotionService,
            AuditLogService auditLogService) {
        this.discountPlanService = discountPlanService;
        this.promotionService = promotionService;
        this.auditLogService = auditLogService;
    }

    /**
     * Tạo chiến dịch giảm giá tự động (auto-apply tại POS): theo danh mục hoặc SKU,
     * loại PERCENTAGE (giảm %) hoặc BOGO (mua X tặng Y).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> createDiscountCampaign(
            String planName, String planType, Long categoryId, Long itemId,
            String dealType, BigDecimal discountPercent, Integer buyQuantity, Integer freeQuantity,
            Integer durationDays) {
        try {
            CreateDiscountPlanRequest req = new CreateDiscountPlanRequest();
            req.setPlanName(planName != null && !planName.isBlank() ? planName.trim() : "Chiến dịch KM (AI)");
            req.setPlanType(DiscountPlanType.valueOf(planType == null ? "CATEGORY" : planType.trim().toUpperCase()));
            req.setCategoryId(categoryId);
            req.setItemId(itemId);
            DiscountDealType resolvedDeal = DiscountDealType.valueOf(
                    dealType == null ? "PERCENTAGE" : dealType.trim().toUpperCase());
            req.setDealType(resolvedDeal);
            req.setDiscountPercent(discountPercent);
            req.setBuyQuantity(buyQuantity);
            req.setFreeQuantity(freeQuantity);
            req.setStartDate(LocalDate.now());
            req.setEndDate(LocalDate.now().plusDays(durationDays != null && durationDays > 0 ? durationDays : 14));

            DiscountPlanResponse created = discountPlanService.create(req);
            auditLogService.log("AI_CREATE_DISCOUNT_PLAN", "DISCOUNT_PLAN",
                    String.valueOf(created.getId()),
                    "AI tạo chiến dịch KM: " + created.getPlanName(), null, null);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("planId", created.getId());
            result.put("planName", created.getPlanName());
            result.put("planType", created.getPlanType());
            result.put("dealType", created.getDealType());
            result.put("target", created.getItemName() != null ? created.getItemName() : created.getCategoryName());
            result.put("discountPercent", created.getDiscountPercent());
            result.put("buyQuantity", created.getBuyQuantity());
            result.put("freeQuantity", created.getFreeQuantity());
            result.put("startDate", created.getStartDate());
            result.put("endDate", created.getEndDate());
            return result;
        } catch (IllegalArgumentException ex) {
            return Map.of("success", false, "error", "Tham số không hợp lệ: " + ex.getMessage());
        } catch (Exception ex) {
            log.warn("AI createDiscountCampaign lỗi: {}", ex.getMessage());
            return Map.of("success", false, "error", ex.getMessage());
        }
    }

    /** Tạo mã khuyến mãi (coupon code) áp tại POS khi nhập mã, giảm % trên tổng đơn. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> createPromoCode(
            String name, String code, BigDecimal discountPercent, BigDecimal minOrder, Integer durationDays) {
        try {
            String finalCode = (code != null && !code.isBlank())
                    ? code.trim().toUpperCase().replaceAll("[^A-Z0-9]", "")
                    : "KM" + System.currentTimeMillis() % 1_000_000;
            CreatePromotionRequest req = new CreatePromotionRequest();
            req.setName(name != null && !name.isBlank() ? name.trim() : "Mã KM (AI)");
            req.setCode(finalCode);
            req.setType("PERCENTAGE");
            req.setValue(discountPercent);
            req.setMinOrder(minOrder != null ? minOrder : BigDecimal.ZERO);
            req.setStartDate(LocalDate.now());
            req.setEndDate(LocalDate.now().plusDays(durationDays != null && durationDays > 0 ? durationDays : 14));
            req.setActive(true);

            PromotionResponse created = promotionService.create(req);
            auditLogService.log("AI_CREATE_PROMO_CODE", "PROMOTION",
                    String.valueOf(created.getId()),
                    "AI tạo mã KM: " + created.getCode(), null, null);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("promotionId", created.getId());
            result.put("name", created.getName());
            result.put("code", created.getCode());
            result.put("discountPercent", created.getValue());
            result.put("minOrder", created.getMinOrder());
            result.put("endDate", created.getEndDate());
            return result;
        } catch (Exception ex) {
            log.warn("AI createPromoCode lỗi: {}", ex.getMessage());
            return Map.of("success", false, "error", ex.getMessage());
        }
    }
}
