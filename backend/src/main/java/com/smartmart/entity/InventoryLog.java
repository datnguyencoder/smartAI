package com.smartmart.entity;

import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private ItemLot lot;

    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type")
    private ReferenceType referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private InventoryActionType actionType;

    @Column(name = "quantity_before", nullable = false)
    private BigDecimal quantityBefore;

    @Column(name = "quantity_change", nullable = false)
    private BigDecimal quantityChange;

    @Column(name = "quantity_after", nullable = false)
    private BigDecimal quantityAfter;

    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
