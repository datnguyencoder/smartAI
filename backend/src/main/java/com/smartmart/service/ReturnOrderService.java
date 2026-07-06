package com.smartmart.service;

import com.smartmart.dto.request.CreateReturnOrderRequest;
import com.smartmart.dto.response.ReturnableOrderItemResponse;
import com.smartmart.entity.ReturnOrder;

import java.util.List;

public interface ReturnOrderService {
    ReturnOrder create(CreateReturnOrderRequest request);
    ReturnOrder findById(Long id);
    List<ReturnOrder> listAll();
    List<ReturnOrder> listByOriginalOrder(Long originalOrderId);
    List<ReturnableOrderItemResponse> listReturnableItems(Long orderId);
}
