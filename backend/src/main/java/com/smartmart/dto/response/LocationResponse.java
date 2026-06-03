package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LocationResponse {
    private Long id;
    private String locationName;
    private String locationType;
    private Long parentId;
    private boolean active;
}
