package com.smartmart.service.ai.impl;

import com.smartmart.dto.request.CreatePromotionRequest;
import com.smartmart.dto.response.PromotionRecommendationResponse;
import com.smartmart.dto.response.PromotionResponse;
import com.smartmart.entity.Item;
import com.smartmart.entity.PromotionRecommendation;
import com.smartmart.enums.AlertType;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.InventoryAlertRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.PromotionRecommendationRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.PromotionService;
import com.smartmart.service.ai.PromotionRecommendationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class PromotionRecommendationServiceImpl implements PromotionRecommendationService {

    private static final Pattern DISCOUNT_PATTERN = Pattern.compile("(\\d{1,2})\\s*%");

    private final PromotionRecommendationRepository promotionRepository;
    private final ItemRepository itemRepository;
    private final InventoryAlertRepository inventoryAlertRepository;
    private final AuditLogService auditLogService;
    private final PromotionService promotionService;

    public PromotionRecommendationServiceImpl(
            PromotionRecommendationRepository promotionRepository,
            ItemRepository itemRepository,
            InventoryAlertRepository inventoryAlertRepository,
            AuditLogService auditLogService,
            PromotionService promotionService
    ) {
        this.promotionRepository = promotionRepository;
        this.itemRepository = itemRepository;
        this.inventoryAlertRepository = inventoryAlertRepository;
        this.auditLogService = auditLogService;
        this.promotionService = promotionService;
    }

    @Override
    public PromotionRecommendation saveSuggestion(Long itemId, String geminiText) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));

        if (inventoryAlertRepository.existsByItemIdAndAlertTypeInAndResolvedFalse(
                itemId, List.of(AlertType.LOW_STOCK.name(), AlertType.HIGH_RISK.name()))) {
            throw new BadRequestException(
                    "Không thể đề xuất KM cho sản phẩm đang LOW_STOCK hoặc HIGH_RISK (PROMO-04)");
        }

        BigDecimal discount = extractDiscount(geminiText);
        String reason = geminiText != null && geminiText.length() > 500
                ? geminiText.substring(0, 497) + "..."
                : geminiText;

        PromotionRecommendation saved = promotionRepository.save(PromotionRecommendation.builder()
                .item(item)
                .discountPercent(discount)
                .reason(reason)
                .status("PENDING")
                .build());
        auditLogService.log("PROMO_SUGGEST", "AI đề xuất KM cho " + item.getItemCode() + ": " + discount + "%");
        return saved;
    }

    @Transactional(readOnly = true)
    @Override
    public List<PromotionRecommendationResponse> listPending() {
        return promotionRepository.findByStatus("PENDING").stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<PromotionRecommendationResponse> listAll() {
        return promotionRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public PromotionRecommendationResponse approve(Long id) {
        PromotionRecommendation rec = findById(id);
        if (!"PENDING".equals(rec.getStatus())) {
            throw new BadRequestException("Đề xuất đã được xử lý");
        }

        Item item = rec.getItem();
        String code = buildPromotionCode(item, rec.getId());
        CreatePromotionRequest request = new CreatePromotionRequest();
        request.setName("AI KM " + item.getItemName());
        request.setCode(code);
        request.setType("PERCENTAGE");
        request.setValue(rec.getDiscountPercent());
        request.setMinOrder(BigDecimal.ZERO);
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(14));
        request.setActive(true);

        PromotionResponse created = promotionService.create(request);
        rec.setStatus("APPROVED");
        rec.setPromotionId(created.getId());
        rec.setPromotionCode(created.getCode());
        rec.setReason(appendPromotionCode(rec.getReason(), created.getCode()));
        auditLogService.log("PROMO_APPROVE", "Duyệt KM AI #" + id + " → " + created.getCode());
        return toResponse(rec);
    }

    @Override
    public PromotionRecommendationResponse reject(Long id) {
        PromotionRecommendation rec = findById(id);
        if (!"PENDING".equals(rec.getStatus())) {
            throw new BadRequestException("Đề xuất đã được xử lý");
        }
        rec.setStatus("REJECTED");
        auditLogService.log("PROMO_REJECT", "Từ chối KM AI #" + id);
        return toResponse(rec, null);
    }

    private PromotionRecommendation findById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đề xuất khuyến mãi"));
    }

    private String buildPromotionCode(Item item, Long recId) {
        String base = "AI" + item.getItemCode().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (base.length() > 40) {
            base = base.substring(0, 40);
        }
        return base + recId;
    }

    private PromotionRecommendationResponse toResponse(PromotionRecommendation rec) {
        return toResponse(rec, rec.getPromotionCode() != null ? rec.getPromotionCode() : extractCodeFromReason(rec.getReason()));
    }

    private PromotionRecommendationResponse toResponse(PromotionRecommendation rec, String promotionCode) {
        Item item = rec.getItem();
        return PromotionRecommendationResponse.builder()
                .id(rec.getId())
                .itemId(item.getId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .discountPercent(rec.getDiscountPercent())
                .reason(rec.getReason())
                .status(rec.getStatus())
                .promotionId(rec.getPromotionId())
                .promotionCode(promotionCode)
                .createdAt(rec.getCreatedAt())
                .build();
    }

    private String appendPromotionCode(String reason, String code) {
        String safeReason = reason != null ? reason : "";
        if (safeReason.contains("Mã: ")) {
            return safeReason;
        }
        String appended = safeReason + " | Mã: " + code;
        return appended.length() > 500 ? appended.substring(0, 500) : appended;
    }

    private String extractCodeFromReason(String reason) {
        if (reason == null || !reason.contains("Mã: ")) {
            return null;
        }
        return reason.substring(reason.lastIndexOf("Mã: ") + 4).trim();
    }

    private BigDecimal extractDiscount(String text) {
        if (text == null || text.isBlank()) {
            return BigDecimal.valueOf(10);
        }
        Matcher m = DISCOUNT_PATTERN.matcher(text);
        if (m.find()) {
            int pct = Integer.parseInt(m.group(1));
            if (pct >= 5 && pct <= 50) {
                return BigDecimal.valueOf(pct);
            }
        }
        return BigDecimal.valueOf(15);
    }
}
