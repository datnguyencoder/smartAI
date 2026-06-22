import { apiRequest } from '@/services/apiClient';
import type { AuditLogDto, PageResponseDto } from '@/types/api';

export function fetchRecentAuditLogs(limit = 20) {
  return apiRequest<AuditLogDto[]>(`/api/v1/audit-logs/recent?limit=${limit}`);
}

export function fetchAuditLogs(page = 0, size = 10) {
  return apiRequest<PageResponseDto<AuditLogDto>>(`/api/v1/audit-logs?page=${page}&size=${size}`);
}

export function fetchAuditLogsByAction(action: string, page = 0, size = 10) {
  return apiRequest<PageResponseDto<AuditLogDto>>(
    `/api/v1/audit-logs/action/${encodeURIComponent(action)}?page=${page}&size=${size}`
  );
}

export function fetchAuditLogsByUsername(username: string, page = 0, size = 10) {
  return apiRequest<PageResponseDto<AuditLogDto>>(
    `/api/v1/audit-logs/username/${encodeURIComponent(username)}?page=${page}&size=${size}`
  );
}

export function fetchAuditLogsByEntity(entityType: string, entityId?: string, page = 0, size = 10) {
  const params = new URLSearchParams({ entityType, page: String(page), size: String(size) });
  if (entityId && entityId.trim()) params.set('entityId', entityId.trim());
  return apiRequest<PageResponseDto<AuditLogDto>>(`/api/v1/audit-logs/entity?${params}`);
}

export function fetchAuditLogActions(entityType?: string) {
  const params = new URLSearchParams();
  if (entityType) params.set('entityType', entityType);
  const query = params.toString();
  return apiRequest<string[]>(`/api/v1/audit-logs/actions${query ? `?${query}` : ''}`);
}

export function searchAuditLogs(params: {
  entityType?: string;
  action?: string;
  username?: string;
  page?: number;
  size?: number;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 10));
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.action) query.set('action', params.action);
  if (params.username?.trim()) query.set('username', params.username.trim());
  return apiRequest<PageResponseDto<AuditLogDto>>(`/api/v1/audit-logs/search?${query}`);
}
