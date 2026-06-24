export type PageKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'locations'
  | 'pos'
  | 'invoices'
  | 'import-create'
  | 'import-slips'
  | 'inventory'
  | 'inventory-alerts'
  | 'inventory-logs'
  | 'ai-forecast'
  | 'purchase-suggestions'
  | 'expiry-risk'
  | 'promotions'
  | 'promotion-manage'
  | 'customers'
  | 'ai-assistant'
  | 'reports'
  | 'users'
  | 'settings'
  | 'scrap-orders'
  | 'stocktake'
  | 'transfer-orders'
  | 'shifts'
  | 'item-lots'
  | 'audit-logs';

export type PurchaseSuggestionPrefillItem = {
  itemId: number;
  suggestedQty: number;
};
