package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UpdateDiscountPlanRequest {
    private String planName;
    private BigDecimal discountPercent;
    private Integer buyQuantity;
    private Integer freeQuantity;
    /** Đổi sản phẩm tặng. Gửi 0 để xoá về mặc định (tặng chính sản phẩm/danh mục đang mua). */
    private Long giftItemId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
}
