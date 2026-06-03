package com.smartmart.entity;

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
public class ForecastResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_training_id")
    private ModelTrainingHistory modelTraining;

    @Column(name = "forecast_date", nullable = false)
    private LocalDateTime forecastDate;

    @Column(name = "predicted_quantity", nullable = false)
    private BigDecimal predictedQuantity;

    @Column(name = "confidence_level")
    private BigDecimal confidenceLevel;

    @Column(name = "horizon_days")
    private Integer horizonDays;

    @Column(name = "predicted_qty_7d")
    private BigDecimal predictedQty7d;

    @Column(name = "predicted_qty_14d")
    private BigDecimal predictedQty14d;

    @Column(name = "predicted_qty_30d")
    private BigDecimal predictedQty30d;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (forecastDate == null) forecastDate = LocalDateTime.now();
    }
}
