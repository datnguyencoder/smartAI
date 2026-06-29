package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateOnlineOrderRequestRequest {
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private BigDecimal totalAmount;
    private String note;
}
