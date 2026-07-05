package com.smartmart.service;

import com.smartmart.dto.request.EditMessageRequest;
import com.smartmart.dto.request.ReplyMessageRequest;
import com.smartmart.dto.request.SendImageMessageRequest;
import com.smartmart.dto.request.SendMessageRequest;
import com.smartmart.dto.response.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MessageService {
    MessageResponse sendTextMessage(Long currentUserId, SendMessageRequest request);
    MessageResponse sendImageMessage(Long currentUserId, SendImageMessageRequest request);
    Page<MessageResponse> getMessages(Long conversationId, Long currentUserId, Pageable pageable);
    void recallMessage(Long messageId, Long currentUserId);
    void editMessage(Long messageId, Long currentUserId, EditMessageRequest request);
    MessageResponse replyMessage(Long currentUserId, ReplyMessageRequest request);
}
