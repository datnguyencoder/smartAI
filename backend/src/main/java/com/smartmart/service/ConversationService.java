package com.smartmart.service;

import com.smartmart.dto.request.CreateGroupConversationRequest;
import com.smartmart.dto.response.ConversationDetailResponse;
import com.smartmart.dto.response.ConversationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConversationService {
    ConversationResponse createPrivateConversation(Long currentUserId, Long targetUserId);
    ConversationResponse createGroupConversation(Long currentUserId, CreateGroupConversationRequest request);
    Page<ConversationResponse> getMyConversations(Long currentUserId, Pageable pageable);
    ConversationDetailResponse getConversationDetail(Long conversationId, Long currentUserId);
    void renameGroup(Long conversationId, Long currentUserId, String newName);
    void deleteGroup(Long conversationId, Long currentUserId);
}
