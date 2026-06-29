package com.smartmart.dto.response;

import com.smartmart.enums.StockTransferOrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class StockTransferOrderResponse {
    private Long id;
    private String transferCode;
    private Long fromLocationId;
    private String fromLocationName;
    private Long toLocationId;
    private String toLocationName;
    private StockTransferOrderStatus status;
    private String note;
    private Long createdBy;
    private LocalDateTime confirmedAt;
    private LocalDateTime createdAt;
    private List<StockTransferOrderItemResponse> items;
}
