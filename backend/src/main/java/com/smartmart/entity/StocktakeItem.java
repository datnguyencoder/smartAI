package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "stocktake_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stocktake_id", nullable = false)
    private Stocktake stocktake;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private ItemLot lot;

    @Column(name = "system_quantity", nullable = false)
    private BigDecimal systemQuantity;

    @Column(name = "actual_quantity")
    private BigDecimal actualQuantity;

    private BigDecimal variance;

    private String note;
}
