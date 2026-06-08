package com.smartmart.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@Schema(description = "Sản phẩm / Item")
public class ItemResponse {
    private Long id;
    private String itemCode;
    private String itemName;
    private String itemType;
    private Long categoryId;
    private String categoryName;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private Integer minimumStock;
    private boolean hasExpiry;
    private boolean active;
    private BigDecimal totalAvailableQty;
    private BigDecimal soldQty;
    private String imageUrl;
    private Long baseUomId;
    private String baseUomName;
    private Long purchaseUomId;
    private String purchaseUomName;
}
