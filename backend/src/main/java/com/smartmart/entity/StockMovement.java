package com.smartmart.entity;

import com.smartmart.common.base.BaseEntity;
import com.smartmart.enums.MovementType;
import com.smartmart.enums.ReferenceType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "stock_movements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType type;

    private String reason;

    private UUID referenceId;

    @Enumerated(EnumType.STRING)
    private ReferenceType referenceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
