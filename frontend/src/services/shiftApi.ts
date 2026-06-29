import { apiRequest } from '@/services/apiClient';
import type { ShiftDto, ShiftSummaryDto } from '@/types/api';

export function fetchShifts() {
  return apiRequest<ShiftDto[]>('/api/v1/shifts');
}

export function fetchCurrentShift() {
  return apiRequest<ShiftDto | null>('/api/v1/shifts/current');
}

export function fetchShiftSummary(id: number) {
  return apiRequest<ShiftSummaryDto>(`/api/v1/shifts/${id}/summary`);
}

export function openShift(openingCash: number, note?: string) {
  return apiRequest<ShiftDto>('/api/v1/shifts/open', {
    method: 'POST',
    body: JSON.stringify({ openingCash, note }),
  });
}

export function closeShift(id: number, closingCash: number, note?: string, varianceReason?: string) {
  return apiRequest<ShiftDto>(`/api/v1/shifts/${id}/close`, {
    method: 'POST',
    body: JSON.stringify({ closingCash, note, varianceReason }),
  });
}

export function reviewShift(id: number, reviewNote?: string) {
  return apiRequest<ShiftDto>(`/api/v1/shifts/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ reviewNote }),
  });
}
