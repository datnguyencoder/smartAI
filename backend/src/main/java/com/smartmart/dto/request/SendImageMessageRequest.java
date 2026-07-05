package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendImageMessageRequest {
    @NotNull
    private Long conversationId;

    @NotBlank
    private String url;

    private String publicId;
    private String fileType;
    private Long fileSize;
}
