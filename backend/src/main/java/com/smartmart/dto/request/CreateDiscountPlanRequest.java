package com.smartmart.dto.request;

import com.smartmart.enums.DiscountDealType;
import com.smartmart.enums.DiscountPlanType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

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
}
