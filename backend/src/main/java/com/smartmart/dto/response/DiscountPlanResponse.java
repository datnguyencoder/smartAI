package com.smartmart.dto.response;

import com.smartmart.enums.DiscountDealType;
import com.smartmart.enums.DiscountPlanType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class DiscountPlanResponse {
    private Long id;
    private String planName;
    private DiscountPlanType planType;
    private Long categoryId;
    private String categoryName;
    private Long itemId;
    private String itemName;
    private DiscountDealType dealType;
    private BigDecimal discountPercent;
    private Integer buyQuantity;
    private Integer freeQuantity;
    private Long giftItemId;
    private String giftItemName;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private Integer priority;
    private Integer minQuantity;
    private BigDecimal fixedAmount;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer maxUsage;
    private Integer usageCount;
    private List<BundleItemResponse> bundleItems;
    private String customerSegment;
    /** SCHEDULED (chưa tới ngày bắt đầu) | RUNNING (đang chạy) | EXPIRED (đã qua endDate) | DISABLED (active=false). */
    private String status;
    private LocalDateTime createdAt;
}
