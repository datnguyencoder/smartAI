package com.smartmart.service;

import com.smartmart.dto.request.CreateUserRequest;
import com.smartmart.dto.request.UpdateUserRequest;
import com.smartmart.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> listAll();

    UserResponse getById(Long id);

    UserResponse create(CreateUserRequest req);

    UserResponse update(Long id, UpdateUserRequest req);

    void lock(Long id);

    void unlock(Long id);

    void softDelete(Long id);
}
