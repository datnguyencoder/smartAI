import { ConfigProvider, App as AntdApp, message as antdMessage } from 'antd';
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navItems } from '@/app/config/navItems';
import { pageTitles } from '@/app/config/pageTitles';
import { MobileNav } from '@/app/layout/MobileNav';
import { PageRenderer } from '@/app/layout/PageRenderer';
import { Sidebar } from '@/app/layout/Sidebar';
import { Topbar } from '@/app/layout/Topbar';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { CreateProductModal } from '@/components/catalog/CreateProductModal';
import { ProductDrawer } from '@/components/catalog/ProductDrawer';
import { InvoiceDrawer } from '@/components/sales/InvoiceDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { animatePageIn } from '@/lib/gsapAnimations';
import { itemToProduct, type Product } from '@/lib/itemMapper';
import { ordersToInvoices } from '@/lib/mappers/ordersToInvoices';
import { pageFromPath, pathFromPage } from '@/lib/pageRoutes';
import {
  canAccessPage,
  canFetchOrders,
  defaultPageForRole,
  normalizeRole,
} from '@/lib/permissions';
import type { ImportSlipRow } from '@/lib/purchaseMapper';
import { cn } from '@/lib/utils';
import {
  fetchCategories,
  fetchInventory,
  fetchItems,
  fetchLocations,
  fetchOrders,
  fetchPurchaseOrdersPaged,
  fetchSuppliers,
  fetchUoms,
} from '@/services/wmsApi';
import type { CategoryDto, LocationDto, SupplierDto, UomDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

function App() {
  const { antdAlgorithm, mode: themeMode, toggle: toggleTheme } = useTheme();
  const { authUser, sessionReady, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPageState] = React.useState<PageKey>(() =>
    pageFromPath(window.location.pathname) || 'dashboard'
  );
  const setPage = React.useCallback(
    (p: PageKey) => {
      setPageState(p);
      navigate(pathFromPage(p));
    },
    [navigate]
  );
  React.useEffect(() => {
    setPageState(pageFromPath(location.pathname));
  }, [location.pathname]);
  const [drawerProduct, setDrawerProduct] = React.useState<Product | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [globalSearch, setGlobalSearch] = React.useState('');

  const [productsList, setProductsList] = React.useState<Product[]>([]);
  const [invoicesList, setInvoicesList] = React.useState<any[]>([]);
  const [, setImportSlips] = React.useState<ImportSlipRow[]>([]);
  const [categories, setCategories] = React.useState<CategoryDto[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierDto[]>([]);
  const [locations, setLocations] = React.useState<LocationDto[]>([]);
  const [uoms, setUoms] = React.useState<UomDto[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<
    Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>
  >([
    {
      sender: 'ai',
      text: 'Chào bạn! Tôi là trợ lý vận hành AI. Bạn cần tôi phân tích hàng tồn kho, lập chiến dịch khuyến mãi giảm giá hay lên phiếu nhập hàng giúp không?',
    },
  ]);
  const [posCart, setPosCart] = React.useState<Array<{ product: Product; quantity: number }>>([]);
  const pageContentRef = React.useRef<HTMLDivElement>(null);
  const cartPanelRef = React.useRef<HTMLDivElement>(null);

  const clearCatalog = React.useCallback(() => {
    setProductsList([]);
    setInvoicesList([]);
    setImportSlips([]);
    setCategories([]);
    setSuppliers([]);
    setLocations([]);
    setUoms([]);
  }, []);

  const handleLogout = React.useCallback(async () => {
    await authLogout();
    setPosCart([]);
    clearCatalog();
    setPage('dashboard');
    antdMessage.success('Đã đăng xuất');
  }, [authLogout, clearCatalog, setPage]);

  const visibleNavItems = React.useMemo(
    () => navItems.filter((item) => canAccessPage(authUser?.role, item.key)),
    [authUser?.role]
  );

  React.useEffect(() => {
    if (!authUser) return;
    if (!canAccessPage(authUser.role, page)) {
      const fallback = defaultPageForRole(authUser.role);
      setPage(fallback);
      antdMessage.warning('Bạn không có quyền truy cập mục này');
    }
  }, [authUser, page, setPage]);

  const reloadCatalog = React.useCallback(async () => {
    if (!authUser) return;
    setCatalogLoading(true);
    const role = normalizeRole(authUser.role);
    const ordersTask = canFetchOrders(role) ? fetchOrders() : Promise.resolve([]);

    try {
      const [items, orders, cats, sups, locs, uomList, inventoryList] = await Promise.all([
        fetchItems().catch(() => []),
        authUser && canAccessPage(authUser.role, 'invoices') ? ordersTask.catch(() => []) : Promise.resolve([]),
        fetchCategories().catch(() => []),
        authUser && canAccessPage(authUser.role, 'suppliers') ? fetchSuppliers().catch(() => []) : Promise.resolve([]),
        authUser && canAccessPage(authUser.role, 'locations') ? fetchLocations().catch(() => []) : Promise.resolve([]),
        fetchUoms().catch(() => []),
        authUser && canAccessPage(authUser.role, 'inventory') ? fetchInventory().catch(() => []) : Promise.resolve([]),
      ]);

      const extractArray = (data: any) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.content)) return data.content;
        if (Array.isArray(data.data)) return data.data;
        return [];
      };
      const stockMap: Record<number, number> = {};

      extractArray(inventoryList).forEach((inv: any) => {
        stockMap[inv.itemId] = (stockMap[inv.itemId] || 0) + Number(inv.quantity || 0);
      });

      setProductsList(
        extractArray(items).map((item: any) => {
          const prod = itemToProduct(item);
          if (stockMap[item.id] !== undefined) {
            prod.stock = Math.round(stockMap[item.id]);
            if (prod.stock === 0) prod.status = 'Hết hàng';
            else if (prod.stock <= (item.minimumStock ?? 0)) prod.status = 'Sắp hết';
            else prod.status = 'Còn hàng';
          }
          return prod;
        })
      );
      setInvoicesList(ordersToInvoices(extractArray(orders)));
      setCategories(extractArray(cats));
      setSuppliers(extractArray(sups));
      setLocations(extractArray(locs));
      setUoms(extractArray(uomList));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được dữ liệu API');
    } finally {
      setCatalogLoading(false);
    }
  }, [authUser]);

  React.useEffect(() => {
    if (!authUser) {
      clearCatalog();
      return;
    }
    if (localStorage.getItem('smartmart_token')) {
      reloadCatalog();
    }
  }, [authUser, reloadCatalog, clearCatalog]);

  React.useLayoutEffect(() => {
    if (authUser) animatePageIn(pageContentRef.current);
  }, [page, authUser]);

  if (!sessionReady) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Đang tải…</div>;
  }

  if (!authUser || !localStorage.getItem('smartmart_token')) {
    return (
      <LoginScreen
        onSuccess={() => {
          reloadCatalog();
        }}
      />
    );
  }

  const pageMeta = pageTitles[page];

  return (
    <ConfigProvider
      theme={{
        algorithm: antdAlgorithm,
        token: {
          colorPrimary: '#006c49',
          colorInfo: '#4648d4',
          borderRadius: 8,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
        components: {
          Button: { controlHeight: 40, fontWeight: 600 },
          Table: { headerBg: '#f8fafc', headerColor: '#64748b', rowHoverBg: '#f8fffc' },
          Input: { controlHeight: 40 },
        },
      }}
    >
      <AntdApp>
        <div className={cn('min-h-screen text-ink', themeMode === 'dark' ? 'bg-slate-900' : 'bg-[#f8fafc]')}>
          <Sidebar
            page={page}
            setPage={setPage}
            navItems={visibleNavItems}
            authUser={authUser}
            onLogout={handleLogout}
          />
          <MobileNav
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            page={page}
            setPage={setPage}
            navItems={visibleNavItems}
            onLogout={handleLogout}
          />
          <main className="min-h-screen md:pl-[260px]">
            <Topbar
              title={pageMeta.title}
              description={pageMeta.description}
              authUser={authUser}
              page={page}
              setPage={setPage}
              setModalOpen={setModalOpen}
              openMobileNav={() => setMobileNavOpen(true)}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              onToggleTheme={toggleTheme}
              themeMode={themeMode}
            />
            <div ref={pageContentRef} className="mx-auto max-w-[1220px] px-4 py-5 sm:px-6">
              <PageRenderer
                page={page}
                authUser={authUser}
                openProduct={setDrawerProduct}
                openModal={() => setModalOpen(true)}
                setPage={setPage}
                globalSearch={globalSearch}
                productsList={productsList}
                invoicesList={invoicesList}
                categories={categories}
                suppliers={suppliers}
                locations={locations}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                posCart={posCart}
                setPosCart={setPosCart}
                cartPanelRef={cartPanelRef}
                setSelectedInvoice={setSelectedInvoice}
                reloadCatalog={reloadCatalog}
                catalogLoading={catalogLoading}
              />
            </div>
          </main>
          <ProductDrawer
            product={drawerProduct}
            onClose={() => setDrawerProduct(null)}
            onUpdated={reloadCatalog}
          />
          <InvoiceDrawer
            invoice={selectedInvoice}
            authUser={authUser}
            onClose={() => setSelectedInvoice(null)}
            onCancelled={() => setSelectedInvoice(null)}
          />
          <CreateProductModal
            open={modalOpen}
            onCancel={() => setModalOpen(false)}
            page={page}
            categories={categories}
            uoms={uoms}
            onCreated={reloadCatalog}
          />
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
