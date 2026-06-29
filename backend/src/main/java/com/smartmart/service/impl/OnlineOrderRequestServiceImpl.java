package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateOnlineOrderRequestRequest;
import com.smartmart.dto.request.UpdateOnlineOrderRequestStatusRequest;
import com.smartmart.dto.response.OnlineOrderRequestResponse;
import com.smartmart.entity.OnlineOrderRequest;
import com.smartmart.enums.OnlineOrderRequestStatus;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.OnlineOrderRequestRepository;
import com.smartmart.service.OnlineOrderRequestService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class OnlineOrderRequestServiceImpl implements OnlineOrderRequestService {

    private final OnlineOrderRequestRepository onlineOrderRequestRepository;

    public OnlineOrderRequestServiceImpl(OnlineOrderRequestRepository onlineOrderRequestRepository) {
        this.onlineOrderRequestRepository = onlineOrderRequestRepository;
    }

    @Override
    public OnlineOrderRequestResponse create(CreateOnlineOrderRequestRequest request) {
        OnlineOrderRequest entity = OnlineOrderRequest.builder()
                .requestCode("ONL-" + System.currentTimeMillis())
                .customerName(blankToNull(request.getCustomerName()))
                .customerPhone(blankToNull(request.getCustomerPhone()))
                .deliveryAddress(blankToNull(request.getDeliveryAddress()))
                .status(OnlineOrderRequestStatus.NEW)
                .totalAmount(request.getTotalAmount() != null ? request.getTotalAmount() : BigDecimal.ZERO)
                .note(blankToNull(request.getNote()))
                .build();
        return toResponse(onlineOrderRequestRepository.save(entity));
    }

    @Override
    public OnlineOrderRequestResponse updateStatus(Long id, UpdateOnlineOrderRequestStatusRequest request) {
        OnlineOrderRequest entity = findById(id);
        entity.setStatus(request.getStatus());
        return toResponse(onlineOrderRequestRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public OnlineOrderRequestResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OnlineOrderRequestResponse> listAll() {
        return onlineOrderRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    private OnlineOrderRequest findById(Long id) {
        return onlineOrderRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy yêu cầu đặt hàng online: " + id));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private OnlineOrderRequestResponse toResponse(OnlineOrderRequest entity) {
        return OnlineOrderRequestResponse.builder()
                .id(entity.getId())
                .requestCode(entity.getRequestCode())
                .customerName(entity.getCustomerName())
                .customerPhone(entity.getCustomerPhone())
                .deliveryAddress(entity.getDeliveryAddress())
                .status(entity.getStatus())
                .totalAmount(entity.getTotalAmount())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
