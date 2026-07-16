package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateDiscountPlanRequest;
import com.smartmart.dto.request.UpdateDiscountPlanRequest;
import com.smartmart.dto.response.DiscountApplyResponse;
import com.smartmart.dto.response.DiscountPlanResponse;
import com.smartmart.entity.Category;
import com.smartmart.entity.DiscountPlan;
import com.smartmart.entity.Item;
import com.smartmart.enums.DiscountPlanType;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CategoryRepository;
import com.smartmart.repository.DiscountPlanRepository;
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

    public DiscountPlanServiceImpl(
            DiscountPlanRepository discountPlanRepository,
            ItemService itemService,
            CategoryRepository categoryRepository) {
        this.discountPlanRepository = discountPlanRepository;
        this.itemService = itemService;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public DiscountPlanResponse create(CreateDiscountPlanRequest request) {
        validatePlanRequest(request.getPlanType(), request.getCategoryId(), request.getItemId());
        DiscountPlan plan = DiscountPlan.builder()
                .planName(request.getPlanName().trim())
                .planType(request.getPlanType())
                .category(resolveCategory(request.getCategoryId()))
                .item(resolveItem(request.getItemId()))
                .discountPercent(request.getDiscountPercent())
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
        if (request.getDiscountPercent() != null) {
            plan.setDiscountPercent(request.getDiscountPercent());
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
    @Transactional(readOnly = true)
    public List<DiscountPlanResponse> listAll() {
        return discountPlanRepository.findAllActiveToday(LocalDate.now()).stream()
                .map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DiscountApplyResponse applyForItem(Long itemId) {
        Item item = itemService.findItem(itemId);
        LocalDate today = LocalDate.now();

        List<DiscountPlan> skuPlans = discountPlanRepository.findActiveByType(DiscountPlanType.SKU, today).stream()
                .filter(p -> p.getItem() != null && p.getItem().getId().equals(itemId))
                .toList();
        if (!skuPlans.isEmpty()) {
            DiscountPlan best = skuPlans.stream()
                    .max(Comparator.comparing(DiscountPlan::getDiscountPercent))
                    .orElseThrow();
            return DiscountApplyResponse.builder()
                    .itemId(itemId)
                    .discountPercent(best.getDiscountPercent())
                    .planId(best.getId())
                    .planName(best.getPlanName())
                    .build();
        }

        if (item.getCategory() != null) {
            List<DiscountPlan> categoryPlans = discountPlanRepository
                    .findActiveByType(DiscountPlanType.CATEGORY, today).stream()
                    .filter(p -> p.getCategory() != null
                            && p.getCategory().getId().equals(item.getCategory().getId()))
                    .toList();
            if (!categoryPlans.isEmpty()) {
                DiscountPlan best = categoryPlans.stream()
                        .max(Comparator.comparing(DiscountPlan::getDiscountPercent))
                        .orElseThrow();
                return DiscountApplyResponse.builder()
                        .itemId(itemId)
                        .discountPercent(best.getDiscountPercent())
                        .planId(best.getId())
                        .planName(best.getPlanName())
                        .build();
            }
        }

        return DiscountApplyResponse.builder()
                .itemId(itemId)
                .discountPercent(BigDecimal.ZERO)
                .build();
    }

    private void validatePlanRequest(DiscountPlanType type, Long categoryId, Long itemId) {
        if (type == DiscountPlanType.CATEGORY && categoryId == null) {
            throw new BadRequestException("Cần chọn danh mục cho kế hoạch giảm giá theo danh mục");
        }
        if (type == DiscountPlanType.SKU && itemId == null) {
            throw new BadRequestException("Cần chọn sản phẩm cho kế hoạch giảm giá theo SKU");
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
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch giảm giá: " + id));
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
                .discountPercent(plan.getDiscountPercent())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .active(plan.isActive())
                .createdAt(plan.getCreatedAt())
                .build();
    }
}
