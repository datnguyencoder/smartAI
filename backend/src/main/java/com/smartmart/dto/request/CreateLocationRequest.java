package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateLocationRequest {
    @NotBlank
    private String locationName;
    private String locationType;
    private Long parentId;
}
