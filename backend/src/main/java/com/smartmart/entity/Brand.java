package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "brands")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Brand extends LongAuditableEntity {

    @Column(name = "brand_name", nullable = false, unique = true)
    private String brandName;

    @Column(length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
