package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateTransferOrderRequest {
    @NotNull
    private Long fromLocationId;
    @NotNull
    private Long toLocationId;
    private String note;
    @NotEmpty
    @Valid
    private List<TransferLineRequest> items;
}
