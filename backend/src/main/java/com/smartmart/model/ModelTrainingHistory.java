package com.smartmart.model;

import com.smartmart.common.base.BaseEntity;
import com.smartmart.enums.ModelType;
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
public class ModelTrainingHistory extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModelType modelType;

    @Column(nullable = false)
    private LocalDateTime trainedAt;

    private BigDecimal accuracyMetric;

    @Column(nullable = false)
    private String status;

    private String filePath;

    @Column(columnDefinition = "TEXT")
    private String logs;
}
