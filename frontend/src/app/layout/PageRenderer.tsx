import * as React from 'react';
import { Card, CardHeader } from '@/components/ui';
import { allowedPages, canAccessPage, roleLabel } from '@/lib/permissions';
import type { Product } from '@/lib/itemMapper';
import AiForecastPage from '@/pages/ai/AiForecastPage';
import AiAssistantPage, { type ChatMessage } from '@/pages/ai/AiAssistantPage';
import ExpiryRiskPage from '@/pages/ai/ExpiryRiskPage';
import PurchaseSuggestionsPage from '@/pages/ai/PurchaseSuggestionsPage';
import AuditLogsPage from '@/pages/admin/AuditLogsPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import UsersPage from '@/pages/admin/UsersPage';
import CategoriesPage from '@/pages/catalog/CategoriesPage';
import LocationsPage from '@/pages/catalog/LocationsPage';
import ProductsPage from '@/pages/catalog/ProductsPage';
import SuppliersPage from '@/pages/catalog/SuppliersPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import InventoryAlertsPage from '@/pages/inventory/InventoryAlertsPage';
import InventoryLogsPage from '@/pages/inventory/InventoryLogsPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import ScrapOrderCreatePage from '@/pages/inventory/ScrapOrderCreatePage';
import ScrapOrdersPage from '@/pages/inventory/ScrapOrdersPage';
import StocktakePage from '@/pages/inventory/StocktakePage';
import ItemLotsPage from '@/pages/inventory/ItemLotsPage';
import TransferOrdersPage from '@/pages/inventory/TransferOrdersPage';
import ShiftsPage from '@/pages/operations/ShiftsPage';
import PromotionsManagePage from '@/pages/promotions/PromotionsManagePage';
import PromotionsSuggestPage from '@/pages/promotions/PromotionsSuggestPage';
import ImportCreatePage from '@/pages/purchase/ImportCreatePage';
import ImportSlipsPage from '@/pages/purchase/ImportSlipsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import CustomersPage from '@/pages/sales/CustomersPage';
import InvoicesPage from '@/pages/sales/InvoicesPage';
import PosPage from '@/pages/sales/PosPage';
import type { CategoryDto, LocationDto, SupplierDto, UserDto } from '@/types/api';
import type { PageKey, PurchaseSuggestionPrefillItem } from '@/types/pages';

export function PageRenderer({
  page,
  authUser,
  openProduct,
  openModal,
  setPage,
  globalSearch,
  productsList,
  invoicesList,
  categories,
  suppliers,
  locations,
  chatHistory,
  setChatHistory,
  posCart,
  setPosCart,
  cartPanelRef,
  setSelectedInvoice,
  reloadCatalog,
  catalogLoading,
  pendingPurchaseSuggestionItems,
  setPendingPurchaseSuggestionItems,
}: {
  page: PageKey;
  authUser: UserDto;
  openProduct: (product: Product) => void;
  openModal: () => void;
  setPage: (page: PageKey) => void;
  globalSearch: string;
  productsList: Product[];
  invoicesList: any[];
  categories: CategoryDto[];
  suppliers: SupplierDto[];
  locations: LocationDto[];
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  posCart: any[];
  setPosCart: React.Dispatch<React.SetStateAction<any[]>>;
  cartPanelRef: React.RefObject<HTMLDivElement>;
  setSelectedInvoice: (invoice: any) => void;
  reloadCatalog: () => Promise<void>;
  catalogLoading: boolean;
  pendingPurchaseSuggestionItems: PurchaseSuggestionPrefillItem[];
  setPendingPurchaseSuggestionItems: React.Dispatch<React.SetStateAction<PurchaseSuggestionPrefillItem[]>>;
}) {
  if (!canAccessPage(authUser.role, page)) {
    return (
      <Card>
        <CardHeader title="Không có quyền truy cập" description="Liên hệ quản trị để được cấp quyền." />
        <p className="px-5 pb-5 text-sm text-muted">
          Vai trò hiện tại: {roleLabel(authUser.role)}. Các mục được phép:{' '}
          {allowedPages(authUser.role).join(', ')}.
        </p>
      </Card>
    );
  }
  if (page === 'dashboard') {
    return <DashboardPage authUser={authUser} openProduct={openProduct} setPage={setPage} productsList={productsList} invoicesList={invoicesList} />;
  }
  if (page === 'pos') {
    return (
      <PosPage
        categories={categories}
        posCart={posCart}
        setPosCart={setPosCart}
        setPage={setPage}
        reloadCatalog={reloadCatalog}
        catalogLoading={catalogLoading}
        cartPanelRef={cartPanelRef}
      />
    );
  }
  if (page === 'products') {
    return <ProductsPage openProduct={openProduct} openModal={openModal} productsList={productsList} />;
  }
  if (page === 'categories') {
    return <CategoriesPage categories={categories} productsList={productsList} setPage={setPage} openProduct={openProduct} />;
  }
  if (page === 'suppliers') {
    return <SuppliersPage suppliers={suppliers} productsList={productsList} authUser={authUser} reloadCatalog={reloadCatalog} setPage={setPage} />;
  }
  if (page === 'locations') {
    return <LocationsPage locations={locations} productsList={productsList} authUser={authUser} reloadCatalog={reloadCatalog} setPage={setPage} />;
  }
  if (page === 'invoices') {
    return <InvoicesPage setSelectedInvoice={setSelectedInvoice} authUser={authUser} />;
  }
  if (page === 'import-create') {
    return (
      <ImportCreatePage
        productsList={productsList}
        suppliers={suppliers}
        locations={locations}
        setPage={setPage}
        reloadCatalog={reloadCatalog}
        catalogLoading={catalogLoading}
        prefillItems={pendingPurchaseSuggestionItems}
        clearPrefillItems={() => setPendingPurchaseSuggestionItems([])}
      />
    );
  }
  if (page === 'import-slips') {
    return <ImportSlipsPage reloadCatalog={reloadCatalog} globalSearch={globalSearch} />;
  }
  if (page === 'inventory') {
    return <InventoryPage openProduct={openProduct} productsList={productsList} />;
  }
  if (page === 'inventory-alerts') {
    return <InventoryAlertsPage setPage={setPage} />;
  }
  if (page === 'inventory-logs') {
    return <InventoryLogsPage />;
  }
  if (page === 'item-lots') {
    return <ItemLotsPage />;
  }
  if (page === 'stocktake') {
    return <StocktakePage />;
  }
  if (page === 'transfer-orders') {
    return <TransferOrdersPage />;
  }
  if (page === 'shifts') {
    return <ShiftsPage />;
  }
  if (page === 'scrap-orders') {
    return <ScrapOrdersPage setPage={setPage} />;
  }
  if (page === 'scrap-create') {
    return <ScrapOrderCreatePage setPage={setPage} />;
  }
  if (page === 'ai-forecast') {
    return <AiForecastPage productsList={productsList} invoicesList={invoicesList} setPage={setPage} />;
  }
  if (page === 'purchase-suggestions') {
    return (
      <PurchaseSuggestionsPage
        productsList={productsList}
        setPage={setPage}
        setPrefillItems={setPendingPurchaseSuggestionItems}
      />
    );
  }
  if (page === 'expiry-risk') {
    return <ExpiryRiskPage productsList={productsList} setPage={setPage} />;
  }
  if (page === 'customers') {
    return <CustomersPage />;
  }
  if (page === 'promotions') {
    return <PromotionsSuggestPage setPage={setPage} />;
  }
  if (page === 'promotion-manage') {
    return <PromotionsManagePage />;
  }
  if (page === 'ai-assistant') {
    return (
      <AiAssistantPage
        productsList={productsList}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        setPage={setPage}
      />
    );
  }
  if (page === 'reports') {
    return <ReportsPage productsList={productsList} invoicesList={invoicesList} authUser={authUser} />;
  }
  if (page === 'users') {
    return <UsersPage />;
  }
  if (page === 'audit-logs') {
    return <AuditLogsPage />;
  }
  return <SettingsPage />;
}
