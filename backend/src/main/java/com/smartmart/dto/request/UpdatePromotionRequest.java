package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UpdatePromotionRequest {
    private String name;
    private String code;
    private String type;
    private BigDecimal value;
    private BigDecimal minOrder;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;

    /** null = giữ nguyên; -1 = xoá giới hạn (không giới hạn); số dương = đặt giới hạn mới. */
    private Integer maxUsage;

    /** null = giữ nguyên; -1 = xoá giới hạn; số dương = đặt giới hạn mới. */
    private Integer maxPerCustomer;

    private Boolean stackable;
}
