package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "supplier_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_supplier_items_supplier_sku",
                columnNames = {"supplier_id", "sku_item"}
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierItem extends LongAuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "sku_item", nullable = false)
    private String skuItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "sku_item",
            referencedColumnName = "item_code",
            insertable = false,
            updatable = false
    )
    private Item item;

    @Column(name = "default_cost_price")
    private BigDecimal defaultCostPrice;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
