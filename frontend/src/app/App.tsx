import * as React from 'react';
import { ConfigProvider, App as AntdApp, message as antdMessage } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { filterNavGroups } from '@/app/config/navItems';
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
import { useCatalog } from '@/hooks/useCatalog';
import { usePosCart } from '@/hooks/usePosCart';
import { animatePageIn } from '@/lib/gsapAnimations';
import type { Product } from '@/lib/itemMapper';
import { pageFromPath, pathFromPage } from '@/lib/pageRoutes';
import { canAccessPage, defaultPageForRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/pages/ai/AiAssistantPage';
import PosPage from '@/pages/sales/PosPage';
import type { PageKey, PurchaseSuggestionPrefillItem } from '@/types/pages';

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
      navigate(pathFromPage(p), { preventScrollReset: true });
      window.requestAnimationFrame(() => {
        mainScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
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

  const {
    productsList,
    invoicesList,
    categories,
    suppliers,
    locations,
    uoms,
    catalogLoading,
    reloadCatalog,
    clearCatalog,
  } = useCatalog(authUser);
  const { posCart, setPosCart, clearCart } = usePosCart();

  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([
    {
      id: 'chat-welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là bộ phận hỗ trợ vận hành SmartMart. Bạn muốn tra cứu tồn kho, phân tích doanh thu hay lên kế hoạch nhập hàng?',
    },
  ]);
  const [pendingPurchaseSuggestionItems, setPendingPurchaseSuggestionItems] = React.useState<
    PurchaseSuggestionPrefillItem[]
  >([]);
  const pageContentRef = React.useRef<HTMLDivElement>(null);
  const mainScrollRef = React.useRef<HTMLDivElement>(null);
  const cartPanelRef = React.useRef<HTMLDivElement>(null);

  const handleLogout = React.useCallback(async () => {
    await authLogout();
    clearCart();
    clearCatalog();
    setPage('dashboard');
    antdMessage.success('Đã đăng xuất');
  }, [authLogout, clearCart, clearCatalog, setPage]);

  const visibleNavGroups = React.useMemo(
    () => filterNavGroups(authUser?.role),
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

  React.useEffect(() => {
    if (!authUser) {
      clearCatalog();
      return;
    }
    if (sessionStorage.getItem('smartmart_token')) {
      reloadCatalog();
    }
  }, [authUser, reloadCatalog, clearCatalog]);

  React.useLayoutEffect(() => {
    if (authUser) animatePageIn(pageContentRef.current);
  }, [page, authUser]);

  if (!sessionReady) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Đang tải…</div>;
  }

  if (!authUser || !sessionStorage.getItem('smartmart_token')) {
    return (
      <LoginScreen
        onSuccess={() => {
          reloadCatalog();
        }}
      />
    );
  }

  const pageMeta = pageTitles[page];
  const isStandalonePos = location.pathname === '/pos' || page === 'pos';
  const antdTheme = {
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
  };
  const renderedPage = (
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
      uoms={uoms}
      chatHistory={chatHistory}
      setChatHistory={setChatHistory}
      posCart={posCart}
      setPosCart={setPosCart}
      cartPanelRef={cartPanelRef}
      setSelectedInvoice={setSelectedInvoice}
      reloadCatalog={reloadCatalog}
      catalogLoading={catalogLoading}
      pendingPurchaseSuggestionItems={pendingPurchaseSuggestionItems}
      setPendingPurchaseSuggestionItems={setPendingPurchaseSuggestionItems}
    />
  );

  if (isStandalonePos) {
    return (
      <ConfigProvider theme={antdTheme}>
        <AntdApp>
          <div ref={pageContentRef} className="h-[100dvh] overflow-hidden text-ink">
            <PosPage
              categories={categories}
              posCart={posCart}
              setPosCart={setPosCart}
              setPage={setPage}
              reloadCatalog={reloadCatalog}
              catalogLoading={catalogLoading}
              cartPanelRef={cartPanelRef}
            />
          </div>
        </AntdApp>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <AntdApp>
        <div className={cn('h-[100dvh] overflow-hidden text-ink', themeMode === 'dark' ? 'bg-slate-900' : 'app-shell-bg')}>
          <Sidebar
            page={page}
            setPage={setPage}
            navGroups={visibleNavGroups}
            authUser={authUser}
            onLogout={handleLogout}
          />
          <MobileNav
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            page={page}
            setPage={setPage}
            navGroups={visibleNavGroups}
            onLogout={handleLogout}
          />
          <main className="flex h-[100dvh] flex-col overflow-hidden md:pl-[260px]">
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
            <div
              ref={mainScrollRef}
              className="scrollbar-thin min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
            >
              <div
                ref={pageContentRef}
                className={cn(
                  'mx-auto px-4 py-5 sm:px-6',
                  page === 'ai-assistant' ? 'max-w-[1480px]' : 'max-w-[1220px]'
                )}
              >
                {renderedPage}
              </div>
            </div>
          </main>
          <ProductDrawer
            product={drawerProduct}
            categories={categories}
            authUser={authUser}
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
