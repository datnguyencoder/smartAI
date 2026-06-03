package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReceivePurchaseRequest {
    @NotEmpty
    @Valid
    private List<ReceiveLineRequest> lines;
}
