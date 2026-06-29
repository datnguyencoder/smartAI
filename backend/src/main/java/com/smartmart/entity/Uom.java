package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "uoms")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Uom extends LongAuditableEntity {

    @Column(name = "uom_name", nullable = false)
    private String uomName;

    private String category; // nhóm đo lường

    @Column(name = "conversion_ratio", nullable = false)
    private BigDecimal conversionRatio; // tỷ lệ mặc định/gợi ý

    @Column(name = "is_base_unit", nullable = false)
    private boolean baseUnit;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

}
