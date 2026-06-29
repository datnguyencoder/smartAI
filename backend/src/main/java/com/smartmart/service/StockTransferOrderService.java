package com.smartmart.service;

import com.smartmart.dto.request.CreateStockTransferOrderRequest;
import com.smartmart.dto.response.StockTransferOrderResponse;

import java.util.List;

public interface StockTransferOrderService {
    StockTransferOrderResponse create(CreateStockTransferOrderRequest request);

    StockTransferOrderResponse confirm(Long id);

    StockTransferOrderResponse cancel(Long id);

    StockTransferOrderResponse getById(Long id);

    List<StockTransferOrderResponse> listAll();
}
