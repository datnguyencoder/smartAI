import type { PageKey } from '@/types/pages';

export const PAGE_PATHS: Record<PageKey, string> = {
  dashboard: '/',
  products: '/products',
  categories: '/categories',
  brands: '/brands',
  suppliers: '/suppliers',
  locations: '/locations',
  uoms: '/uoms',
  pos: '/pos',
  customers: '/customers',
  'customer-debts': '/customer-debts',
  invoices: '/invoices',
  'return-orders': '/return-orders',
  quotations: '/quotations',
  'online-orders': '/online-orders',
  'import-create': '/import/create',
  'import-slips': '/import/slips',
  inventory: '/inventory',
  'stock-movements': '/inventory/movements',
  'barcode-print': '/inventory/barcode-print',
  'expired-products': '/inventory/expired',
  'inventory-alerts': '/inventory/alerts',
  'inventory-logs': '/inventory/logs',
  'ai-forecast': '/ai/forecast',
  'purchase-suggestions': '/purchase/suggestions',
  'expiry-risk': '/expiry-risk',
  promotions: '/promotions',
  'promotion-manage': '/promotions/manage',
  'discount-plans': '/promotions/discount-plans',
  'gift-cards': '/promotions/gift-cards',
  'ai-assistant': '/ai/assistant',
  reports: '/reports',
  finance: '/finance',
  users: '/users',
  settings: '/settings',
  'scrap-orders': '/scrap-orders',
  stocktake: '/stocktake',
  shifts: '/shifts',
  'item-lots': '/item-lots',
  'audit-logs': '/audit-logs',
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as PageKey])
) as Record<string, PageKey>;

export function pageFromPath(pathname: string): PageKey {
  if (pathname === '/transfer-orders') return 'stock-movements';
  return PATH_TO_PAGE[pathname] ?? 'dashboard';
}

export function pathFromPage(page: PageKey): string {
  return PAGE_PATHS[page] ?? '/';
}
