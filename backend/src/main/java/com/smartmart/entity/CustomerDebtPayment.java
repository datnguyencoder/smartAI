package com.smartmart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_debt_payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDebtPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_debt_id", nullable = false)
    private CustomerDebt customerDebt;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @Column(name = "payment_method")
    private String paymentMethod;

    private String note;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
