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
    private String uomName; // tên đơn vị

    private String category; // nhóm đơn vị do admin tạo

    @Column(name = "conversion_ratio", nullable = false)
    private BigDecimal conversionRatio; // tỷ lệ chuyển đổi về

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversion_uom_id")
    private Uom conversionUom;


}
