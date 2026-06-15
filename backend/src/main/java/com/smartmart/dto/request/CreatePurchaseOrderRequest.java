package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreatePurchaseOrderRequest {
    @NotNull
    private Long supplierId;
    @NotNull
    private Long locationId;
    private Boolean paymentDeferred;
    @NotEmpty
    @Valid
    private List<PurchaseLineRequest> items;
}
