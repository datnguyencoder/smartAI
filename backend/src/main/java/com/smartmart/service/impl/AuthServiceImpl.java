package com.smartmart.service.impl;

import com.smartmart.dto.request.LoginRequest;
import com.smartmart.dto.response.AuthResponse;
import com.smartmart.dto.response.UserResponse;
import com.smartmart.entity.User;
import com.smartmart.enums.UserStatus;
import com.smartmart.exception.UnauthorizedException;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.security.CustomUserDetails;
import com.smartmart.security.JwtTokenProvider;
import com.smartmart.security.SecurityUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements com.smartmart.service.AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            CustomUserDetails details = (CustomUserDetails) auth.getPrincipal();
            if (details.getUser().getStatus() != UserStatus.ACTIVE) {
                throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE, ErrorCode.ACCOUNT_INACTIVE.getMessage());
            }
            String token = jwtTokenProvider.generateToken(auth);
            return AuthResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .user(toUserResponse(details.getUser()))
                    .build();
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, ErrorCode.INVALID_CREDENTIALS.getMessage());
        }
    }

    @Override
    public AuthResponse refresh(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new UnauthorizedException(ErrorCode.TOKEN_INVALID, "Token không hợp lệ");
        }
        String token = bearerToken.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException(ErrorCode.TOKEN_EXPIRED, ErrorCode.TOKEN_EXPIRED.getMessage());
        }
        String username = jwtTokenProvider.getUsernameFromJwt(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE, ErrorCode.ACCOUNT_INACTIVE.getMessage());
        }
        Authentication auth = new UsernamePasswordAuthenticationToken(
                new CustomUserDetails(user), null, new CustomUserDetails(user).getAuthorities());
        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateToken(auth))
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse me() {
        String username = SecurityUtils.getCurrentUserUsername()
                .orElseThrow(() -> new UnauthorizedException("Chưa đăng nhập"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        return toUserResponse(user);
    }

    @Override
    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
