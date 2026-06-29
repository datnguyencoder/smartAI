export type PageKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'locations'
  | 'uoms'
  | 'pos'
  | 'invoices'
  | 'return-orders'
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
  | 'shifts'
  | 'item-lots'
  | 'audit-logs';

export type PurchaseSuggestionPrefillItem = {
  itemId: number;
  suggestedQty: number;
};
