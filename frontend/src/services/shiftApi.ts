import { apiRequest } from '@/services/apiClient';
import type { AuditLogDto, PageResponseDto, ShiftDto, ShiftSummaryDto } from '@/types/api';

export function fetchShifts() {
  return apiRequest<ShiftDto[]>('/api/v1/shifts');
}

export function fetchCurrentShift() {
  return apiRequest<ShiftDto | null>('/api/v1/shifts/current');
}

export function fetchShiftSummary(id: number) {
  return apiRequest<ShiftSummaryDto>(`/api/v1/shifts/${id}/summary`);
}

export function openShift(note: string) {
  return apiRequest<ShiftDto>('/api/v1/shifts/open', {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function closeShift(id: number, closingCash: number, note: string, varianceReason?: string) {
  return apiRequest<ShiftDto>(`/api/v1/shifts/${id}/close`, {
    method: 'POST',
    body: JSON.stringify({ closingCash, note, varianceReason }),
  });
}

function shiftNoteAction(id: number, action: string, note: string) {
  return apiRequest<ShiftDto>(`/api/v1/shifts/${id}/${action}`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export const requestStaffShiftUpdate = (id: number, note: string) => shiftNoteAction(id, 'request-staff-update', note);
export const updateStaffShiftExplanation = (id: number, note: string) => shiftNoteAction(id, 'staff-explanation', note);
export const submitManagerShiftReview = (id: number, note: string) => shiftNoteAction(id, 'manager-review', note);
export const requestManagerShiftUpdate = (id: number, note: string) => shiftNoteAction(id, 'request-manager-update', note);
export const approveShift = (id: number, note: string) => shiftNoteAction(id, 'approve', note);

export function fetchShiftActivity(id: number) {
  return apiRequest<PageResponseDto<AuditLogDto>>(`/api/v1/shifts/${id}/activity?size=100`);
}

export function reviewShift(id: number, reviewNote?: string) {
  return apiRequest<ShiftDto>(`/api/v1/shifts/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ reviewNote }),
  });
}
