package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CustomerResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private Integer loyaltyPoints;
    private String tier;
    private LocalDateTime createdAt;
}
