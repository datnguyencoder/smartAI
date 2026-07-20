import { apiRequest } from '@/services/apiClient';
import type { DiscountPlanDto } from '@/types/api';

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
  startDate?: string;
  endDate?: string;
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
  startDate?: string;
  endDate?: string;
  active?: boolean;
}) {
  return apiRequest<DiscountPlanDto>(`/api/v1/discount-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
