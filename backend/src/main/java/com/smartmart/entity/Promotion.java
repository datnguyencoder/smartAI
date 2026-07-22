package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Promotion extends LongAuditableEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "\"value\"", nullable = false)
    private BigDecimal value;

    @Column(name = "min_order", nullable = false)
    private BigDecimal minOrder = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Tổng số lần được dùng — null = không giới hạn. */
    @Column(name = "max_usage")
    private Integer maxUsage;

    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private Integer usageCount = 0;

    /** Số lần tối đa mỗi khách được dùng mã này — null = không giới hạn. */
    @Column(name = "max_per_customer")
    private Integer maxPerCustomer;

    /** false = không cho cộng dồn với discount_plan tự động đang áp dụng trên đơn. */
    @Column(name = "stackable", nullable = false)
    @Builder.Default
    private boolean stackable = true;
}
