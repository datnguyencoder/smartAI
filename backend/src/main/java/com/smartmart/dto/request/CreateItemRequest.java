package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateItemRequest {
    @NotBlank
    @Size(max = 50)
    @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9._-]*$", message = "Mã SKU chỉ gồm chữ, số, dấu gạch ngang, gạch dưới hoặc dấu chấm")
    private String itemCode;
    @NotBlank
    @Size(max = 150)
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
    @DecimalMin("1")
    private BigDecimal purchaseConversionRatio;
}
