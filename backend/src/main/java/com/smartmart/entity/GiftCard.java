package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.GiftCardStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "gift_cards")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiftCard extends LongAuditableEntity {

    @Column(name = "card_code", nullable = false, unique = true)
    private String cardCode;

    @Column(name = "initial_balance", nullable = false)
    private BigDecimal initialBalance;

    @Column(name = "current_balance", nullable = false)
    private BigDecimal currentBalance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GiftCardStatus status = GiftCardStatus.ACTIVE;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "expires_at")
    private LocalDate expiresAt;

    @Column(name = "issued_by")
    private Long issuedBy;

    @Column(length = 500)
    private String note;
}
