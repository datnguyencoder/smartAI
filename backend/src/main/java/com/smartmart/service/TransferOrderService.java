package com.smartmart.service;

import com.smartmart.dto.request.CreateTransferOrderRequest;
import com.smartmart.entity.TransferOrder;
import com.smartmart.enums.TransferStatus;

import java.util.List;

public interface TransferOrderService {
    TransferOrder create(CreateTransferOrderRequest request);
    TransferOrder complete(Long id);
    TransferOrder cancel(Long id);
    TransferOrder findById(Long id);
    List<TransferOrder> listAll(TransferStatus status);
}
