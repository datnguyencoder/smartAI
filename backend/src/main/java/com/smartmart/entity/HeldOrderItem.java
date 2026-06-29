package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "held_order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeldOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "held_order_id", nullable = false)
    private HeldOrder heldOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal subtotal;
}
