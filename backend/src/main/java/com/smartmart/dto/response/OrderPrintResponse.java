package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OrderPrintResponse {
    private Long id;
    private String orderCode;
    private String customerName;
    private String customerPhone;
    private LocalDateTime orderDate;
    private String staffName;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal vatAmount;
    private BigDecimal vatRate;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String promotionCode;
    private Integer loyaltyPointsRedeemed;
    private Integer loyaltyPointsEarned;
    private Long shiftId;
    private String storeName;
    private String storeAddress;
    private String storePhone;
    private String receiptFooter;
    private String paperWidth;
    private List<PaymentLine> payments;
    private List<PrintLine> items;

    @Getter
    @Builder
    public static class PaymentLine {
        private String paymentMethod;
        private BigDecimal amount;
    }

    @Getter
    @Builder
    public static class PrintLine {
        private String itemCode;
        private String itemName;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        /** Thành tiền GỘP (unitPrice × quantity), chưa trừ giảm giá dòng — dùng để gạch ngang khi có KM. */
        private BigDecimal lineTotal;
        /** Số tiền giảm riêng trên dòng này (BOGO / quà tặng kèm) — 0 nếu không có. */
        private BigDecimal discountAmount;
        /** Lý do giảm giá dòng này, vd "Mua 2 tặng 1", "Quà tặng kèm". Null nếu không có. */
        private String discountReason;
        /** Số tiền thực thu cho dòng này = lineTotal - discountAmount. */
        private BigDecimal netAmount;
    }
}
