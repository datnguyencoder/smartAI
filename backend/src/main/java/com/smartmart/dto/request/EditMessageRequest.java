package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EditMessageRequest {
    @NotBlank
    private String content;
}
