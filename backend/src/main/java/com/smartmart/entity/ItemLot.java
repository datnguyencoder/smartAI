package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "item_lots", uniqueConstraints = @UniqueConstraint(columnNames = {"item_id", "lot_number"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemLot extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "lot_number", nullable = false)
    private String lotNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;
}
