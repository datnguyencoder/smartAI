package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Promotion extends LongAuditableEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "\"value\"", nullable = false)
    private BigDecimal value;

    @Column(name = "min_order", nullable = false)
    private BigDecimal minOrder = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
