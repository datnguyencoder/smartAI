package com.smartmart.service;

import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.response.OrderPrintResponse;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.enums.OrderStatus;
import org.springframework.data.domain.Page;

import java.util.List;

public interface OrderService {

    OrderResponse create(CreateOrderRequest request);

    List<OrderResponse> listAll();

    org.springframework.data.domain.Page<OrderResponse> listPaged(int page, int size, String search, OrderStatus status, java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate);

    OrderResponse getById(Long id);

    OrderResponse cancel(Long id);

    OrderPrintResponse getPrint(Long id);

    List<String> suggestCustomers(String keyword);
}
