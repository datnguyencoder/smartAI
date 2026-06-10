package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SettingResponse {
    private Long id;
    private String key;
    private String value;
    private String description;
}
