package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

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
    private Integer priority;
    private Integer minQuantity;
    private BigDecimal fixedAmount;
    private LocalTime startTime;
    private LocalTime endTime;
    /** null = giữ nguyên; -1 = xoá giới hạn; số dương = đặt giới hạn mới. */
    private Integer maxUsage;
    /** true = xoá khung giờ Flash Sale, quay lại áp dụng cả ngày. */
    private Boolean clearTimeWindow;
}
