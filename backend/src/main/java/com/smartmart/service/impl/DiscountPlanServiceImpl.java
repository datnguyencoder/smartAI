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
import java.time.LocalTime;
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
        validateDealRequest(dealType, request.getDiscountPercent(), request.getBuyQuantity(),
                request.getFreeQuantity(), request.getFixedAmount());
        if (request.getStartDate() != null && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
        }
        Integer minQuantity = request.getMinQuantity() != null ? request.getMinQuantity() : 1;
        if (minQuantity < 1) {
            throw new BadRequestException("Số lượng tối thiểu phải >= 1");
        }
        validateTimeWindow(request.getStartTime(), request.getEndTime());
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
                .fixedAmount(dealType == DiscountDealType.FIXED_AMOUNT ? request.getFixedAmount() : null)
                .giftItem(giftItem)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(true)
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .minQuantity(minQuantity)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxUsage(request.getMaxUsage())
                .usageCount(0)
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
                validateDealRequest(DiscountDealType.BOGO, null, buyQty, freeQty, null);
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
        } else if (plan.getDealType() == DiscountDealType.FIXED_AMOUNT) {
            if (request.getFixedAmount() != null) {
                validateDealRequest(DiscountDealType.FIXED_AMOUNT, null, null, null, request.getFixedAmount());
                plan.setFixedAmount(request.getFixedAmount());
            }
        } else if (request.getDiscountPercent() != null) {
            validateDealRequest(DiscountDealType.PERCENTAGE, request.getDiscountPercent(), null, null, null);
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
        if (request.getPriority() != null) {
            plan.setPriority(request.getPriority());
        }
        if (request.getMinQuantity() != null) {
            if (request.getMinQuantity() < 1) {
                throw new BadRequestException("Số lượng tối thiểu phải >= 1");
            }
            plan.setMinQuantity(request.getMinQuantity());
        }
        if (Boolean.TRUE.equals(request.getClearTimeWindow())) {
            plan.setStartTime(null);
            plan.setEndTime(null);
        } else if (request.getStartTime() != null || request.getEndTime() != null) {
            LocalTime effectiveStartTime = request.getStartTime() != null ? request.getStartTime() : plan.getStartTime();
            LocalTime effectiveEndTime = request.getEndTime() != null ? request.getEndTime() : plan.getEndTime();
            validateTimeWindow(effectiveStartTime, effectiveEndTime);
            plan.setStartTime(effectiveStartTime);
            plan.setEndTime(effectiveEndTime);
        }
        if (request.getMaxUsage() != null) {
            plan.setMaxUsage(request.getMaxUsage() == -1 ? null : request.getMaxUsage());
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
                .filter(this::isWithinTimeWindow)
                .filter(this::hasUsageLeft)
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
                    .filter(this::isWithinTimeWindow)
                    .filter(this::hasUsageLeft)
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

    /**
     * Chọn plan thắng khi nhiều plan cùng khớp 1 sản phẩm: ưu tiên priority cao hơn trước,
     * priority bằng nhau mới so effectivePercent (heuristic BOGO free/(buy+free)*100).
     */
    private DiscountPlan bestPlan(List<DiscountPlan> plans) {
        return plans.stream()
                .max(Comparator.comparing((DiscountPlan p) -> p.getPriority() != null ? p.getPriority() : 0)
                        .thenComparing(this::effectivePercent))
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
                .fixedAmount(best.getFixedAmount())
                .minQuantity(best.getMinQuantity() != null ? best.getMinQuantity() : 1)
                .planId(best.getId())
                .planName(best.getPlanName())
                .build();
    }

    @Override
    public void recordUsage(Long planId) {
        if (planId == null) return;
        DiscountPlan plan = findById(planId);
        plan.setUsageCount((plan.getUsageCount() != null ? plan.getUsageCount() : 0) + 1);
        discountPlanRepository.save(plan);
    }

    private void validateTimeWindow(LocalTime startTime, LocalTime endTime) {
        if ((startTime == null) != (endTime == null)) {
            throw new BadRequestException("Cần nhập cả giờ bắt đầu và giờ kết thúc cho Flash Sale");
        }
        if (startTime != null && !startTime.isBefore(endTime)) {
            throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu");
        }
    }

    /** Flash Sale: plan chỉ áp dụng trong khung giờ [startTime, endTime) mỗi ngày nếu được cấu hình. */
    private boolean isWithinTimeWindow(DiscountPlan plan) {
        if (plan.getStartTime() == null || plan.getEndTime() == null) {
            return true;
        }
        LocalTime now = LocalTime.now();
        return !now.isBefore(plan.getStartTime()) && now.isBefore(plan.getEndTime());
    }

    private boolean hasUsageLeft(DiscountPlan plan) {
        return plan.getMaxUsage() == null
                || plan.getUsageCount() == null
                || plan.getUsageCount() < plan.getMaxUsage();
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
            Integer buyQuantity, Integer freeQuantity, BigDecimal fixedAmount) {
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
        } else if (dealType == DiscountDealType.FIXED_AMOUNT) {
            if (fixedAmount == null || fixedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Số tiền giảm (fixedAmount) phải > 0");
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
                .priority(plan.getPriority())
                .minQuantity(plan.getMinQuantity())
                .fixedAmount(plan.getFixedAmount())
                .startTime(plan.getStartTime())
                .endTime(plan.getEndTime())
                .maxUsage(plan.getMaxUsage())
                .usageCount(plan.getUsageCount())
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
