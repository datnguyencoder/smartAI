package com.smartmart.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SupplierItemResponse {
    Long id;
    Long supplierId;
    String supplierName;
    Long itemId;
    String itemName;
    String skuItem;
    BigDecimal defaultCostPrice;
    boolean active;
}
