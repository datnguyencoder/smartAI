import { apiRequest } from '@/services/apiClient';
import type { DiscountPlanAnalyticsDto, DiscountPlanDto } from '@/types/api';

export function fetchDiscountPlanAnalytics() {
  return apiRequest<DiscountPlanAnalyticsDto[]>('/api/v1/discount-plans/analytics');
}

export function fetchDiscountPlans() {
  return apiRequest<DiscountPlanDto[]>('/api/v1/discount-plans');
}

export function fetchDiscountPlan(id: number) {
  return apiRequest<DiscountPlanDto>(`/api/v1/discount-plans/${id}`);
}

export function createDiscountPlan(payload: {
  planName: string;
  planType: string;
  categoryId?: number;
  itemId?: number;
  dealType?: string;
  discountPercent?: number;
  buyQuantity?: number;
  freeQuantity?: number;
  fixedAmount?: number;
  minQuantity?: number;
  startTime?: string;
  endTime?: string;
  maxUsage?: number;
  giftItemId?: number;
  startDate?: string;
  endDate?: string;
  priority?: number;
}) {
  return apiRequest<DiscountPlanDto>('/api/v1/discount-plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDiscountPlan(id: number, payload: {
  planName?: string;
  discountPercent?: number;
  buyQuantity?: number;
  freeQuantity?: number;
  fixedAmount?: number;
  minQuantity?: number;
  startTime?: string;
  endTime?: string;
  maxUsage?: number;
  clearTimeWindow?: boolean;
  /** 0 = xoá về mặc định (tặng chính sản phẩm đang mua) */
  giftItemId?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  priority?: number;
}) {
  return apiRequest<DiscountPlanDto>(`/api/v1/discount-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteDiscountPlan(id: number) {
  return apiRequest<void>(`/api/v1/discount-plans/${id}`, { method: 'DELETE' });
}
