package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.OnlineOrderRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "online_order_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlineOrderRequest extends LongAuditableEntity {

    @Column(name = "request_code", nullable = false, unique = true)
    private String requestCode;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone", length = 32)
    private String customerPhone;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OnlineOrderRequestStatus status = OnlineOrderRequestStatus.NEW;

    @Column(name = "total_amount", nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String note;
}
