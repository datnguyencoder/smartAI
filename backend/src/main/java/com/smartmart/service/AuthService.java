package com.smartmart.service;

import com.smartmart.dto.request.LoginRequest;
import com.smartmart.dto.response.AuthResponse;
import com.smartmart.dto.response.UserResponse;
import com.smartmart.entity.User;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(String bearerToken);

    UserResponse me();

    void logout(String bearerToken);

    UserResponse toUserResponse(User user);
}
