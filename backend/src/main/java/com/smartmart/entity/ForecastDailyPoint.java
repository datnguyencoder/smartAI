package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "forecast_daily_points")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastDailyPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forecast_result_id", nullable = false)
    private ForecastResult forecastResult;

    @Column(name = "point_date", nullable = false)
    private LocalDate pointDate;

    @Column(name = "predicted_qty", nullable = false)
    private BigDecimal predictedQty;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
