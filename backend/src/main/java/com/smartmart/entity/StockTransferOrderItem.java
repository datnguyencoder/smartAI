package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "stock_transfer_order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransferOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_order_id", nullable = false)
    private StockTransferOrder transferOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private ItemLot lot;

    @Column(nullable = false)
    private BigDecimal quantity;
}
