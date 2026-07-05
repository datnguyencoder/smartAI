package com.smartmart.service;

import com.smartmart.dto.response.MemberResponse;
import java.util.List;

public interface ParticipantService {
    void addMember(Long conversationId, Long currentUserId, Long targetUserId);
    void removeMember(Long conversationId, Long currentUserId, Long targetUserId);
    void leaveGroup(Long conversationId, Long currentUserId);
    List<MemberResponse> getMembers(Long conversationId, Long currentUserId);
}
