package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BundleItemResponse {
    private Long itemId;
    private String itemName;
    private Integer requiredQty;
}
