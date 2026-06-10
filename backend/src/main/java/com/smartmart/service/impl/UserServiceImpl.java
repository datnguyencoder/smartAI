package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateUserRequest;
import com.smartmart.dto.request.UpdateUserRequest;
import com.smartmart.dto.response.UserResponse;
import com.smartmart.entity.User;
import com.smartmart.enums.UserStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ConflictException;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserServiceImpl implements com.smartmart.service.UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserResponse> listAll() {
        return userRepository.findAll().stream().map(authService::toUserResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public UserResponse getById(Long id) {
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
        User saved = userRepository.save(user);
        auditLogService.log("USER_CREATE", "Tạo user: " + saved.getUsername());
        return authService.toUserResponse(saved);
    }

    @Override
    public UserResponse update(Long id, UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        if (req.getFullName() != null && !req.getFullName().isBlank()){
            user.setFullName(req.getFullName().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()){
            if(!req.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(req.getEmail())){
                throw new ConflictException("Email dã tồn tại");
            }
            user.setEmail(req.getEmail());
        }
        if (req.getRole() != null) user.setRole(req.getRole());
        return authService.toUserResponse(userRepository.save(user));
    }

    @Override
    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException(
                    ErrorCode.DEFAULT_ADMIN_CANNOT_BE_DEACTIVATED,
                    ErrorCode.DEFAULT_ADMIN_CANNOT_BE_DEACTIVATED.getMessage()
            );
        }
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        auditLogService.log("USER_LOCKED", "Khóa user: " + user.getUsername());
    }

    @Override
    public void softDelete(Long id) {
        User user = userRepository.findById(id).orElseThrow(()-> new NotFoundException("Không tìm thấy người dùng"));

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException(
                    ErrorCode.DEFAULT_ADMIN_CANNOT_BE_DEACTIVATED,
                    ErrorCode.DEFAULT_ADMIN_CANNOT_BE_DEACTIVATED.getMessage()
            );
        }

        if (user.getStatus() != UserStatus.LOCKED) {
            throw new BadRequestException(
                    ErrorCode.USER_MUST_BE_LOCKED_BEFORE_INACTIVE,
                    ErrorCode.USER_MUST_BE_LOCKED_BEFORE_INACTIVE.getMessage()
            );
        }

        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);

        auditLogService.log("USER_SOFT_DELETE", "Xóa mềm user: " + user.getUsername());
    }

}
