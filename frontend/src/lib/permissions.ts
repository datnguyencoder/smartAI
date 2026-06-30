import type { PageKey } from '@/types/pages';

export type AppRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_STAFF' | 'ROLE_WAREHOUSE' | string;

const ALL_PAGES: PageKey[] = [
  'dashboard',
  'products',
  'categories',
  'brands',
  'suppliers',
  'locations',
  'uoms',
  'pos',
  'customers',
  'customer-debts',
  'invoices',
  'return-orders',
  'quotations',
  'online-orders',
  'import-create',
  'import-slips',
  'inventory',
  'barcode-print',
  'expired-products',
  'inventory-alerts',
  'inventory-logs',
  'ai-forecast',
  'purchase-suggestions',
  'expiry-risk',
  'promotions',
  'promotion-manage',
  'discount-plans',
  'gift-cards',
  'ai-assistant',
  'reports',
  'finance',
  'users',
  'settings',
  'scrap-orders',
  'stocktake',
  'shifts',
  'item-lots',
  'audit-logs',
];

// Ma trận trang theo role (docs/02-business-rule)
const ROLE_PAGES: Record<string, PageKey[]> = {
  ROLE_ADMIN: ALL_PAGES,
  ROLE_MANAGER: ALL_PAGES.filter((p) => p !== 'users' && p !== 'settings' && p !== 'audit-logs'),
  ROLE_STAFF: [
    'dashboard', 'products', 'pos', 'customers', 'customer-debts', 'invoices',
    'return-orders', 'quotations', 'online-orders', 'inventory-alerts', 'shifts', 'gift-cards',
  ],
  ROLE_WAREHOUSE: [
    'products',
    'categories',
    'brands',
    'suppliers',
    'locations',
    'uoms',
    'import-create',
    'import-slips',
    'inventory',
    'barcode-print',
    'expired-products',
    'inventory-alerts',
    'inventory-logs',
    'expiry-risk',
    'scrap-orders',
    'stocktake',
    'item-lots',
  ],
  ROLE_ANALYST: ['dashboard', 'reports', 'ai-forecast', 'expiry-risk', 'ai-assistant'],
};

const QUICK_CREATE_PAGES: Partial<Record<PageKey, string[]>> = {
  products: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'],
  categories: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'],
  brands: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'],
  uoms: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'],
  suppliers: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'],
  'import-create': ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'],
};

export function normalizeRole(role?: string): string {
  if (!role) return 'ROLE_STAFF';
  return role.startsWith('ROLE_') ? role : `ROLE_${role}`;
}

export function allowedPages(role?: string): PageKey[] {
  const key = normalizeRole(role);
  return ROLE_PAGES[key] ?? ROLE_PAGES.ROLE_STAFF;
}

export function canAccessPage(role: string | undefined, page: PageKey): boolean {
  return allowedPages(role).includes(page);
}

export function defaultPageForRole(role?: string): PageKey {
  const pages = allowedPages(role);
  const r = normalizeRole(role);
  if (r === 'ROLE_STAFF' && pages.includes('pos')) return 'pos';
  if (r === 'ROLE_WAREHOUSE' && pages.includes('inventory')) return 'inventory';
  if (pages.includes('dashboard')) return 'dashboard';
  return pages[0] ?? 'pos';
}

/** GET /api/v1/orders — chỉ ADMIN, MANAGER, STAFF (WAREHOUSE → 403) */
export function canFetchOrders(role?: string): boolean {
  const r = normalizeRole(role);
  return r === 'ROLE_ADMIN' || r === 'ROLE_MANAGER' || r === 'ROLE_STAFF';
}

export function canQuickCreate(role: string | undefined, page: PageKey): boolean {
  const allowed = QUICK_CREATE_PAGES[page];
  if (!allowed) return false;
  return allowed.includes(normalizeRole(role));
}

export function roleLabel(role?: string): string {
  switch (normalizeRole(role)) {
    case 'ROLE_ADMIN':
      return 'Quản trị';
    case 'ROLE_MANAGER':
      return 'Quản lý';
    case 'ROLE_WAREHOUSE':
      return 'Kho';
    case 'ROLE_ANALYST':
      return 'Phân tích';
    default:
      return 'Thu ngân';
  }
}
