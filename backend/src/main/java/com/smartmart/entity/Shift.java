package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.ShiftStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shift extends LongAuditableEntity {

    @Column(name = "cashier_id", nullable = false)
    private Long cashierId;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "opening_cash", nullable = false)
    private BigDecimal openingCash;

    @Column(name = "closing_cash")
    private BigDecimal closingCash;

    @Column(name = "expected_cash")
    private BigDecimal expectedCash;

    @Column(name = "cash_variance")
    private BigDecimal cashVariance;

    @Column(name = "total_orders", nullable = false)
    private Integer totalOrders;

    @Column(name = "total_revenue", nullable = false)
    private BigDecimal totalRevenue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftStatus status;

    private String note;
}
