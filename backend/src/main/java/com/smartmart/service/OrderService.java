package com.smartmart.service;

import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.response.OrderPrintResponse;
import com.smartmart.dto.response.OrderResponse;

import java.util.List;

public interface OrderService {

    OrderResponse create(CreateOrderRequest request);

    List<OrderResponse> listAll();

    OrderResponse getById(Long id);

    OrderResponse cancel(Long id);

    OrderPrintResponse getPrint(Long id);
}
