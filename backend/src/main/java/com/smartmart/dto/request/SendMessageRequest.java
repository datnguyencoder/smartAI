package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {
    @NotNull
    private Long conversationId;

    @NotBlank
    private String content;
}
