import type { PageKey } from '@/types/pages';

export const PAGE_PATHS: Record<PageKey, string> = {
  dashboard: '/',
  products: '/products',
  categories: '/categories',
  suppliers: '/suppliers',
  locations: '/locations',
  pos: '/pos',
  customers: '/customers',
  invoices: '/invoices',
  'import-create': '/import/create',
  'import-slips': '/import/slips',
  inventory: '/inventory',
  'inventory-alerts': '/inventory/alerts',
  'inventory-logs': '/inventory/logs',
  'ai-forecast': '/ai/forecast',
  'purchase-suggestions': '/purchase/suggestions',
  'expiry-risk': '/expiry-risk',
  promotions: '/promotions',
  'promotion-manage': '/promotions/manage',
  'ai-assistant': '/ai/assistant',
  reports: '/reports',
  users: '/users',
  settings: '/settings',
  'scrap-orders': '/scrap-orders',
  stocktake: '/stocktake',
  'transfer-orders': '/transfer-orders',
  shifts: '/shifts',
  'item-lots': '/item-lots',
  'audit-logs': '/audit-logs'
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as PageKey])
) as Record<string, PageKey>;

export function pageFromPath(pathname: string): PageKey {
  return PATH_TO_PAGE[pathname] ?? 'dashboard';
}

export function pathFromPage(page: PageKey): string {
  return PAGE_PATHS[page] ?? '/';
}
