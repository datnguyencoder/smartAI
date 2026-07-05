package com.smartmart.service;

import com.smartmart.dto.response.SeenUserResponse;

import java.util.List;

public interface ReadService {
    void markAsRead(Long messageId, Long currentUserId);
    List<SeenUserResponse> getSeenUsers(Long messageId);
    long getSeenCount(Long messageId);
}
