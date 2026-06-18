package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "promotion_recommendations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRecommendation extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "discount_percent", nullable = false)
    private BigDecimal discountPercent;

    private String reason;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "promotion_id")
    private Long promotionId;

    @Column(name = "promotion_code")
    private String promotionCode;
}
