package com.smartmart.service;

import com.smartmart.dto.request.CreateOnlineOrderRequestRequest;
import com.smartmart.dto.request.UpdateOnlineOrderRequestStatusRequest;
import com.smartmart.dto.response.OnlineOrderRequestResponse;

import java.util.List;

public interface OnlineOrderRequestService {
    OnlineOrderRequestResponse create(CreateOnlineOrderRequestRequest request);

    OnlineOrderRequestResponse updateStatus(Long id, UpdateOnlineOrderRequestStatusRequest request);

    OnlineOrderRequestResponse getById(Long id);

    List<OnlineOrderRequestResponse> listAll();
}
