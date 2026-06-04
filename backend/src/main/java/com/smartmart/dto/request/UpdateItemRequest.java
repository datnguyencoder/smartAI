package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateItemRequest {
    private String itemName;
    private String itemType;
    private Long categoryId;
    private Long baseUomId;
    private Long purchaseUomId;
    @DecimalMin("0")
    private BigDecimal costPrice;
    @DecimalMin("0")
    private BigDecimal sellingPrice;
    private Integer minimumStock;
    private Boolean hasExpiry;
    private Boolean active;
    private String imageUrl;
}
