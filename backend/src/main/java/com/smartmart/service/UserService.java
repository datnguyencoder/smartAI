package com.smartmart.service;

import com.smartmart.dto.request.CreateUserRequest;
import com.smartmart.dto.request.UpdateUserRequest;
import com.smartmart.dto.response.UserResponse;

import java.util.List;
import java.util.UUID;

public interface UserService {

    List<UserResponse> listAll();

    UserResponse getById(UUID id);

    UserResponse create(CreateUserRequest req);

    UserResponse update(UUID id, UpdateUserRequest req);

    void deactivate(UUID id);

    void softDelete(UUID id);
}
