import { apiRequest } from '@/services/apiClient';
import type {
  AccountTransferDto,
  CashAccountDto,
  FinanceCategoryDto,
  FinanceSummaryDto,
  FinanceTransactionDto,
} from '@/types/api';

export function fetchFinanceTransactions(type?: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (type && type !== 'ALL') params.set('type', type);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString() ? `?${params}` : '';
  return apiRequest<FinanceTransactionDto[]>(`/api/v1/finance/transactions${qs}`);
}

export function createFinanceTransaction(payload: {
  type: string;
  category: string;
  amount: number;
  paymentAccount: string;
  transactionDate: string;
  note?: string;
}) {
  return apiRequest<FinanceTransactionDto>('/api/v1/finance/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchFinanceSummary(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString() ? `?${params}` : '';
  return apiRequest<FinanceSummaryDto>(`/api/v1/finance/summary${qs}`);
}

export function fetchFinanceCategories(type?: string) {
  const qs = type && type !== 'ALL' ? `?type=${type}` : '';
  return apiRequest<FinanceCategoryDto[]>(`/api/v1/finance/categories${qs}`);
}

export function createFinanceCategory(payload: { name: string; type: string }) {
  return apiRequest<FinanceCategoryDto>('/api/v1/finance/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFinanceCategory(id: number, payload: { name?: string; active?: boolean }) {
  return apiRequest<FinanceCategoryDto>(`/api/v1/finance/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchCashAccounts() {
  return apiRequest<CashAccountDto[]>('/api/v1/finance/cash-accounts');
}

export function createCashAccount(payload: { accountName: string; accountType: string; initialBalance?: number }) {
  return apiRequest<CashAccountDto>('/api/v1/finance/cash-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function transferCashAccount(payload: {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  note?: string;
}) {
  return apiRequest<AccountTransferDto>('/api/v1/finance/cash-accounts/transfer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchAccountTransfers() {
  return apiRequest<AccountTransferDto[]>('/api/v1/finance/cash-accounts/transfers');
}