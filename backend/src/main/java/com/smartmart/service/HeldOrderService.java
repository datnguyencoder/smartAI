package com.smartmart.service;

import com.smartmart.dto.request.CreateHeldOrderRequest;
import com.smartmart.dto.response.HeldOrderResponse;

import java.util.List;

public interface HeldOrderService {
    HeldOrderResponse create(CreateHeldOrderRequest request);

    List<HeldOrderResponse> listActive();

    HeldOrderResponse restore(Long id);

    HeldOrderResponse cancel(Long id);
}
