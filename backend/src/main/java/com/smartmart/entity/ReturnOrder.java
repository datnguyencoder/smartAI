package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.ReturnOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "return_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnOrder extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_order_id", nullable = false)
    private Order originalOrder;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "return_date", nullable = false)
    private LocalDateTime returnDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnOrderStatus status;

    private String reason;

    @Column(name = "refund_amount", nullable = false)
    private BigDecimal refundAmount;

    private String note;

    @OneToMany(mappedBy = "returnOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReturnOrderItem> items = new ArrayList<>();
}
