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
import jakarta.persistence.Id;
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
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(authService::toUserResponse).toList();
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
            throw new ConflictException(
                    ErrorCode.USERNAME_ALREADY_EXISTS,
                    ErrorCode.USERNAME_ALREADY_EXISTS.getMessage()
            );
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException(
                    ErrorCode.EMAIL_ALREADY_EXISTS,
                    ErrorCode.EMAIL_ALREADY_EXISTS.getMessage());
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
        auditLogService.log(
                        "USER_CREATE",
                        "USER",
                        saved.getId().toString(),
                        "Tạo người dùng: " + saved.getUsername(),
                        null,
                        "username=" + saved.getUsername()
                                + ", email=" + saved.getEmail()
                                + ", fullName=" + saved.getFullName()
                                + ", role=" + saved.getRole()
                                + ", status=" + saved.getStatus()
        );
        return authService.toUserResponse(saved);
    }

    @Override
    public UserResponse update(Long id, UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        String beforeData = "email=" + user.getEmail()
                + ", fullName=" + user.getFullName();
        if (req.getFullName() != null && !req.getFullName().isBlank()){
            user.setFullName(req.getFullName().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()){
            if(!req.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(req.getEmail())){
                throw new ConflictException(
                        ErrorCode.EMAIL_ALREADY_EXISTS,
                        ErrorCode.EMAIL_ALREADY_EXISTS.getMessage());
            }
            user.setEmail(req.getEmail().trim());
        }

        User saved = userRepository.save(user);

        auditLogService.log(
                "USER_UPDATE",
                "USER",
                saved.getId().toString(),
                "Cập nhật người dùng: " + saved.getUsername(),
                beforeData,
                "email=" + saved.getEmail()
                        + ", fullName=" + saved.getFullName()
        );

        return authService.toUserResponse(saved);
    }

    @Override

    public void lock(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException(
                    ErrorCode.DEFAULT_ADMIN_CANNOT_BE_DEACTIVATED,
                    ErrorCode.DEFAULT_ADMIN_CANNOT_BE_DEACTIVATED.getMessage()
            );
        }
        String beforeData = "status=" + user.getStatus();

        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);

        auditLogService.log(
                "USER_LOCKED",
                "USER",
                user.getId().toString(),
                "Khóa user: " + user.getUsername(),
                beforeData,
                "status=" + user.getStatus()
        );
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

        String beforeData = "status=" + user.getStatus();

        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);

        auditLogService.log(
                "USER_SOFT_DELETE",
                "USER",
                user.getId().toString(),
                "Xóa mềm người dùng: " + user.getUsername(),
                beforeData,
                "status=" + user.getStatus()
        );
    }

    @Override
    public void unlock(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException(
                    ErrorCode.INACTIVE_USER_CANNOT_BE_UNLOCKED,
                    ErrorCode.INACTIVE_USER_CANNOT_BE_UNLOCKED.getMessage()
            );
        }

        if (user.getStatus() != UserStatus.LOCKED) {
            throw new BadRequestException(
                    ErrorCode.USER_MUST_BE_LOCKED_BEFORE_UNLOCK,
                    ErrorCode.USER_MUST_BE_LOCKED_BEFORE_UNLOCK.getMessage()
            );
        }

        String beforeData = "status=" + user.getStatus();

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        auditLogService.log(
                "USER_UNLOCKED",
                "USER",
                user.getId().toString(),
                "Mở khóa user: " + user.getUsername(),
                beforeData,
                "status=" + user.getStatus()
        );
    }


}
