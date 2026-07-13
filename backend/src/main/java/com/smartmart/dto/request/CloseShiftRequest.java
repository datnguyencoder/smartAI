package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CloseShiftRequest {
    @NotNull(message = "Vui lòng nhập số tiền mặt thực tế kiểm đếm cuối ca")
    @DecimalMin(value = "0.00")
    private BigDecimal closingCash;
    private Boolean matchesSystemData;
    private String varianceReason;
    @NotBlank
    private String note;
}
