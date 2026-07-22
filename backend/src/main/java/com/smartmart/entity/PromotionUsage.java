package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "promotion_usages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionUsage extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "discount_amount", nullable = false)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;
}
