package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "current_inventory")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentInventory extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private ItemLot lot;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "reserved_quantity", nullable = false)
    private BigDecimal reservedQuantity;
}
