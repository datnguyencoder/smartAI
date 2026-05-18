package com.smartmart.model;

import com.smartmart.common.base.BaseEntity;
import com.smartmart.enums.ModelType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "forecast_results")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastResult extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDateTime forecastDate;

    @Column(nullable = false)
    private BigDecimal predictedQuantity;

    private BigDecimal confidenceLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModelType modelType;

    @Column(columnDefinition = "TEXT")
    private String parametersUsed;
}
