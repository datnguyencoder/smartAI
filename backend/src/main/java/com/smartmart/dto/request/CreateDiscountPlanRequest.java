package com.smartmart.dto.request;

import com.smartmart.enums.DiscountDealType;
import com.smartmart.enums.DiscountPlanType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CreateDiscountPlanRequest {
    @NotBlank
    private String planName;

    @NotNull
    private DiscountPlanType planType;

    private Long categoryId;
    private Long itemId;

    private DiscountDealType dealType;

    private BigDecimal discountPercent;

    private Integer buyQuantity;
    private Integer freeQuantity;

    /** Sản phẩm được tặng — để trống nghĩa là tặng chính sản phẩm/danh mục đang mua. */
    private Long giftItemId;

    private LocalDate startDate;
    private LocalDate endDate;

    /** Ưu tiên khi nhiều plan cùng khớp 1 sản phẩm — cao hơn thắng. Mặc định 0. */
    private Integer priority;

    /** Số lượng tối thiểu phải mua thì plan mới áp dụng. Mặc định 1. */
    private Integer minQuantity;

    /** Số tiền giảm cố định — bắt buộc khi dealType = FIXED_AMOUNT. */
    private BigDecimal fixedAmount;

    /** Flash Sale — chỉ áp dụng trong khung giờ này mỗi ngày. Để trống = áp dụng cả ngày. */
    private LocalTime startTime;
    private LocalTime endTime;

    /** Tổng số lần được áp dụng — để trống = không giới hạn. */
    private Integer maxUsage;
}
