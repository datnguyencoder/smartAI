package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.FinanceTransactionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "finance_categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceCategory extends LongAuditableEntity {

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinanceTransactionType type;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
