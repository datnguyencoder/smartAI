import { apiDownloadBlob, apiRequest } from '@/services/apiClient';
import type {
  BestSellerCategoryReportDto,
  BestSellerReportDto,
  CashFlowReportDto,
  CustomerDueReportDto,
  InventoryNxtReportDto,
  InventoryReportDto,
  ProductExpiryReportDto,
  ProfitLossReportDto,
  PurchaseReportDto,
  SalesReportDto,
  SupplierDueReportDto,
  RefundReportDto,
} from '@/types/api';

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

export function fetchNxtReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<InventoryNxtReportDto[]>(`/api/v1/reports/nxt${qs ? `?${qs}` : ''}`);
}

export function fetchBestSellers(from?: string, to?: string, limit = 10) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('limit', String(limit));
  return apiRequest<BestSellerReportDto[]>(`/api/v1/reports/best-sellers?${params}`);
}

export function fetchBestSellerCategories(from?: string, to?: string, limit = 10) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('limit', String(limit));
  return apiRequest<BestSellerCategoryReportDto[]>(`/api/v1/reports/best-seller-categories?${params}`);
}

export function fetchCustomerDueReport() {
  return apiRequest<CustomerDueReportDto[]>('/api/v1/reports/customer-due');
}

export function fetchSupplierDueReport() {
  return apiRequest<SupplierDueReportDto[]>('/api/v1/reports/supplier-due');
}

export function fetchProductExpiryReport() {
  return apiRequest<ProductExpiryReportDto[]>('/api/v1/reports/product-expiry');
}

export function fetchCashFlowReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<CashFlowReportDto[]>(`/api/v1/reports/cash-flow${qs ? `?${qs}` : ''}`);
}

export function fetchProfitLossReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<ProfitLossReportDto[]>(`/api/v1/reports/profit-loss${qs ? `?${qs}` : ''}`);
}

export function fetchRefundReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<RefundReportDto>(`/api/v1/reports/refund-statistics${qs ? `?${qs}` : ''}`);
}

export function exportReport(type: 'sales' | 'purchase' | 'inventory' | 'nxt' | 'best-sellers' | 'best-seller-categories' | 'customer-due' | 'supplier-due' | 'product-expiry' | 'cash-flow' | 'profit-loss', format: 'excel' | 'pdf', from?: string, to?: string, groupBy?: string) {
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
