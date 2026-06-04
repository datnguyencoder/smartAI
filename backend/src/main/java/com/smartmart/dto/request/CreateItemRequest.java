package com.smartmart.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateItemRequest {
    @NotBlank
    private String itemCode;
    @NotBlank
    private String itemName;
    private String itemType;
    private Long categoryId;
    @NotNull
    private Long baseUomId;
    private Long purchaseUomId;
    @NotNull
    @DecimalMin("0")
    private BigDecimal costPrice;
    @NotNull
    @DecimalMin("0")
    private BigDecimal sellingPrice;
    private Integer minimumStock = 0;
    private boolean hasExpiry;
    private String imageUrl;
}
