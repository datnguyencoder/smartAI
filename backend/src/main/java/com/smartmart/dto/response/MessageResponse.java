package com.smartmart.dto.response;

import com.smartmart.enums.AttachmentType;
import com.smartmart.enums.MessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class MessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private MessageType messageType;
    private String content;
    private Long replyToMessageId;
    private String replyToContent;
    private Boolean edited;
    private Boolean recalled;
    private List<AttachmentResponse> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Builder
    public static class AttachmentResponse {
        private Long id;
        private AttachmentType type;
        private String url;
        private String publicId;
        private String fileType;
        private Long fileSize;
    }
}
