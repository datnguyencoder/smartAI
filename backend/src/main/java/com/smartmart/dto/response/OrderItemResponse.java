package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class OrderItemResponse {
    private Long itemId;
    private String itemName;
    private Long lotId;
    private String lotNumber;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    /** Số tiền giảm áp riêng trên dòng này (BOGO / quà tặng kèm) — 0 nếu không có. */
    private BigDecimal discountAmount;
    /** Lý do giảm giá dòng này để hiện lên UI/hoá đơn, vd "Mua 2 tặng 1". Null nếu không có. */
    private String discountReason;
}
