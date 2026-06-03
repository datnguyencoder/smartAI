package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Item extends LongAuditableEntity {

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "item_code", nullable = false, unique = true)
    private String itemCode;

    @Column(name = "item_type")
    private String itemType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_uom_id", nullable = false)
    private Uom baseUom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_uom_id")
    private Uom purchaseUom;

    @Column(name = "cost_price", nullable = false)
    private BigDecimal costPrice;

    @Column(name = "selling_price", nullable = false)
    private BigDecimal sellingPrice;

    @Column(name = "minimum_stock", nullable = false)
    private Integer minimumStock;

    @Column(name = "has_expiry", nullable = false)
    private boolean hasExpiry;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
