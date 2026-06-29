package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PartialReceiveLineRequest {
    @NotNull
    private Long purchaseOrderItemId;

    @NotNull
    @Positive
    private BigDecimal quantity;
}
