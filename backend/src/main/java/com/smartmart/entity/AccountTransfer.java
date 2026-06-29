package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "account_transfers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountTransfer extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_account_id", nullable = false)
    private CashAccount fromAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_account_id", nullable = false)
    private CashAccount toAccount;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "transfer_date", nullable = false)
    private LocalDate transferDate;

    @Column(length = 500)
    private String note;

    @Column(name = "created_by")
    private Long createdBy;
}
