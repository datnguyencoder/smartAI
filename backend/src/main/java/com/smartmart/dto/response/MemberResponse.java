package com.smartmart.dto.response;

import com.smartmart.enums.ParticipantRole;
import com.smartmart.enums.ParticipantStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MemberResponse {
    private Long userId;
    private String username;
    private String fullName;
    private ParticipantRole role;
    private ParticipantStatus status;
    private LocalDateTime joinedAt;
}
