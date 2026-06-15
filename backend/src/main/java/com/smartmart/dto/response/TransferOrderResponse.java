package com.smartmart.dto.response;

import com.smartmart.enums.TransferStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class TransferOrderResponse {
    private Long id;
    private Long fromLocationId;
    private String fromLocationName;
    private Long toLocationId;
    private String toLocationName;
    private Long createdBy;
    private LocalDateTime transferDate;
    private TransferStatus status;
    private String note;
    private LocalDateTime completedAt;
    private List<TransferOrderItemResponse> items;
}
