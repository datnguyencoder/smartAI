package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "reorder_recommendations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderRecommendation extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "suggested_qty", nullable = false)
    private BigDecimal suggestedQty;

    @Column(name = "current_available", nullable = false)
    private BigDecimal currentAvailable;

    @Column(name = "predicted_demand_7d")
    private BigDecimal predictedDemand7d;

    @Column(name = "risk_level", nullable = false)
    private String riskLevel;

    private String reason;

    @Column(nullable = false)
    private String source = "AI";

    @Column(nullable = false)
    private String status = "ACTIVE";
}
