package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateDiscountPlanRequest;
import com.smartmart.dto.request.UpdateDiscountPlanRequest;
import com.smartmart.dto.response.DiscountApplyResponse;
import com.smartmart.dto.response.DiscountPlanResponse;
import com.smartmart.entity.Category;
import com.smartmart.entity.DiscountPlan;
import com.smartmart.entity.Item;
import com.smartmart.enums.DiscountDealType;
import com.smartmart.enums.DiscountPlanType;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CategoryRepository;
import com.smartmart.repository.DiscountPlanRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.DiscountPlanService;
import com.smartmart.service.ItemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class DiscountPlanServiceImpl implements DiscountPlanService {

    private final DiscountPlanRepository discountPlanRepository;
    private final ItemService itemService;
    private final CategoryRepository categoryRepository;
    private final AuditLogService auditLogService;

    public DiscountPlanServiceImpl(
            DiscountPlanRepository discountPlanRepository,
            ItemService itemService,
            CategoryRepository categoryRepository,
            AuditLogService auditLogService) {
        this.discountPlanRepository = discountPlanRepository;
        this.itemService = itemService;
        this.categoryRepository = categoryRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public DiscountPlanResponse create(CreateDiscountPlanRequest request) {
        validatePlanRequest(request.getPlanType(), request.getCategoryId(), request.getItemId());
        DiscountDealType dealType = request.getDealType() != null ? request.getDealType() : DiscountDealType.PERCENTAGE;
        validateDealRequest(dealType, request.getDiscountPercent(), request.getBuyQuantity(), request.getFreeQuantity());
        if (request.getStartDate() != null && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
        }
        Item giftItem = dealType == DiscountDealType.BOGO ? resolveItem(request.getGiftItemId()) : null;
        if (giftItem != null && request.getPlanType() == DiscountPlanType.SKU
                && request.getItemId() != null && giftItem.getId().equals(request.getItemId())) {
            throw new BadRequestException(
                    "Sản phẩm tặng không được trùng sản phẩm đang mua — để trống nếu muốn tặng thêm chính sản phẩm này");
        }
        DiscountPlan plan = DiscountPlan.builder()
                .planName(request.getPlanName().trim())
                .planType(request.getPlanType())
                .category(resolveCategory(request.getCategoryId()))
                .item(resolveItem(request.getItemId()))
                .dealType(dealType)
                .discountPercent(dealType == DiscountDealType.PERCENTAGE ? request.getDiscountPercent() : null)
                .buyQuantity(dealType == DiscountDealType.BOGO ? request.getBuyQuantity() : null)
                .freeQuantity(dealType == DiscountDealType.BOGO ? request.getFreeQuantity() : null)
                .giftItem(giftItem)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(true)
                .build();
        return toResponse(discountPlanRepository.save(plan));
    }

    @Override
    public DiscountPlanResponse update(Long id, UpdateDiscountPlanRequest request) {
        DiscountPlan plan = findById(id);
        if (request.getPlanName() != null && !request.getPlanName().isBlank()) {
            plan.setPlanName(request.getPlanName().trim());
        }
        if (plan.getDealType() == DiscountDealType.BOGO) {
            Integer buyQty = request.getBuyQuantity() != null ? request.getBuyQuantity() : plan.getBuyQuantity();
            Integer freeQty = request.getFreeQuantity() != null ? request.getFreeQuantity() : plan.getFreeQuantity();
            if (request.getBuyQuantity() != null || request.getFreeQuantity() != null) {
                validateDealRequest(DiscountDealType.BOGO, null, buyQty, freeQty);
                plan.setBuyQuantity(buyQty);
                plan.setFreeQuantity(freeQty);
            }
            if (request.getGiftItemId() != null) {
                Item newGift = request.getGiftItemId() == 0 ? null : resolveItem(request.getGiftItemId());
                if (newGift != null && plan.getPlanType() == DiscountPlanType.SKU
                        && plan.getItem() != null && newGift.getId().equals(plan.getItem().getId())) {
                    throw new BadRequestException(
                            "Sản phẩm tặng không được trùng sản phẩm đang mua — gửi giftItemId=0 nếu muốn tặng thêm chính sản phẩm này");
                }
                plan.setGiftItem(newGift);
            }
        } else if (request.getDiscountPercent() != null) {
            validateDealRequest(DiscountDealType.PERCENTAGE, request.getDiscountPercent(), null, null);
            plan.setDiscountPercent(request.getDiscountPercent());
        }
        LocalDate effectiveStart = request.getStartDate() != null ? request.getStartDate() : plan.getStartDate();
        LocalDate effectiveEnd = request.getEndDate() != null ? request.getEndDate() : plan.getEndDate();
        if (effectiveStart != null && effectiveEnd != null && effectiveEnd.isBefore(effectiveStart)) {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
        }
        if (request.getStartDate() != null) {
            plan.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            plan.setEndDate(request.getEndDate());
        }
        if (request.getActive() != null) {
            plan.setActive(request.getActive());
        }
        return toResponse(discountPlanRepository.save(plan));
    }

    @Override
    @Transactional(readOnly = true)
    public DiscountPlanResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public void delete(Long id) {
        DiscountPlan plan = findById(id);
        String planName = plan.getPlanName();
        discountPlanRepository.delete(plan);
        auditLogService.log("DISCOUNT_PLAN_DELETE", "DISCOUNT_PLAN", id.toString(),
                "Xóa chiến dịch khuyến mãi: " + planName, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiscountPlanResponse> listAll() {
        return discountPlanRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiscountPlanResponse> listActiveToday() {
        return discountPlanRepository.findAllActiveToday(LocalDate.now()).stream()
                .map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DiscountApplyResponse applyForItem(Long itemId) {
        Item item = itemService.findItem(itemId);
        LocalDate today = LocalDate.now();

        // Plan BOGO có giftItem (tặng sản phẩm KHÁC) không tự giảm giá sản phẩm đang xét —
        // nó cần đối chiếu cả giỏ hàng (đã mua đủ trigger + có mặt hàng quà trong giỏ chưa),
        // nên được resolve riêng ở OrderServiceImpl.resolveGiftWithPurchase, loại khỏi đây.
        List<DiscountPlan> skuPlans = discountPlanRepository.findActiveByType(DiscountPlanType.SKU, today).stream()
                .filter(p -> p.getItem() != null && p.getItem().getId().equals(itemId))
                .filter(this::isSameItemDeal)
                .toList();
        if (!skuPlans.isEmpty()) {
            return toApplyResponse(itemId, bestPlan(skuPlans));
        }

        if (item.getCategory() != null) {
            List<DiscountPlan> categoryPlans = discountPlanRepository
                    .findActiveByType(DiscountPlanType.CATEGORY, today).stream()
                    .filter(p -> p.getCategory() != null
                            && p.getCategory().getId().equals(item.getCategory().getId()))
                    .filter(this::isSameItemDeal)
                    .toList();
            if (!categoryPlans.isEmpty()) {
                return toApplyResponse(itemId, bestPlan(categoryPlans));
            }
        }

        return DiscountApplyResponse.builder()
                .itemId(itemId)
                .dealType(DiscountDealType.PERCENTAGE)
                .discountPercent(BigDecimal.ZERO)
                .build();
    }

    private boolean isSameItemDeal(DiscountPlan plan) {
        return plan.getDealType() != DiscountDealType.BOGO || plan.getGiftItem() == null;
    }

    /** Ranks mixed PERCENTAGE/BOGO plans by an equivalent-percent heuristic (BOGO free/(buy+free)*100). */
    private DiscountPlan bestPlan(List<DiscountPlan> plans) {
        return plans.stream()
                .max(Comparator.comparing(this::effectivePercent))
                .orElseThrow();
    }

    private BigDecimal effectivePercent(DiscountPlan plan) {
        if (plan.getDealType() == DiscountDealType.BOGO) {
            int buy = plan.getBuyQuantity() != null ? plan.getBuyQuantity() : 0;
            int free = plan.getFreeQuantity() != null ? plan.getFreeQuantity() : 0;
            int group = buy + free;
            if (group <= 0) return BigDecimal.ZERO;
            return BigDecimal.valueOf(free).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(group), 4, java.math.RoundingMode.HALF_UP);
        }
        return plan.getDiscountPercent() != null ? plan.getDiscountPercent() : BigDecimal.ZERO;
    }

    private DiscountApplyResponse toApplyResponse(Long itemId, DiscountPlan best) {
        return DiscountApplyResponse.builder()
                .itemId(itemId)
                .dealType(best.getDealType())
                .discountPercent(best.getDiscountPercent())
                .buyQuantity(best.getBuyQuantity())
                .freeQuantity(best.getFreeQuantity())
                .planId(best.getId())
                .planName(best.getPlanName())
                .build();
    }

    private void validatePlanRequest(DiscountPlanType type, Long categoryId, Long itemId) {
        if (type == DiscountPlanType.CATEGORY && categoryId == null) {
            throw new BadRequestException("Cần chọn danh mục cho chiến dịch khuyến mãi theo danh mục");
        }
        if (type == DiscountPlanType.SKU && itemId == null) {
            throw new BadRequestException("Cần chọn sản phẩm cho chiến dịch khuyến mãi theo SKU");
        }
    }

    private void validateDealRequest(DiscountDealType dealType, BigDecimal discountPercent,
            Integer buyQuantity, Integer freeQuantity) {
        if (dealType == DiscountDealType.PERCENTAGE) {
            if (discountPercent == null || discountPercent.compareTo(BigDecimal.ZERO) <= 0
                    || discountPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Giảm % phải trong khoảng 0-100");
            }
        } else if (dealType == DiscountDealType.BOGO) {
            if (buyQuantity == null || buyQuantity < 1) {
                throw new BadRequestException("Số lượng mua (buyQuantity) phải >= 1");
            }
            if (freeQuantity == null || freeQuantity < 1) {
                throw new BadRequestException("Số lượng tặng (freeQuantity) phải >= 1");
            }
        }
    }

    private Category resolveCategory(Long id) {
        if (id == null) return null;
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
    }

    private Item resolveItem(Long id) {
        if (id == null) return null;
        return itemService.findItem(id);
    }

    private DiscountPlan findById(Long id) {
        return discountPlanRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chiến dịch khuyến mãi: " + id));
    }

    private DiscountPlanResponse toResponse(DiscountPlan plan) {
        return DiscountPlanResponse.builder()
                .id(plan.getId())
                .planName(plan.getPlanName())
                .planType(plan.getPlanType())
                .categoryId(plan.getCategory() != null ? plan.getCategory().getId() : null)
                .categoryName(plan.getCategory() != null ? plan.getCategory().getCategoryName() : null)
                .itemId(plan.getItem() != null ? plan.getItem().getId() : null)
                .itemName(plan.getItem() != null ? plan.getItem().getItemName() : null)
                .dealType(plan.getDealType())
                .discountPercent(plan.getDiscountPercent())
                .buyQuantity(plan.getBuyQuantity())
                .freeQuantity(plan.getFreeQuantity())
                .giftItemId(plan.getGiftItem() != null ? plan.getGiftItem().getId() : null)
                .giftItemName(plan.getGiftItem() != null ? plan.getGiftItem().getItemName() : null)
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .active(plan.isActive())
                .status(computeStatus(plan))
                .createdAt(plan.getCreatedAt())
                .build();
    }

    private String computeStatus(DiscountPlan plan) {
        if (!plan.isActive()) return "DISABLED";
        LocalDate today = LocalDate.now();
        if (plan.getStartDate() != null && plan.getStartDate().isAfter(today)) return "SCHEDULED";
        if (plan.getEndDate() != null && plan.getEndDate().isBefore(today)) return "EXPIRED";
        return "RUNNING";
    }
}
