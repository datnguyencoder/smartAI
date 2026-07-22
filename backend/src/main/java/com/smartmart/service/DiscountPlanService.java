package com.smartmart.service;

import com.smartmart.dto.request.CreateDiscountPlanRequest;
import com.smartmart.dto.request.UpdateDiscountPlanRequest;
import com.smartmart.dto.response.DiscountApplyResponse;
import com.smartmart.dto.response.DiscountPlanAnalyticsResponse;
import com.smartmart.dto.response.DiscountPlanResponse;

import java.util.List;

public interface DiscountPlanService {
    DiscountPlanResponse create(CreateDiscountPlanRequest request);

    DiscountPlanResponse update(Long id, UpdateDiscountPlanRequest request);

    void delete(Long id);

    DiscountPlanResponse getById(Long id);

    /** Toàn bộ kế hoạch (mọi trạng thái) — dùng cho trang quản lý. */
    List<DiscountPlanResponse> listAll();

    /** Chỉ kế hoạch đang có hiệu lực hôm nay — dùng khi áp giá tại POS / AI tra cứu. */
    List<DiscountPlanResponse> listActiveToday();

    DiscountApplyResponse applyForItem(Long itemId);

    /** Ghi nhận 1 lần plan được áp dụng thành công trên đơn hàng — tăng usageCount. */
    void recordUsage(Long planId);

    /** Thống kê hiệu quả từng chiến dịch: số đơn dùng, tổng tiền đã giảm. */
    List<DiscountPlanAnalyticsResponse> getAnalytics();
}
