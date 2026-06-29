package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.HeldOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "held_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeldOrder extends LongAuditableEntity {

    @Column(name = "hold_code", nullable = false, unique = true)
    private String holdCode;

    @Column(name = "cashier_id")
    private Long cashierId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone", length = 32)
    private String customerPhone;

    @Column(name = "promotion_code")
    private String promotionCode;

    @Column(name = "loyalty_points_redeemed")
    private Integer loyaltyPointsRedeemed;

    @Column(name = "subtotal_amount", nullable = false)
    @Builder.Default
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "note", length = 500)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HeldOrderStatus status = HeldOrderStatus.ACTIVE;

    @OneToMany(mappedBy = "heldOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<HeldOrderItem> items = new ArrayList<>();
}
