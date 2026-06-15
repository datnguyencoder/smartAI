package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.StocktakeStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stocktakes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Stocktake extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "stocktake_date", nullable = false)
    private LocalDateTime stocktakeDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StocktakeStatus status;

    private String note;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @OneToMany(mappedBy = "stocktake", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StocktakeItem> items = new ArrayList<>();
}
