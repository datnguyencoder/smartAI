package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "model_training_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelTrainingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model_type", nullable = false)
    private String modelType;

    private BigDecimal mae;
    private BigDecimal rmse;
    private BigDecimal mape;

    @Column(name = "trained_at", nullable = false)
    private LocalDateTime trainedAt;

    @Column(name = "per_item_model_types", columnDefinition = "TEXT")
    private String perItemModelTypes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (trainedAt == null) trainedAt = LocalDateTime.now();
    }
}
