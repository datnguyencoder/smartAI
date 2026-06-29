package com.smartmart.service;

import com.smartmart.dto.request.CreateStockAdjustmentRequest;
import com.smartmart.dto.request.CreateStockTransferRequest;
import com.smartmart.dto.response.StockMovementResponse;

public interface StockMovementService {
    StockMovementResponse adjust(CreateStockAdjustmentRequest request);

    StockMovementResponse transfer(CreateStockTransferRequest request);
}
