package com.smartmart.dto.request;

import lombok.Data;

@Data
public class LogoutRequest {
    /** Refresh token để thu hồi cùng phiên (tuỳ chọn). */
    private String refreshToken;
}
