package com.smartmart.service;

import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.response.OrderPrintResponse;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.enums.OrderStatus;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {

    OrderResponse create(CreateOrderRequest request);
    Long completeOrderFromWebhook(Long payosOrderCode);

    List<OrderResponse> listAll();

    Page<OrderResponse> listPaged(int page, int size, String search, OrderStatus status, LocalDateTime fromDate, LocalDateTime toDate);

    OrderResponse getById(Long id);

    OrderResponse cancel(Long id);

    OrderPrintResponse getPrint(Long id);

    List<String> suggestCustomers(String keyword);

    List<OrderResponse> listByCustomerPhone(String customerPhone);
}
