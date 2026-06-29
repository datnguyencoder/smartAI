package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.StockTransferOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stock_transfer_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransferOrder extends LongAuditableEntity {

    @Column(name = "transfer_code", nullable = false, unique = true)
    private String transferCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_location_id", nullable = false)
    private Location fromLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_location_id", nullable = false)
    private Location toLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StockTransferOrderStatus status = StockTransferOrderStatus.DRAFT;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(length = 500)
    private String note;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @OneToMany(mappedBy = "transferOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StockTransferOrderItem> items = new ArrayList<>();
}
