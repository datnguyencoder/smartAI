package com.smartmart.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateSupplierItemRequest {
    @Positive
    BigDecimal defaultCostPrice;
}
