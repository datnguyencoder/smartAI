package com.smartmart.service;

import com.smartmart.dto.request.CreatePromotionRequest;
import com.smartmart.dto.request.UpdatePromotionRequest;
import com.smartmart.dto.response.PromotionResponse;
import com.smartmart.dto.response.PromotionValidateResponse;
import com.smartmart.entity.Customer;
import com.smartmart.entity.Order;
import com.smartmart.entity.Promotion;

import java.math.BigDecimal;
import java.util.List;

public interface PromotionService {

    List<PromotionResponse> listAll();

    List<PromotionResponse> listActive();

    PromotionResponse getById(Long id);

    PromotionResponse create(CreatePromotionRequest request);

    PromotionResponse update(Long id, UpdatePromotionRequest request);

    void delete(Long id);

    PromotionValidateResponse validateCode(String code, BigDecimal orderSubtotal, Long customerId);

    Promotion applyCode(String code, BigDecimal orderSubtotal, Long customerId);

    BigDecimal calculateDiscount(Promotion promotion, BigDecimal orderSubtotal);

    /** Ghi nhận 1 lần dùng mã KM sau khi order đã lưu thành công — tăng usageCount và lưu lịch sử theo khách. */
    void recordUsage(Promotion promotion, Customer customer, Order order);
}
