package com.smartmart.service.impl;

import com.smartmart.dto.request.LoginRequest;
import com.smartmart.dto.request.LogoutRequest;
import com.smartmart.dto.request.RefreshTokenRequest;
import com.smartmart.dto.response.AuthResponse;
import com.smartmart.dto.response.UserResponse;
import com.smartmart.entity.User;
import com.smartmart.enums.UserStatus;
import com.smartmart.exception.UnauthorizedException;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.security.CustomUserDetails;
import com.smartmart.security.JwtTokenProvider;
import com.smartmart.security.SecurityUtils;
import com.smartmart.security.TokenBlacklistService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements com.smartmart.service.AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuditLogService auditLogService;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            TokenBlacklistService tokenBlacklistService,
            AuditLogService auditLogService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.tokenBlacklistService = tokenBlacklistService;
        this.auditLogService = auditLogService;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            CustomUserDetails details = (CustomUserDetails) auth.getPrincipal();
            if (details.getUser().getStatus() != UserStatus.ACTIVE) {
                throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE, ErrorCode.ACCOUNT_INACTIVE.getMessage());
            }
            String accessToken = jwtTokenProvider.generateAccessToken(auth);
            String refreshToken = jwtTokenProvider.generateRefreshToken(auth);
            auditLogService.log("AUTH_LOGIN", "Đăng nhập: " + request.getUsername());
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .user(toUserResponse(details.getUser()))
                    .build();
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, ErrorCode.INVALID_CREDENTIALS.getMessage());
        }
    }

//    @Override
//    public AuthResponse refresh(String bearerToken) {
//        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
//            throw new UnauthorizedException(ErrorCode.TOKEN_INVALID, "Token không hợp lệ");
//        }
//        String token = bearerToken.substring(7);
//        if (!jwtTokenProvider.validateToken(token)) {
//            throw new UnauthorizedException(ErrorCode.TOKEN_EXPIRED, ErrorCode.TOKEN_EXPIRED.getMessage());
//        }
//        String username = jwtTokenProvider.getUsernameFromJwt(token);
//        User user = userRepository.findByUsername(username)
//                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
//        if (user.getStatus() != UserStatus.ACTIVE) {
//            throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE, ErrorCode.ACCOUNT_INACTIVE.getMessage());
//        }
//        Authentication auth = new UsernamePasswordAuthenticationToken(
//                new CustomUserDetails(user), null, new CustomUserDetails(user).getAuthorities());
//        return AuthResponse.builder()
//                .accessToken(jwtTokenProvider.generateToken(auth))
//                .tokenType("Bearer")
//                .user(toUserResponse(user))
//                .build();
//    }

    // Thu hồi JWT (blacklist) và xóa phiên SecurityContext
    // Thu hồi JWT (blacklist) và xóa phiên SecurityContext

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (tokenBlacklistService.isBlacklisted(refreshToken)) {
            throw new UnauthorizedException(
                    ErrorCode.REFRESH_TOKEN_INVALID,
                    ErrorCode.REFRESH_TOKEN_INVALID.getMessage()
            );
        }

        if(jwtTokenProvider.isTokenExpired(refreshToken)){
            throw new UnauthorizedException(
                    ErrorCode.REFRESH_TOKEN_EXPIRED,
                    ErrorCode.REFRESH_TOKEN_EXPIRED.getMessage()
            );
        }
        if(!jwtTokenProvider.validateToken(refreshToken) ){
            throw new UnauthorizedException(
                    ErrorCode.REFRESH_TOKEN_INVALID,
                    ErrorCode.REFRESH_TOKEN_INVALID.getMessage()
            );
        }

        if(!jwtTokenProvider.isRefreshToken(refreshToken)){
            throw new UnauthorizedException(
                    ErrorCode.REFRESH_TOKEN_INVALID,
                    ErrorCode.REFRESH_TOKEN_INVALID.getMessage()
            );
        }
        String username = jwtTokenProvider.getUsernameFromJwt(refreshToken);

        User user = userRepository.findByUsername(username)
                .orElseThrow(()-> new UnauthorizedException(
                        ErrorCode.REFRESH_TOKEN_INVALID,
                        ErrorCode.REFRESH_TOKEN_INVALID.getMessage()
                ));

        if(user.getStatus() != UserStatus.ACTIVE){
            throw new UnauthorizedException(
                    ErrorCode.ACCOUNT_INACTIVE,
                    ErrorCode.ACCOUNT_INACTIVE.getMessage()
            );
        }
        CustomUserDetails userDetails = new CustomUserDetails(user);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );

        tokenBlacklistService.blacklist(refreshToken, jwtTokenProvider.remainingValidityMs(refreshToken));

        String newAccessToken = jwtTokenProvider.generateAccessToken(auth);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(auth);
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .build();

    }


    @Override
    public void logout(String bearerToken, LogoutRequest request) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String accessToken = bearerToken.substring(7);
            tokenBlacklistService.blacklist(accessToken, jwtTokenProvider.remainingValidityMs(accessToken));
        }
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            String refreshToken = request.getRefreshToken();
            if (jwtTokenProvider.validateToken(refreshToken) && jwtTokenProvider.isRefreshToken(refreshToken)) {
                tokenBlacklistService.blacklist(refreshToken, jwtTokenProvider.remainingValidityMs(refreshToken));
            }
        }
        auditLogService.log("AUTH_LOGOUT", "Đăng xuất JWT");
        SecurityContextHolder.clearContext();
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
