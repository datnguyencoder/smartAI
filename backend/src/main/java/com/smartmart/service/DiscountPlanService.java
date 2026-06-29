package com.smartmart.service;

import com.smartmart.dto.request.CreateDiscountPlanRequest;
import com.smartmart.dto.request.UpdateDiscountPlanRequest;
import com.smartmart.dto.response.DiscountApplyResponse;
import com.smartmart.dto.response.DiscountPlanResponse;

import java.util.List;

public interface DiscountPlanService {
    DiscountPlanResponse create(CreateDiscountPlanRequest request);

    DiscountPlanResponse update(Long id, UpdateDiscountPlanRequest request);

    DiscountPlanResponse getById(Long id);

    List<DiscountPlanResponse> listAll();

    DiscountApplyResponse applyForItem(Long itemId);
}
