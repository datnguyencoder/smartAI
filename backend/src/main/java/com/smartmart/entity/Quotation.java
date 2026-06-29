package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.QuotationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quotation extends LongAuditableEntity {

    @Column(name = "quote_code", nullable = false, unique = true)
    private String quoteCode;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone", length = 32)
    private String customerPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QuotationStatus status = QuotationStatus.DRAFT;

    @Column(name = "subtotal_amount", nullable = false)
    private BigDecimal subtotalAmount;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(length = 500)
    private String note;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "converted_order_id")
    private Long convertedOrderId;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuotationItem> items = new ArrayList<>();
}
