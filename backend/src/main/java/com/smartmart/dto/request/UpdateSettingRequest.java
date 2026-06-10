package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSettingRequest {

    @NotBlank
    private String value;

    private String description;
}
