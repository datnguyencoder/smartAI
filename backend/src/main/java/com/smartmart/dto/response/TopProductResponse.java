package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class TopProductResponse {
    private Long itemId;
    private String itemCode;
    private String itemName;
    private BigDecimal quantitySold;
    private BigDecimal revenue;
}
