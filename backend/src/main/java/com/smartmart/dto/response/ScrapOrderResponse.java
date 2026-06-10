package com.smartmart.dto.response;

import com.smartmart.enums.ScrapStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ScrapOrderResponse {
    private Long id;
    private Long locationId;
    private String locationName;
    private Long createdBy;
    private LocalDateTime scrapDate;
    private ScrapStatus status;
    private String note;
    private List<ScrapOrderItemResponse> items;
}
