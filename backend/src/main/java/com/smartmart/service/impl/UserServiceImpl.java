package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateUserRequest;
import com.smartmart.dto.request.UpdateUserRequest;
import com.smartmart.dto.response.UserResponse;
import com.smartmart.entity.User;
import com.smartmart.enums.UserStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ConflictException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserServiceImpl implements com.smartmart.service.UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthService authService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserResponse> listAll() {
        return userRepository.findAll().stream().map(authService::toUserResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public UserResponse getById(UUID id) {
        return userRepository.findById(id)
                .map(authService::toUserResponse)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    @Override
    public UserResponse create(CreateUserRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new ConflictException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email đã tồn tại");
        }
        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .email(req.getEmail())
                .fullName(req.getFullName())
                .role(req.getRole())
                .status(UserStatus.ACTIVE)
                .build();
        return authService.toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse update(UUID id, UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email đã tồn tại");
        }
        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getRole() != null) user.setRole(req.getRole());
        if (req.getStatus() != null) user.setStatus(req.getStatus());
        return authService.toUserResponse(userRepository.save(user));
    }

    @Override
    public void deactivate(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("Không thể khóa tài khoản admin mặc định");
        }
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);
    }
}
