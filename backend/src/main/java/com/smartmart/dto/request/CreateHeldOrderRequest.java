package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateHeldOrderRequest {
    private String customerName;
    private String customerPhone;
    private String promotionCode;
    private Integer loyaltyPointsRedeemed;
    private String note;

    @NotEmpty
    @Valid
    private List<OrderLineRequest> items;
}
