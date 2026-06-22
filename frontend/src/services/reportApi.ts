import { apiDownloadBlob, apiRequest } from '@/services/apiClient';
import type { InventoryReportDto, PurchaseReportDto, SalesReportDto } from '@/types/api';

export function fetchSalesReport(from?: string, to?: string, groupBy?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (groupBy) params.set('groupBy', groupBy);
  const qs = params.toString();
  return apiRequest<SalesReportDto[]>(`/api/v1/reports/sales${qs ? `?${qs}` : ''}`);
}

export function fetchPurchaseReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<PurchaseReportDto[]>(`/api/v1/reports/purchase${qs ? `?${qs}` : ''}`);
}

export function fetchInventoryReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<InventoryReportDto[]>(`/api/v1/reports/inventory${qs ? `?${qs}` : ''}`);
}

export function exportReport(type: 'sales' | 'purchase' | 'inventory', format: 'excel' | 'pdf', from?: string, to?: string, groupBy?: string) {
  const params = new URLSearchParams();
  params.set('type', type);
  params.set('format', format);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (groupBy) params.set('groupBy', groupBy);
  return apiDownloadBlob(`/api/v1/reports/export?${params}`);
}

export function exportComprehensiveReport(format: 'pdf' | 'excel' = 'pdf', from?: string, to?: string) {
  const params = new URLSearchParams();
  params.set('format', format);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiDownloadBlob(`/api/v1/reports/comprehensive?${params}`);
}
