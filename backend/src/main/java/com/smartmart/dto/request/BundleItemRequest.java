package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BundleItemRequest {
    @NotNull
    private Long itemId;

    private Integer requiredQty;
}
