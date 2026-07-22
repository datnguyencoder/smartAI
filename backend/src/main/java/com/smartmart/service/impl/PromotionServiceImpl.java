package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreatePromotionRequest;
import com.smartmart.dto.request.UpdatePromotionRequest;
import com.smartmart.dto.response.PromotionResponse;
import com.smartmart.dto.response.PromotionValidateResponse;
import com.smartmart.entity.Customer;
import com.smartmart.entity.Order;
import com.smartmart.entity.Promotion;
import com.smartmart.entity.PromotionUsage;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.PromotionRepository;
import com.smartmart.repository.PromotionUsageRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.PromotionService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final AuditLogService auditLogService;

    public PromotionServiceImpl(
            PromotionRepository promotionRepository,
            PromotionUsageRepository promotionUsageRepository,
            AuditLogService auditLogService) {
        this.promotionRepository = promotionRepository;
        this.promotionUsageRepository = promotionUsageRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<PromotionResponse> listAll() {
        return promotionRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<PromotionResponse> listActive() {
        LocalDate today = LocalDate.now();
        return promotionRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(p -> (p.getStartDate() == null || !today.isBefore(p.getStartDate()))
                        && (p.getEndDate() == null || !today.isAfter(p.getEndDate())))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public PromotionResponse getById(Long id) {
        return toResponse(findPromotion(id));
    }

    @Override
    public PromotionResponse create(CreatePromotionRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (promotionRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new BadRequestException("Mã khuyến mãi đã tồn tại");
        }
        Promotion saved = promotionRepository.save(Promotion.builder()
                .name(request.getName().trim())
                .code(code)
                .type(request.getType().toUpperCase())
                .value(request.getValue())
                .minOrder(request.getMinOrder() != null ? request.getMinOrder() : BigDecimal.ZERO)
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .endDate(request.getEndDate() != null ? request.getEndDate() : LocalDate.now().plusMonths(3))
                .active(request.getActive() == null || request.getActive())
                .maxUsage(request.getMaxUsage())
                .maxPerCustomer(request.getMaxPerCustomer())
                .usageCount(0)
                .build());
        auditLogService.log(
                AuditAction.PROMOTION_CREATE,
                "PROMOTION",
                saved.getId().toString(),
                "Tạo khuyến mãi: " + saved.getCode(),
                null,
                promotionData(saved)
        );
        return toResponse(saved);
    }

    @Override
    public PromotionResponse update(Long id, UpdatePromotionRequest request) {
        Promotion promotion = findPromotion(id);
        String beforeData = promotionData(promotion);
        if (request.getName() != null) promotion.setName(request.getName().trim());
        if (request.getCode() != null) {
            String newCode = request.getCode().trim().toUpperCase();
            if (!newCode.equals(promotion.getCode())
                    && promotionRepository.findByCodeIgnoreCase(newCode).isPresent()) {
                throw new BadRequestException("Mã khuyến mãi đã tồn tại");
            }
            promotion.setCode(newCode);
        }
        if (request.getType() != null) promotion.setType(request.getType().toUpperCase());
        if (request.getValue() != null) promotion.setValue(request.getValue());
        if (request.getMinOrder() != null) promotion.setMinOrder(request.getMinOrder());
        if (request.getStartDate() != null) promotion.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) promotion.setEndDate(request.getEndDate());
        if (request.getActive() != null) promotion.setActive(request.getActive());
        if (request.getMaxUsage() != null) {
            promotion.setMaxUsage(request.getMaxUsage() == -1 ? null : request.getMaxUsage());
        }
        if (request.getMaxPerCustomer() != null) {
            promotion.setMaxPerCustomer(request.getMaxPerCustomer() == -1 ? null : request.getMaxPerCustomer());
        }
        Promotion saved = promotionRepository.save(promotion);
        auditLogService.log(
                AuditAction.PROMOTION_UPDATE,
                "PROMOTION",
                saved.getId().toString(),
                "Cập nhật khuyến mãi: " + saved.getCode(),
                beforeData,
                promotionData(saved)
        );
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        Promotion promotion = findPromotion(id);
        String beforeData = promotionData(promotion);

        promotionRepository.delete(promotion);

        auditLogService.log(
                AuditAction.PROMOTION_DELETE,
                "PROMOTION",
                id.toString(),
                "Xóa khuyến mãi: " + promotion.getCode(),
                beforeData,
                null
        );
    }

    @Transactional(readOnly = true)
    @Override
    public PromotionValidateResponse validateCode(String code, BigDecimal orderSubtotal, Long customerId) {
        try {
            Promotion promotion = resolvePromotion(code, orderSubtotal, customerId);
            BigDecimal discount = calculateDiscountAmount(promotion, orderSubtotal);
            return PromotionValidateResponse.builder()
                    .valid(true)
                    .promotionName(promotion.getName())
                    .code(promotion.getCode())
                    .discountAmount(discount)
                    .message("Áp dụng thành công")
                    .build();
        } catch (BadRequestException ex) {
            return PromotionValidateResponse.builder()
                    .valid(false)
                    .code(code)
                    .discountAmount(BigDecimal.ZERO)
                    .message(ex.getMessage())
                    .build();
        }
    }

    @Transactional(readOnly = true)
    @Override
    public Promotion applyCode(String code, BigDecimal orderSubtotal, Long customerId) {
        return resolvePromotion(code, orderSubtotal, customerId);
    }

    @Transactional(readOnly = true)
    @Override
    public BigDecimal calculateDiscount(Promotion promotion, BigDecimal orderSubtotal) {
        return calculateDiscountAmount(promotion, orderSubtotal);
    }

    @Override
    public void recordUsage(Promotion promotion, Customer customer, Order order) {
        if (promotion == null) return;
        promotion.setUsageCount((promotion.getUsageCount() != null ? promotion.getUsageCount() : 0) + 1);
        promotionRepository.save(promotion);
        promotionUsageRepository.save(PromotionUsage.builder()
                .promotion(promotion)
                .customer(customer)
                .order(order)
                .build());
    }

    private Promotion resolvePromotion(String code, BigDecimal orderSubtotal, Long customerId) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Mã khuyến mãi không hợp lệ");
        }
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BadRequestException("Mã khuyến mãi không tồn tại"));
        if (!promotion.isActive()) {
            throw new BadRequestException("Mã khuyến mãi đã ngừng áp dụng");
        }
        LocalDate today = LocalDate.now();
        if (promotion.getStartDate() != null && today.isBefore(promotion.getStartDate())) {
            throw new BadRequestException("Mã khuyến mãi chưa có hiệu lực");
        }
        if (promotion.getEndDate() != null && today.isAfter(promotion.getEndDate())) {
            throw new BadRequestException("Mã khuyến mãi đã hết hạn");
        }
        BigDecimal subtotal = orderSubtotal != null ? orderSubtotal : BigDecimal.ZERO;
        if (subtotal.compareTo(promotion.getMinOrder()) < 0) {
            throw new BadRequestException("Đơn hàng chưa đạt giá trị tối thiểu " + promotion.getMinOrder());
        }
        if (promotion.getMaxUsage() != null
                && promotion.getUsageCount() != null
                && promotion.getUsageCount() >= promotion.getMaxUsage()) {
            throw new BadRequestException("Mã khuyến mãi đã hết lượt sử dụng");
        }
        if (promotion.getMaxPerCustomer() != null && customerId != null) {
            long usedByCustomer = promotionUsageRepository.countByPromotionIdAndCustomerId(promotion.getId(), customerId);
            if (usedByCustomer >= promotion.getMaxPerCustomer()) {
                throw new BadRequestException("Bạn đã dùng hết lượt cho mã khuyến mãi này");
            }
        }
        return promotion;
    }

    private BigDecimal calculateDiscountAmount(Promotion promotion, BigDecimal orderSubtotal) {
        BigDecimal subtotal = orderSubtotal != null ? orderSubtotal : BigDecimal.ZERO;
        if ("FIXED_AMOUNT".equalsIgnoreCase(promotion.getType())) {
            return promotion.getValue().min(subtotal).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal pct = promotion.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return subtotal.multiply(pct).setScale(2, RoundingMode.HALF_UP);
    }

    private Promotion findPromotion(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khuyến mãi"));
    }

    private PromotionResponse toResponse(Promotion promotion) {
        return PromotionResponse.builder()
                .id(promotion.getId())
                .name(promotion.getName())
                .code(promotion.getCode())
                .type(promotion.getType())
                .value(promotion.getValue())
                .minOrder(promotion.getMinOrder())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .active(promotion.isActive())
                .maxUsage(promotion.getMaxUsage())
                .usageCount(promotion.getUsageCount())
                .maxPerCustomer(promotion.getMaxPerCustomer())
                .createdAt(promotion.getCreatedAt())
                .build();
    }

    private String promotionData(Promotion promotion) {
        return AuditData.of(
                "name", promotion.getName(),
                "code", promotion.getCode(),
                "type", promotion.getType(),
                "value", promotion.getValue(),
                "minOrder", promotion.getMinOrder(),
                "startDate", promotion.getStartDate(),
                "endDate", promotion.getEndDate(),
                "active", promotion.isActive(),
                "maxUsage", promotion.getMaxUsage(),
                "maxPerCustomer", promotion.getMaxPerCustomer()
        );
    }
}
