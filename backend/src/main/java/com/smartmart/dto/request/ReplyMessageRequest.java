package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReplyMessageRequest {
    @NotNull
    private Long conversationId;

    @NotNull
    private Long replyToMessageId;

    @NotBlank
    private String content;
}
