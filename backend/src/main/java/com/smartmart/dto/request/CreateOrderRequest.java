package com.smartmart.dto.request;

import com.smartmart.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateOrderRequest {
    private String customerName;
    private PaymentMethod paymentMethod;
    private String note;
    @NotEmpty
    @Valid
    private List<OrderLineRequest> items;
}
