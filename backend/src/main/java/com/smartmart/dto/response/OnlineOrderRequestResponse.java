package com.smartmart.dto.response;

import com.smartmart.enums.OnlineOrderRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class OnlineOrderRequestResponse {
    private Long id;
    private String requestCode;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private OnlineOrderRequestStatus status;
    private BigDecimal totalAmount;
    private String note;
    private LocalDateTime createdAt;
}
