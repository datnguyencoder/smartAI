package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class CreateReturnOrderRequest {
    @NotNull
    private Long originalOrderId;
    @NotBlank(message = "Lý do trả hàng không được để trống")
    private String reason;
    private String note;
    @NotEmpty
    @Valid
    private List<ReturnLineRequest> items;
}
