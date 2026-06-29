package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PartialReceivePurchaseRequest {
    @NotEmpty
    @Valid
    private List<PartialReceiveLineRequest> items;
}
