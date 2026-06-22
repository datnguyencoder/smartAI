import { apiRequest } from '@/services/apiClient';
import type { DashboardSummaryDto } from '@/types/api';

export function fetchDashboardSummary() {
  return apiRequest<DashboardSummaryDto>('/api/v1/dashboard/summary');
}

export function fetchDashboardRevenue() {
  return apiRequest<{ day: string; revenue: number }[]>('/api/v1/dashboard/revenue');
}

export function fetchDashboardForecastSummary() {
  return apiRequest<{ itemsWithForecast?: number; highRiskCount?: number }>(
    '/api/v1/dashboard/forecast-summary'
  );
}
