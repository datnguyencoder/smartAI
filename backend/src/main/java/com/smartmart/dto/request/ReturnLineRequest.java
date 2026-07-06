package com.smartmart.dto.request;

import com.smartmart.enums.ReturnHandlingAction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ReturnLineRequest {
    @NotNull
    private Long itemId;
    private Long lotId;
    @NotNull
    @Positive
    private BigDecimal quantity;
    @NotNull
    private ReturnHandlingAction handlingAction;
}
