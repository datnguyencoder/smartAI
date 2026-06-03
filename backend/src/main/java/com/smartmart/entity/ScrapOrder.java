package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.ScrapStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "scrap_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapOrder extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "scrap_date", nullable = false)
    private LocalDateTime scrapDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScrapStatus status;

    private String note;

    @OneToMany(mappedBy = "scrapOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ScrapOrderItem> items = new ArrayList<>();
}
