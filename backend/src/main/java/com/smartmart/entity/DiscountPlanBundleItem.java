package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "discount_plan_bundles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountPlanBundleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private DiscountPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "required_qty", nullable = false)
    @Builder.Default
    private Integer requiredQty = 1;
}
