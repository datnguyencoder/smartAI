package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private ItemLot lot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal subtotal;

    /** Số tiền giảm áp trên CHÍNH dòng này (BOGO tặng cùng SP, hoặc là SP quà tặng kèm). */
    @Column(name = "discount_amount")
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /** Lý do giảm giá dòng này, hiện lên hoá đơn — vd "Mua 2 tặng 1", "Quà tặng kèm". Null nếu không có. */
    @Column(name = "discount_reason", length = 120)
    private String discountReason;

    @Column(name = "category_id_at_sale")
    private Long categoryIdAtSale;

    @Column(name = "category_name_at_sale", length = 100)
    private String categoryNameAtSale;
}
