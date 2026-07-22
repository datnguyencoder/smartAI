package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.DiscountDealType;
import com.smartmart.enums.DiscountPlanType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "discount_plans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountPlan extends LongAuditableEntity {

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false)
    private DiscountPlanType planType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @Enumerated(EnumType.STRING)
    @Column(name = "deal_type", nullable = false)
    @Builder.Default
    private DiscountDealType dealType = DiscountDealType.PERCENTAGE;

    @Column(name = "discount_percent")
    private BigDecimal discountPercent;

    @Column(name = "buy_quantity")
    private Integer buyQuantity;

    @Column(name = "free_quantity")
    private Integer freeQuantity;

    /** Sản phẩm được TẶNG khi BOGO — null nghĩa là tặng chính sản phẩm/danh mục đang mua. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gift_item_id")
    private Item giftItem;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    /** Ưu tiên khi nhiều plan cùng khớp 1 sản phẩm (SKU vs CATEGORY) — cao hơn thắng. */
    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0;
}
