import {
  Avatar,
  Badge,
  Button,
  ConfigProvider,
  App as AntdApp,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Progress,
  Select,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  Alert,
  message as antdMessage,
} from 'antd';
import * as React from 'react';
import dayjs from 'dayjs';
import ReactSelect from 'react-select';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { motion } from 'framer-motion';
import { animateCartBump, animateDrawer, animateModalContent, animatePageIn } from './lib/gsapAnimations';
import { purchaseToSlip, type ImportSlipRow } from './lib/purchaseMapper';

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  BrainCircuit,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileInput,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Menu,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Tags,
  Truck,
  UsersRound,
  WandSparkles,
  BadgePercent,
  Warehouse,
  Printer,
  Trash2,
  ScrollText,
  Send,
  UserCheck,
  FileClock,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  Label,
} from 'recharts';
import { Card, CardHeader, StatusChip, UiButton } from './components/ui';
import { LoginScreen } from './components/LoginScreen';
import { ProductDrawer } from './components/ProductDrawer';
import { ProductsTable } from './components/products/ProductsTable';
import { ProductThumbnail } from './components/ProductThumbnail';
import { CreateProductModal } from './components/CreateProductModal';
import ImportCreatePage from './pages/ImportCreatePage';
import ImportSlipsPage from './pages/ImportSlipsPage';
import InventoryLogsPage from './pages/InventoryLogsPage';
import LocationsPage from './pages/LocationsPage';
import PosPage from './pages/PosPage';
import CustomersPage from './pages/CustomersPage';
import PromotionsManagePage from './pages/PromotionsManagePage';
import PromotionsSuggestPage from './pages/PromotionsSuggestPage';
import ScrapOrdersPage from './pages/ScrapOrdersPage';
import ScrapOrderCreatePage from './pages/ScrapOrderCreatePage';
import { MarkdownMessage } from './components/MarkdownMessage';
import { cn } from './lib/utils';
// import { normalizeRole } from './lib/permissions';
import { itemToProduct, formatMoney, statusTone, type Product } from './lib/itemMapper';
import type { PageKey } from './types/pages';
import {
  aiChat,
  createOrder,
  fetchForecastItemDetail,
  fetchOrderPrint,
  fetchDashboardSummary,
  fetchInventory,
  fetchInventoryAlerts,
  fetchRecentAuditLogs,
  fetchNearExpiry,
  fetchUsers,
  fetchItemByBarcode,
  createPurchaseOrder,
  fetchCategories,
  fetchDashboardRevenue,
  fetchForecastResults,
  fetchAiStatus,
  cancelOrder,
  fetchItems,
  fetchLocations,
  fetchOrders,
  fetchOrdersPaged,
  fetchReorderRecommendations,
  fetchSuppliers,
  fetchUoms,
  updateItem,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  fetchPurchaseOrders,
  fetchPurchaseOrdersPaged,
  runForecast,
  trainForecast,
  createUser,
  updateUser,
  lockUser,
  softDeleteUser,
  updateSupplier,
  fetchAuditLogs,
  fetchAuditLogsByAction,
  fetchAuditLogsByUsername,
  fetchAuditLogsByEntity,
  unlockUser,
  fetchAuditLogActions
} from './services/wmsApi';
import {
  fetchSalesReport,
  fetchPurchaseReport,
  fetchInventoryReport,
  fetchSettings,
  updateSetting,
} from './services/wmsApi';
import type {
  AuditLogDto,
  CategoryDto,
  DashboardSummaryDto,
  InventoryAlertDto,
  InventoryReportDto,
  LocationDto,
  PurchaseReportDto,
  Role,
  SalesReportDto,
  AiStatusDto,
  SupplierDto,
  UomDto,
  UserDto,
  UserStatus,
} from './types/api';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { pageFromPath, pathFromPage } from './lib/pageRoutes';
import {
  allowedPages,
  canAccessPage,
  canFetchOrders,
  canQuickCreate,
  defaultPageForRole,
  normalizeRole,
  roleLabel,
} from './lib/permissions';

type NavItem = { key: PageKey; label: string; icon: typeof LayoutDashboard };

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Báº£ng Ä‘iá»u khiá»ƒn', icon: LayoutDashboard },
  { key: 'products', label: 'Sáº£n pháº©m', icon: Package },
  { key: 'categories', label: 'Danh má»¥c', icon: Tags },
  { key: 'suppliers', label: 'NhÃ  cung cáº¥p', icon: Truck },
  { key: 'locations', label: 'Vá»‹ trÃ­ kho', icon: Building2 },
  { key: 'pos', label: 'BÃ¡n hÃ ng táº¡i quáº§y', icon: ShoppingCart },
  { key: 'customers', label: 'KhÃ¡ch hÃ ng', icon: UserCheck },
  { key: 'invoices', label: 'HÃ³a Ä‘Æ¡n bÃ¡n hÃ ng', icon: ReceiptText },
  { key: 'import-create', label: 'Táº¡o phiáº¿u nháº­p', icon: FileInput },
  { key: 'import-slips', label: 'Phiáº¿u nháº­p hÃ ng', icon: ClipboardCheck },
  { key: 'inventory', label: 'Tá»“n kho', icon: Warehouse },
  { key: 'scrap-orders', label: 'Quáº£n lÃ½ YÃªu cáº§u loáº¡i bá»', icon: Trash2 },
  { key: 'scrap-create', label: 'Táº¡o YÃªu cáº§u loáº¡i bá»', icon: Plus },
  { key: 'inventory-alerts', label: 'Cáº£nh bÃ¡o tá»“n kho', icon: AlertTriangle },
  { key: 'inventory-logs', label: 'Lá»‹ch sá»­ biáº¿n Ä‘á»™ng', icon: ScrollText },
  { key: 'ai-forecast', label: 'Dá»± bÃ¡o AI', icon: BrainCircuit },
  { key: 'purchase-suggestions', label: 'Gá»£i Ã½ nháº­p hÃ ng', icon: Bot },
  { key: 'expiry-risk', label: 'Rá»§i ro háº¿t háº¡n', icon: CalendarClock },
  { key: 'promotions', label: 'Äá» xuáº¥t KM (AI)', icon: WandSparkles },
  { key: 'promotion-manage', label: 'Quáº£n lÃ½ mÃ£ KM', icon: BadgePercent },
  { key: 'ai-assistant', label: 'Trá»£ lÃ½ AI', icon: Sparkles },
  { key: 'reports', label: 'BÃ¡o cÃ¡o há»‡ thá»‘ng', icon: BarChart3 },
  { key: 'users', label: 'NgÆ°á»i dÃ¹ng', icon: UsersRound },
  { key: 'settings', label: 'CÃ i Ä‘áº·t há»‡ thá»‘ng', icon: Settings },
  {key: 'audit-logs', label: 'Nháº­t kÃ½ há»‡ thá»‘ng', icon: FileClock },
];

const salesData = [
  { day: 'T2', revenue: 7.8, forecast: 8.4, orders: 96 },
  { day: 'T3', revenue: 9.2, forecast: 9.8, orders: 118 },
  { day: 'T4', revenue: 8.7, forecast: 9.1, orders: 103 },
  { day: 'T5', revenue: 12.5, forecast: 13.0, orders: 142 },
  { day: 'T6', revenue: 10.8, forecast: 11.5, orders: 131 },
  { day: 'T7', revenue: 16.4, forecast: 17.1, orders: 194 },
  { day: 'CN', revenue: 14.9, forecast: 15.7, orders: 178 },
];

const categoryData = [
  { name: 'Äá»“ uá»‘ng', value: 34, color: '#10b981' },
  { name: 'BÃ¡nh káº¹o', value: 22, color: '#4648d4' },
  { name: 'Thá»±c pháº©m', value: 18, color: '#f59e0b' },
  { name: 'Gia dá»¥ng', value: 14, color: '#0ea5e9' },
  { name: 'KhÃ¡c', value: 12, color: '#94a3b8' },
];

const money = formatMoney;

function ordersToInvoices(orders: Awaited<ReturnType<typeof fetchOrders>>) {
  return orders.map((o) => ({
    key: o.orderCode,
    orderId: o.id,
    rawStatus: o.status,
    customer: o.customerName,
    amount: Number(o.totalAmount),
    cashier: o.cashierName || 'Há»‡ thá»‘ng',
    status: o.status === 'CANCELLED' ? 'ÄÃ£ há»§y' : 'ÄÃ£ thanh toÃ¡n',
    time: new Date(o.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    subtotal: Number(o.totalAmount) / 1.08,
    discount: Number(o.discountAmount || 0),
    vat: Number(o.totalAmount) * 0.08 / 1.08,
    items: (o.items ?? []).map((i) => ({ name: i.itemName, qty: Number(i.quantity), price: Number(i.unitPrice) })),
  }));
}

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
      text: 'ChÃ o báº¡n! TÃ´i lÃ  trá»£ lÃ½ váº­n hÃ nh AI. Báº¡n cáº§n tÃ´i phÃ¢n tÃ­ch hÃ ng tá»“n kho, láº­p chiáº¿n dá»‹ch khuyáº¿n mÃ£i giáº£m giÃ¡ hay lÃªn phiáº¿u nháº­p hÃ ng giÃºp khÃ´ng?',
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
    antdMessage.success('ÄÃ£ Ä‘Äƒng xuáº¥t');
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
      antdMessage.warning('Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p má»¥c nÃ y');
    }
  }, [authUser, page]);

  const reloadCatalog = React.useCallback(async () => {
    if (!authUser) return;
    setCatalogLoading(true);
    const role = normalizeRole(authUser.role);
    const ordersTask = canFetchOrders(role) ? fetchOrders() : Promise.resolve([]);
    const purchasesTask =
      role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER' || role === 'ROLE_WAREHOUSE'
        ? fetchPurchaseOrdersPaged(0, 100)
        : Promise.resolve(null);

    try {
      const [items, orders, cats, sups, locs, uomList, inventoryList] = await Promise.all([
        fetchItems().catch(() => []),
        (authUser && canAccessPage(authUser.role, 'invoices')) ? fetchOrders().catch(() => []) : Promise.resolve([]),
        fetchCategories().catch(() => []),
        (authUser && canAccessPage(authUser.role, 'suppliers')) ? fetchSuppliers().catch(() => []) : Promise.resolve([]),
        (authUser && canAccessPage(authUser.role, 'locations')) ? fetchLocations().catch(() => []) : Promise.resolve([]),
        fetchUoms().catch(() => []),
        (authUser && canAccessPage(authUser.role, 'inventory')) ? fetchInventory().catch(() => []) : Promise.resolve([]),
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
        stockMap[inv.itemId] =
          (stockMap[inv.itemId] || 0) + Number(inv.quantity || 0);
      });

      setProductsList(extractArray(items).map((item: any) => {
        const prod = itemToProduct(item);
        if (stockMap[item.id] !== undefined) {
          prod.stock = Math.round(stockMap[item.id]);
          if (prod.stock === 0) prod.status = 'Háº¿t hÃ ng';
          else if (prod.stock <= (item.minimumStock ?? 0)) prod.status = 'Sáº¯p háº¿t';
          else prod.status = 'CÃ²n hÃ ng';
        }
        return prod;
      }));
      setInvoicesList(ordersToInvoices(extractArray(orders)));
      setCategories(extractArray(cats));
      setSuppliers(extractArray(sups));
      setLocations(extractArray(locs));
      setUoms(extractArray(uomList));
      console.log('Catalog loaded TEXT:', JSON.stringify({ items, orders, cats, sups, locs, uomList }).substring(0, 500));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'KhÃ´ng táº£i Ä‘Æ°á»£c dá»¯ liá»‡u API');
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
    return <div className="min-h-screen grid place-items-center text-slate-500">Äang táº£iâ€¦</div>;
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

const pageTitles: Record<PageKey, { title: string; description: string }> = {
  dashboard: { title: 'Báº£ng Ä‘iá»u khiá»ƒn', description: 'Tá»•ng quan doanh thu, tá»“n kho, cáº£nh bÃ¡o vÃ  dá»± bÃ¡o AI.' },
  products: { title: 'Quáº£n lÃ½ sáº£n pháº©m', description: 'Theo dÃµi SKU, giÃ¡ bÃ¡n, tá»“n kho vÃ  tráº¡ng thÃ¡i kinh doanh.' },
  categories: { title: 'Quáº£n lÃ½ danh má»¥c', description: 'Tá»• chá»©c nhÃ³m hÃ ng, biÃªn lá»£i nhuáº­n vÃ  sá»‘ lÆ°á»£ng sáº£n pháº©m.' },
  suppliers: { title: 'Quáº£n lÃ½ nhÃ  cung cáº¥p', description: 'Theo dÃµi Ä‘á»‘i tÃ¡c, cÃ´ng ná»£, lá»‹ch giao hÃ ng vÃ  SLA.' },
  locations: { title: 'Vá»‹ trÃ­ kho hÃ ng', description: 'SÆ¡ Ä‘á»“ kho, sá»©c chá»©a vÃ  khu vá»±c lÆ°u trá»¯ hÃ ng hÃ³a.' },
  pos: { title: 'BÃ¡n hÃ ng táº¡i quáº§y POS', description: 'QuÃ©t sáº£n pháº©m, táº¡o giá» hÃ ng vÃ  thanh toÃ¡n nhanh.' },
  customers: { title: 'Quáº£n lÃ½ khÃ¡ch hÃ ng', description: 'Tra cá»©u SÄT, Ä‘iá»ƒm tÃ­ch lÅ©y vÃ  lá»‹ch sá»­ mua hÃ ng.' },
  invoices: { title: 'HÃ³a Ä‘Æ¡n bÃ¡n hÃ ng', description: 'Tra cá»©u hÃ³a Ä‘Æ¡n, tráº¡ng thÃ¡i thanh toÃ¡n vÃ  giao dá»‹ch hoÃ n tiá»n.' },
  'import-create': { title: 'Táº¡o phiáº¿u nháº­p hÃ ng', description: 'Nháº­p hÃ ng tá»« nhÃ  cung cáº¥p vá»›i kiá»ƒm tra tá»“n kho tá»©c thá»i.' },
  'import-slips': { title: 'Phiáº¿u nháº­p hÃ ng', description: 'Quáº£n lÃ½ phiáº¿u nháº­p, tráº¡ng thÃ¡i duyá»‡t vÃ  lá»‹ch nháº­n hÃ ng.' },
  inventory: { title: 'Quáº£n lÃ½ tá»“n kho', description: 'Kiá»ƒm soÃ¡t tá»“n theo kho, ngÆ°á»¡ng cáº£nh bÃ¡o vÃ  vÃ²ng quay hÃ ng.' },
  'scrap-orders': { title: 'Quáº£n lÃ½ YÃªu cáº§u loáº¡i bá» hÃ ng hÃ³a', description: 'Danh sÃ¡ch vÃ  duyá»‡t cÃ¡c yÃªu cáº§u xuáº¥t há»§y hÃ ng hÃ³a.' },
  'scrap-create': { title: 'Táº¡o YÃªu cáº§u loáº¡i bá» hÃ ng hÃ³a', description: 'Táº¡o phiáº¿u xuáº¥t há»§y hÃ ng hÃ³a há»ng, lá»—i, hoáº·c háº¿t háº¡n.' },
  'inventory-alerts': { title: 'Cáº£nh bÃ¡o tá»“n kho', description: 'Æ¯u tiÃªn sáº£n pháº©m háº¿t hÃ ng, sáº¯p háº¿t vÃ  tá»“n báº¥t thÆ°á»ng.' },
  'inventory-logs': { title: 'Lá»‹ch sá»­ biáº¿n Ä‘á»™ng kho', description: 'Nháº­t kÃ½ toÃ n bá»™ biáº¿n Ä‘á»™ng nháº­p, xuáº¥t, há»§y vÃ  Ä‘iá»u chá»‰nh tá»“n kho.' },
  'ai-forecast': { title: 'Dá»± bÃ¡o AI', description: 'MÃ´ hÃ¬nh dá»± bÃ¡o nhu cáº§u, doanh thu vÃ  rá»§i ro váº­n hÃ nh.' },
  'purchase-suggestions': { title: 'Gá»£i Ã½ nháº­p hÃ ng', description: 'Äá» xuáº¥t sá»‘ lÆ°á»£ng nháº­p tá»‘i Æ°u dá»±a trÃªn tá»‘c Ä‘á»™ bÃ¡n.' },
  'expiry-risk': { title: 'Rá»§i ro háº¿t háº¡n', description: 'Theo dÃµi lÃ´ hÃ ng gáº§n háº¿t háº¡n vÃ  Ä‘á» xuáº¥t xá»­ lÃ½.' },
  promotions: { title: 'Äá» xuáº¥t KM (AI)', description: 'Gemini Ä‘á» xuáº¥t giáº£m giÃ¡ â€” Manager duyá»‡t â†’ mÃ£ KM dÃ¹ng táº¡i POS.' },
  'promotion-manage': { title: 'Quáº£n lÃ½ mÃ£ KM', description: 'Táº¡o mÃ£ giáº£m giÃ¡, thá»i háº¡n Ã¡p dá»¥ng vÃ  dÃ¹ng ngay táº¡i POS.' },
  'ai-assistant': { title: 'Trá»£ lÃ½ AI', description: 'Há»i Ä‘Ã¡p nghiá»‡p vá»¥, phÃ¢n tÃ­ch bÃ¡n hÃ ng vÃ  táº¡o tÃ¡c vá»¥ nhanh.' },
  reports: { title: 'BÃ¡o cÃ¡o há»‡ thá»‘ng', description: 'BÃ¡o cÃ¡o doanh thu, tá»“n kho, nhÃ¢n sá»± vÃ  hiá»‡u quáº£ AI.' },
  users: { title: 'Quáº£n lÃ½ ngÆ°á»i dÃ¹ng', description: 'PhÃ¢n quyá»n nhÃ¢n viÃªn, vai trÃ² vÃ  nháº­t kÃ½ truy cáº­p.' },
  settings: { title: 'CÃ i Ä‘áº·t há»‡ thá»‘ng', description: 'Cáº¥u hÃ¬nh cá»­a hÃ ng, AI, cáº£nh bÃ¡o vÃ  tÃ­ch há»£p.' },
  'audit-logs': {
  title: 'Nháº­t kÃ½ há»‡ thá»‘ng',
  description: 'Theo dÃµi lá»‹ch sá»­ thao tÃ¡c, thay Ä‘á»•i dá»¯ liá»‡u vÃ  hoáº¡t Ä‘á»™ng ngÆ°á»i dÃ¹ng.',
  },
};

function Sidebar({
  page,
  setPage,
  navItems: items,
  authUser,
  onLogout,
}: {
  page: PageKey;
  setPage: (page: PageKey) => void;
  navItems: NavItem[];
  authUser: UserDto;
  onLogout: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-slate-800 bg-navy py-4 md:flex">
      <div className="mb-7 flex items-center gap-3 px-6">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-emerald to-indigo text-white shadow-pop">
          <Store size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-white">SmartMart AI</h1>
          <p className="text-xs text-slate-300">Quáº£n lÃ½ siÃªu thá»‹ mini báº±ng AI</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={cn(
                'relative mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-300 ease-out',
                active ? 'text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebarActiveBg"
                  className="absolute inset-0 rounded-lg border-l-4 border-emerald bg-primary/90 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon size={18} className={cn('transition-transform duration-300', active && 'scale-110')} />
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mx-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        <UiButton variant="secondary" className="mb-4 w-full bg-indigo">
          <Sparkles size={16} /> NÃ¢ng cáº¥p AI Pro
        </UiButton>
        <p className="mb-2 px-2 text-xs text-slate-400 truncate">
          {authUser.fullName ?? authUser.username} Â· {roleLabel(authUser.role)}
        </p>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={onLogout}
        >
          <LogOut size={16} /> ÄÄƒng xuáº¥t
        </button>
      </div>
    </aside>
  );
}

function MobileNav({
  open,
  onClose,
  page,
  setPage,
  navItems: items,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  page: PageKey;
  setPage: (page: PageKey) => void;
  navItems: NavItem[];
  onLogout: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} placement="left" width={300} className="mobile-nav-drawer" styles={{ body: { padding: 0 } }}>
      <div className="min-h-full bg-navy py-4">
        <div className="mb-5 flex items-center gap-3 px-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-emerald to-indigo text-white">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">SmartMart AI</h1>
            <p className="text-xs text-slate-300">Quáº£n lÃ½ siÃªu thá»‹ mini báº±ng AI</p>
          </div>
        </div>
        <nav className="px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setPage(item.key);
                  onClose();
                }}
                className={cn(
                  'relative mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-300 ease-out',
                  active ? 'text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobileActiveBg"
                    className="absolute inset-0 rounded-lg border-l-4 border-emerald bg-primary/90 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon size={18} className={cn('transition-transform duration-300', active && 'scale-110')} />
                  <span>{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="mt-4 px-4">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <LogOut size={16} /> ÄÄƒng xuáº¥t
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function Topbar({
  title,
  description,
  authUser,
  page,
  setPage,
  setModalOpen,
  openMobileNav,
  globalSearch,
  setGlobalSearch,
  onToggleTheme,
  themeMode,
}: {
  title: string;
  description: string;
  authUser: UserDto;
  page: PageKey;
  setPage: (page: PageKey) => void;
  setModalOpen: (open: boolean) => void;
  openMobileNav: () => void;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  onToggleTheme: () => void;
  themeMode: 'light' | 'dark';
}) {
  const showQuickCreate = canQuickCreate(authUser.role, page);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-[#f8fafc]/88 backdrop-blur">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Button className="md:hidden" icon={<Menu size={17} />} onClick={openMobileNav} aria-label="Má»Ÿ menu" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted">
            <Home size={14} /> SmartMart AI <ChevronRight size={14} /> {title}
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <div className="hidden min-w-[480px] items-center justify-end gap-3 lg:flex">
          <Input
            prefix={<Search size={16} />}
            placeholder="TÃ¬m kiáº¿m sáº£n pháº©m, hÃ³a Ä‘Æ¡n, cáº£nh bÃ¡o..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            allowClear
          />
          <Button
            icon={themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            onClick={onToggleTheme}
            aria-label="Äá»•i giao diá»‡n"
          />
          <SystemActivityBell authUser={authUser} setPage={setPage} />
          {showQuickCreate && (
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Táº¡o nhanh
            </Button>
          )}
          <span className="text-xs font-medium text-muted hidden xl:inline">{roleLabel(authUser.role)}</span>
        </div>
        {showQuickCreate && (
          <Button className="lg:hidden" type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            Táº¡o
          </Button>
        )}
      </div>
    </header>
  );
}

function SystemActivityBell({
  authUser,
  setPage,
}: {
  authUser: UserDto;
  setPage: (page: PageKey) => void;
}) {
  const [activities, setActivities] = React.useState<AuditLogDto[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const storageKey = `smartmart_activity_read_at:${authUser.id}`;
  const [readAt, setReadAt] = React.useState(() => localStorage.getItem(storageKey) ?? '');

  const loadActivities = React.useCallback(async () => {
    try {
      setActivities(await fetchRecentAuditLogs(20));
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadActivities();
    const timer = window.setInterval(loadActivities, 15_000);
    return () => window.clearInterval(timer);
  }, [loadActivities]);

  const unreadCount = activities.filter((activity) => !readAt || activity.createdAt > readAt).length;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && activities[0]) {
      const latest = activities[0].createdAt;
      localStorage.setItem(storageKey, latest);
      setReadAt(latest);
    }
  };

  const content = (
    <div className="w-[360px] max-w-[calc(100vw-32px)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-3">
        <div>
          <strong className="text-sm text-ink">Hoáº¡t Ä‘á»™ng há»‡ thá»‘ng</strong>
          <p className="text-xs text-muted">Tá»± Ä‘á»™ng cáº­p nháº­t má»—i 15 giÃ¢y</p>
        </div>
        <Button type="link" size="small" onClick={() => setPage('inventory-alerts')}>
          Cáº£nh bÃ¡o kho
        </Button>
      </div>
      <div className="max-h-[420px] overflow-y-auto py-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Äang táº£i hoáº¡t Ä‘á»™ng...</p>
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">ChÆ°a cÃ³ hoáº¡t Ä‘á»™ng má»›i.</p>
        ) : (
          activities.map((activity) => (
            <div className="flex gap-3 border-b border-slate-100 px-1 py-3 last:border-0" key={activity.id}>
              <span
                className={cn(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                  activity.action.includes('CANCEL') || activity.action.includes('LOCK')
                    ? 'bg-red-500'
                    : activity.action.includes('PURCHASE') || activity.action.includes('ITEM')
                      ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{activity.detail || activity.action}</p>
                <p className="mt-1 text-xs text-muted">
                  {activity.username} Â· {formatActivityTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      trigger="click"
    >
      <Badge count={unreadCount} size="small" overflowCount={9}>
        <Button icon={<Bell size={16} />} aria-label="Xem hoáº¡t Ä‘á»™ng há»‡ thá»‘ng" />
      </Badge>
    </Popover>
  );
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Vá»«a xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phÃºt trÆ°á»›c`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giá» trÆ°á»›c`;
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function PageRenderer({
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
  chatHistory: any[];
  setChatHistory: React.Dispatch<React.SetStateAction<any[]>>;
  posCart: any[];
  setPosCart: React.Dispatch<React.SetStateAction<any[]>>;
  cartPanelRef: React.RefObject<HTMLDivElement>;
  setSelectedInvoice: (invoice: any) => void;
  reloadCatalog: () => Promise<void>;
  catalogLoading: boolean;
}) {
  if (!canAccessPage(authUser.role, page)) {
    return (
      <Card>
        <CardHeader title="KhÃ´ng cÃ³ quyá»n truy cáº­p" description="LiÃªn há»‡ quáº£n trá»‹ Ä‘á»ƒ Ä‘Æ°á»£c cáº¥p quyá»n." />
        <p className="px-5 pb-5 text-sm text-muted">
          Vai trÃ² hiá»‡n táº¡i: {roleLabel(authUser.role)}. CÃ¡c má»¥c Ä‘Æ°á»£c phÃ©p:{' '}
          {allowedPages(authUser.role).join(', ')}.
        </p>
      </Card>
    );
  }
  if (page === 'dashboard') {
    return <Dashboard authUser={authUser} openProduct={openProduct} setPage={setPage} productsList={productsList} invoicesList={invoicesList} />;
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
    return <CategoriesPage categories={categories} productsList={productsList} />;
  }
  if (page === 'suppliers') {
    return <SuppliersPage suppliers={suppliers} productsList={productsList} authUser={authUser} reloadCatalog={reloadCatalog} />;
  }
  if (page === 'locations') {
    return <LocationsPage locations={locations} productsList={productsList} authUser={authUser} reloadCatalog={reloadCatalog} />;
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
    return <InventoryAlertsPage productsList={productsList} setPage={setPage} />;
  }
  if (page === 'inventory-logs') {
    return <InventoryLogsPage />;
  }
  if (page === 'scrap-orders') {
    return <ScrapOrdersPage />;
  }
  if (page === 'scrap-create') {
    return <ScrapOrderCreatePage />;
  }
  if (page === 'ai-forecast') {
    return <AiForecastPage productsList={productsList} invoicesList={invoicesList} />;
  }
  if (page === 'purchase-suggestions') {
    return <PurchaseSuggestionsPage productsList={productsList} setPage={setPage} />;
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
      <AssistantPage
        productsList={productsList}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        setPage={setPage}
      />
    );
  }
  if (page === 'reports') {
    return <ReportsPage productsList={productsList} invoicesList={invoicesList} />;
  }
  if (page === 'users') {
    return <UsersPage />;
  }
  if (page === 'audit-logs') {
  return <AuditLogsPage />;
  }
  return <SettingsPage />;
}

function Dashboard({
  authUser,
  openProduct,
  setPage,
  productsList,
  invoicesList,
}: {
  authUser: UserDto;
  openProduct: (product: Product) => void;
  setPage: (page: PageKey) => void;
  productsList: Product[];
  invoicesList: any[];
}) {
  const [bestsellers, setBestsellers] = React.useState<Product[]>([]);
  React.useEffect(() => {
    if (authUser.role !== 'ROLE_ADMIN' && authUser.role !== 'ROLE_MANAGER') return;
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    fetchSalesReport(from, to, 'DAY')
      .then((rows) => {
        const top = rows[0]?.topProducts ?? [];
        const mapped = top.map((t) => {
          const existing = productsList.find((p) => String(p.key) === String(t.itemId));
          return existing ?? {
            key: String(t.itemId),
            name: t.itemName,
            sku: t.itemCode,
            price: 0,
            stock: Number(t.quantitySold),
            category: '',
          } as Product;
        });
        setBestsellers(mapped);
      })
      .catch(() => setBestsellers(productsList.slice(0, 5)));
  }, [authUser.role, productsList]);

  const topRows = bestsellers.length > 0 ? bestsellers : productsList.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button type="primary" icon={<ShoppingCart size={16} />} onClick={() => setPage('pos')}>
          Táº¡o hÃ³a Ä‘Æ¡n POS
        </Button>
        {canAccessPage(authUser.role, 'import-create') && (
          <Button icon={<FileInput size={16} />} onClick={() => setPage('import-create')}>
            Táº¡o phiáº¿u nháº­p hÃ ng
          </Button>
        )}
        <Button className="ml-auto" type="primary" ghost icon={<Sparkles size={16} />} onClick={() => setPage('ai-forecast')}>
          Cháº¡y dá»± bÃ¡o AI
        </Button>
      </div>
      <KpiGrid productsList={productsList} invoicesList={invoicesList} useApiSummary={authUser.role === 'ROLE_ADMIN' || authUser.role === 'ROLE_MANAGER'} />
      {(authUser.role === 'ROLE_ADMIN' || authUser.role === 'ROLE_MANAGER') && (
        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
          <RevenueCard invoicesList={invoicesList} />
          <AiSummary setPage={setPage} />
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <ProductsTable title="Sáº£n pháº©m bÃ¡n cháº¡y (7 ngÃ y)" rows={topRows} openProduct={openProduct} />
        <UrgentAlerts productsList={productsList} />
      </div>
      <IntegrationsStrip />
    </div>
  );
}

function KpiGrid({
  productsList,
  invoicesList,
  useApiSummary,
}: {
  productsList: Product[];
  invoicesList: any[];
  useApiSummary?: boolean;
}) {
  const [summary, setSummary] = React.useState<DashboardSummaryDto | null>(null);
  React.useEffect(() => {
    if (!useApiSummary) return;
    fetchDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [useApiSummary, invoicesList.length]);

  const todayRevenue =
    typeof summary?.todayRevenue === 'number'
      ? summary.todayRevenue
      : invoicesList.reduce((sum, inv) => sum + inv.amount, 0);
  const todayOrders =
    typeof summary?.todayOrders === 'number' ? summary.todayOrders : invoicesList.length;
  const lowStockCount =
    typeof summary?.lowStockCount === 'number'
      ? summary.lowStockCount
      : productsList.filter((p) => p.stock > 0 && p.stock <= 40).length;
  const outOfStockCount = productsList.filter((p) => p.stock === 0).length;

  const items = [
    { label: 'Doanh thu thá»±c táº¿', value: money(todayRevenue), delta: 'HÃ´m nay', icon: ChartNoAxesCombined, tone: 'emerald' },
    { label: 'ÄÆ¡n hÃ ng hÃ´m nay', value: todayOrders.toString(), delta: 'HÃ´m nay', icon: ShoppingCart, tone: 'indigo' },
    { label: 'Sáº¯p háº¿t hÃ ng', value: lowStockCount.toString(), delta: 'Cáº§n nháº­p', icon: AlertTriangle, tone: 'amber' },
    { label: 'Háº¿t hÃ ng (Nguy cÆ¡)', value: outOfStockCount.toString(), delta: 'Æ¯u tiÃªn', icon: Gauge, tone: 'red' },
    {
      label: 'Cáº£nh bÃ¡o tá»“n',
      value: String(summary?.activeAlerts ?? lowStockCount + outOfStockCount),
      delta: 'ChÆ°a xá»­ lÃ½',
      icon: BrainCircuit,
      tone: 'ai',
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 22,
              delay: index * 0.04,
            }}
          >
            <Card className={cn(
              'interactive-card p-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-slate-300',
              item.tone === 'ai' && 'border-indigo/40 shadow-[0_12px_36px_rgba(70,72,212,0.12)] bg-gradient-to-tr from-white to-indigo-50/20'
            )}>
              <div className="flex items-start justify-between relative z-10">
                <div className={cn(
                  'grid h-11 w-11 place-items-center rounded-xl transition-all duration-300',
                  item.tone === 'emerald' && 'bg-emerald-50 text-primary shadow-[0_2px_10px_rgba(16,185,129,0.1)]',
                  item.tone === 'indigo' && 'bg-indigo-50 text-indigo shadow-[0_2px_10px_rgba(70,72,212,0.1)]',
                  item.tone === 'amber' && 'bg-amber-50 text-amber-600 shadow-[0_2px_10px_rgba(245,158,11,0.1)]',
                  item.tone === 'red' && 'bg-red-50 text-red-600 shadow-[0_2px_10px_rgba(186,26,26,0.1)]',
                  item.tone === 'ai' && 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_4px_14px_rgba(70,72,212,0.35)]'
                )}>
                  <Icon size={20} className="transition-transform duration-300" />
                </div>
                <span className={cn(
                  'rounded-md px-2 py-1 text-xs font-semibold',
                  item.delta.startsWith('+') || item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                )}>{item.delta}</span>
              </div>
              <p className="mt-4 text-sm text-muted font-medium relative z-10">{item.label}</p>
              <p className="mt-1 text-[26px] font-bold tracking-[-0.02em] text-ink relative z-10 truncate">{item.value}</p>
              {item.tone === 'ai' && (
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
                  <BrainCircuit size={120} />
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function RevenueCard({ invoicesList: _invoicesList }: { invoicesList: any[] }) {
  const [chartData, setChartData] = React.useState(salesData);
  React.useEffect(() => {
    fetchDashboardRevenue()
      .then((rows) => {
        const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        setChartData(
          rows.slice(-7).map((r, i) => ({
            day: labels[i] ?? r.day.slice(5),
            revenue: Number(r.revenue) / 1_000_000,
            forecast: Number(r.revenue) / 1_000_000 * 1.05,
            orders: 0,
          }))
        );
      })
      .catch(() => setChartData(salesData));
  }, []);

  return (
    <Card className="chart-card overflow-hidden hover:shadow-xl transition-all duration-300">
      <CardHeader
        title="Doanh thu 7 ngÃ y gáº§n nháº¥t"
        description="So sÃ¡nh doanh thu thá»±c táº¿ vÃ  dá»± bÃ¡o thÃ´ng minh tá»« AI."
        action={<Button type="text" className="hover:bg-slate-100 rounded-lg">...</Button>}
      />
      <div className="h-[310px] px-3 pb-5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 14, right: 18, bottom: 6, left: 0 }}>
            <defs>
              <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4648d4" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#4648d4" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
            <ChartTooltip
              content={<SmartTooltip />}
              cursor={{ fill: 'rgba(70, 72, 212, 0.04)', radius: 8 }}
            />
            <Bar
              dataKey="revenue"
              name="Doanh thu thá»±c táº¿"
              fill="url(#revenueBar)"
              radius={[6, 6, 0, 0]}
              barSize={28}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Area
              dataKey="forecast"
              name="Dá»± bÃ¡o AI"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#forecastArea)"
              type="monotone"
              dot={false}
              activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }}
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
};

function SmartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-pop backdrop-blur-md transition-all duration-200">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground text-slate-400">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div className="flex min-w-[170px] items-center justify-between gap-6 text-sm" key={`${entry.dataKey}-${entry.name}`}>
            <span className="flex items-center gap-2.5 text-slate-600 font-medium">
              <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: entry.color || '#10b981' }} />
              {entry.name}
            </span>
            <strong className="text-slate-900 font-bold text-base">
              {entry.dataKey === 'revenue' || entry.dataKey === 'forecast' ? `${entry.value} triá»‡u` : entry.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiSummary({ setPage }: { setPage: (page: PageKey) => void }) {
  const insights = [
    ['Cáº§n nháº­p hÃ ng', '12', 'warning'],
    ['Nguy cÆ¡ háº¿t hÃ ng', '7', 'danger'],
    ['Tá»“n kho dÆ° thá»«a', '5', 'ai'],
    ['Sáº¯p háº¿t háº¡n', '8', 'neutral'],
  ] as const;
  return (
    <Card className="border-t-4 border-t-indigo">
      <CardHeader title="TÃ³m táº¯t AI Forecast" description="Nháº­n diá»‡n Æ°u tiÃªn váº­n hÃ nh trong ngÃ y." action={<Sparkles className="text-indigo animate-pulse" size={22} />} />
      <div className="space-y-3 px-5 pb-5">
        {insights.map(([label, value, tone]) => (
          <motion.div
            whileHover={{ x: 3 }}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 transition hover:bg-indigo-50/70 cursor-pointer"
            key={label}
            onClick={() => setPage(tone === 'danger' || tone === 'warning' ? 'inventory-alerts' : 'expiry-risk')}
          >
            <span className="text-sm text-slate-600">{label}</span>
            <StatusChip tone={tone}>{value}</StatusChip>
          </motion.div>
        ))}
        <UiButton variant="secondary" className="w-full" onClick={() => setPage('purchase-suggestions')}>
          Xem gá»£i Ã½ nháº­p hÃ ng
        </UiButton>
      </div>
    </Card>
  );
}

function UrgentAlerts({ productsList }: { productsList: Product[] }) {
  const lowStock = productsList.filter(p => p.stock <= 20);
  return (
    <Card>
      <CardHeader title="Cáº£nh bÃ¡o kháº©n" description="CÃ¡c váº¥n Ä‘á» cáº§n xá»­ lÃ½ trÆ°á»›c ca tá»‘i." />
      <div className="space-y-3 px-5 pb-5">
        {lowStock.slice(0, 3).map((item) => (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4" key={item.key}>
            <div className="flex items-center justify-between">
              <strong className="text-red-800">{item.name}</strong>
              <Tag color="red">{item.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'}</Tag>
            </div>
            <p className="mt-2 text-sm text-red-700">
              {item.stock === 0
                ? 'CÃ²n 0 sáº£n pháº©m trong kho, nguy cÆ¡ máº¥t doanh sá»‘ cao!'
                : `Chá»‰ cÃ²n ${item.stock} sáº£n pháº©m, dá»± bÃ¡o háº¿t hÃ ng trong vÃ²ng 1.2 ngÃ y tá»›i.`}
            </p>
          </div>
        ))}
        {lowStock.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <CheckCircle2 size={36} className="text-emerald text-center mb-2" />
            <span className="text-sm">Má»i máº·t hÃ ng Ä‘á»u Ä‘Æ°á»£c cáº¥p Ä‘áº§y Ä‘á»§!</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function IntegrationsStrip() {
  return (
    <Card>
      <CardHeader title="TÃ­ch há»£p" />
      <div className="grid gap-3 px-5 pb-5 md:grid-cols-4">
        {['Momo Pay', 'Zalo OA', 'KiotViet', 'Google Sheets'].map((name) => (
          <div className="flex items-center justify-between rounded-xl border border-line bg-slate-50 px-4 py-3" key={name}>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-primary shadow-sm">
                <Building2 size={17} />
              </div>
              <strong className="text-sm font-semibold">{name}</strong>
            </div>
            <StatusChip tone="success">ÄÃ£ káº¿t ná»‘i</StatusChip>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProductsPage({
  openProduct,
  openModal,
  productsList,
}: {
  openProduct: (product: Product) => void;
  openModal: () => void;
  productsList: Product[];
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState('all');

  const filtered = productsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const uniqueCategories = React.useMemo(() => {
    return Array.from(new Set(productsList.map(p => p.category).filter(Boolean)));
  }, [productsList]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Input
          className="max-w-sm"
          prefix={<Search size={16} />}
          placeholder="TÃ¬m theo tÃªn, SKU, mÃ£ váº¡ch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-48 h-8 px-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-primary bg-white"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
        >
          <option value="all">Táº¥t cáº£ danh má»¥c</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <Button className="ml-auto" type="primary" icon={<Plus size={16} />} onClick={openModal}>
          ThÃªm má»›i sáº£n pháº©m
        </Button>
      </Card>
      <ProductsTable title="Danh sÃ¡ch sáº£n pháº©m" rows={filtered} openProduct={openProduct} />
    </div>
  );
}

function CategoriesPage({ categories, productsList }: { categories: CategoryDto[]; productsList: Product[] }) {
  const [selectedCat, setSelectedCat] = React.useState<any | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const rows =
    categories.length > 0
      ? categories
      : Array.from(new Set(productsList.map((p) => p.category))).map((name, i) => ({
        id: i,
        categoryName: name,
        active: true,
      }));
  const filtered = rows.filter(c => !searchQuery || c.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-semibold text-lg">Danh má»¥c hÃ ng hÃ³a</h2>
          <Input className="w-64" prefix={<Search size={16} />} placeholder="TÃ¬m kiáº¿m danh má»¥c..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} allowClear />
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {filtered.map((cat, idx) => {
            const count = productsList.filter((p) => p.category === cat.categoryName).length;
            return (
              <motion.div whileHover={{ y: -3 }} onClick={() => setSelectedCat(cat)} className="cursor-pointer rounded-xl border border-line bg-slate-50 p-4 transition-colors hover:bg-slate-100" key={cat.id}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-primary">
                    <Tags size={18} />
                  </div>
                  <StatusChip tone={cat.active ? 'success' : 'warning'}>{cat.active ? 'Äang bÃ¡n' : 'NgÆ°ng'}</StatusChip>
                </div>
                <strong className="text-ink text-base">{cat.categoryName}</strong>
                <p className="mt-1 text-sm text-muted">{count} sáº£n pháº©m Ä‘ang bÃ y bÃ¡n Â· BiÃªn lá»£i nhuáº­n {15 + idx}%</p>
              </motion.div>
            );
          })}
        </div>
      </Card>
      <AiSummary setPage={() => { }} />
      <Modal title={`Sáº£n pháº©m trong danh má»¥c: ${selectedCat?.categoryName}`} open={!!selectedCat} onCancel={() => setSelectedCat(null)} footer={null} width={900}>
        {selectedCat && <ProductsTable title="" rows={productsList.filter((p) => p.category === selectedCat.categoryName)} openProduct={() => { }} />}
      </Modal>
    </div>
  );
}

function SuppliersPage({ suppliers, productsList, authUser, reloadCatalog }: { suppliers: SupplierDto[]; productsList: Product[]; authUser?: UserDto; reloadCatalog?: () => Promise<void> }) {
  const [selectedSup, setSelectedSup] = React.useState<SupplierDto | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState('');
  const canEdit = authUser && ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(normalizeRole(authUser.role));

  const filteredSuppliers = suppliers.filter(s =>
    !searchQuery ||
    s.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  const handleOpen = (sup: SupplierDto) => {
    setSelectedSup(sup);
    setIsEditing(false);
    form.setFieldsValue({
      supplierName: sup.supplierName,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      active: sup.active,
    });
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedSup) return;

      const isActive = values.active === 'true' || values.active === true;
      values.active = isActive;

      const doUpdate = async () => {
        setLoading(true);
        try {
          await updateSupplier(selectedSup.id, values);
          antdMessage.success('Cáº­p nháº­t nhÃ  cung cáº¥p thÃ nh cÃ´ng');
          setIsEditing(false);
          setSelectedSup(null);
          if (reloadCatalog) await reloadCatalog();
        } catch (e: any) {
          antdMessage.error(e.message || 'Lá»—i khi cáº­p nháº­t');
        } finally {
          setLoading(false);
        }
      };

      if (selectedSup.active && !isActive) {
        Modal.confirm({
          title: 'XÃ¡c nháº­n ngá»«ng hoáº¡t Ä‘á»™ng',
          content: 'Ngá»«ng hoáº¡t Ä‘á»™ng nhÃ  cung cáº¥p nÃ y cÃ³ thá»ƒ áº£nh hÆ°á»Ÿng Ä‘áº¿n viá»‡c nháº­p hÃ ng. Báº¡n cÃ³ cháº¯c cháº¯n?',
          okText: 'Äá»“ng Ã½',
          cancelText: 'Há»§y',
          onOk: doUpdate
        });
      } else {
        doUpdate();
      }
    } catch (e: any) {
      if (e.errorFields) return; // Validation failed
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-semibold text-lg">NhÃ  cung cáº¥p Ä‘á»‘i tÃ¡c</h2>
          <Input className="w-64" prefix={<Search size={16} />} placeholder="TÃ¬m theo tÃªn, SÄT..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} allowClear />
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {filteredSuppliers.map((sup) => (
            <motion.div whileHover={{ y: -3 }} onClick={() => handleOpen(sup)} className="cursor-pointer rounded-xl border border-line bg-slate-50 p-4 transition-colors hover:bg-slate-100 hover:border-indigo-300" key={sup.id}>
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo">
                  <Truck size={18} />
                </div>
                <StatusChip tone={sup.active ? 'success' : 'warning'}>{sup.active ? 'Hoáº¡t Ä‘á»™ng' : 'NgÆ°ng'}</StatusChip>
              </div>
              <strong className="text-ink text-base">{sup.supplierName}</strong>
              <p className="text-xs text-muted mt-0.5">{sup.contactPerson ?? 'â€”'} Â· {sup.phone ?? 'â€”'}</p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                {productsList.length} SKU trong há»‡ thá»‘ng
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
      <AiSummary setPage={() => { }} />
      <Modal
        title={isEditing ? 'Sá»­a thÃ´ng tin NhÃ  cung cáº¥p' : `Chi tiáº¿t: ${selectedSup?.supplierName}`}
        open={!!selectedSup}
        onCancel={() => { setSelectedSup(null); setIsEditing(false); }}
        footer={
          isEditing ? (
            <div className="flex justify-end gap-2">
              <UiButton variant="secondary" onClick={() => setIsEditing(false)} disabled={loading}>Há»§y</UiButton>
              <UiButton variant="primary" onClick={handleUpdate} disabled={loading}>{loading ? 'Äang lÆ°u...' : 'LÆ°u thay Ä‘á»•i'}</UiButton>
            </div>
          ) : (
            canEdit ? <UiButton variant="primary" onClick={() => setIsEditing(true)}>Chá»‰nh sá»­a</UiButton> : null
          )
        }
        forceRender
      >
        {selectedSup && !isEditing && (
          <div className="space-y-3 mt-4 text-sm text-slate-700">
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">TÃªn NCC:</span><span>{selectedSup.supplierName}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">NgÆ°á»i liÃªn há»‡:</span><span>{selectedSup.contactPerson || 'â€”'}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">SÄT:</span><span>{selectedSup.phone || 'â€”'}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Email:</span><span>{selectedSup.email || 'â€”'}</span></div>
            <div className="grid grid-cols-[120px_1fr]"><span className="font-semibold text-slate-500">Äá»‹a chá»‰:</span><span>{selectedSup.address || 'â€”'}</span></div>
          </div>
        )}

        {selectedSup && isEditing && (
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="supplierName" label="TÃªn nhÃ  cung cáº¥p" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p tÃªn nhÃ  cung cáº¥p' }]}>
              <Input placeholder="Nháº­p tÃªn" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="contactPerson" label="NgÆ°á»i liÃªn há»‡">
                <Input placeholder="TÃªn ngÆ°á»i Ä‘áº¡i diá»‡n" />
              </Form.Item>
              <Form.Item name="phone" label="Sá»‘ Ä‘iá»‡n thoáº¡i">
                <Input placeholder="Nháº­p SÄT" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="email" label="Email" className="col-span-2">
                <Input type="email" placeholder="Nháº­p email" />
              </Form.Item>
            </div>
            <Form.Item name="address" label="Äá»‹a chá»‰">
              <Input placeholder="Nháº­p Ä‘á»‹a chá»‰" />
            </Form.Item>
            <Form.Item name="active" label="Tráº¡ng thÃ¡i">
              <select className="h-[34px] w-full px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white">
                <option value="true">Hoáº¡t Ä‘á»™ng</option>
                <option value="false">NgÆ°ng</option>
              </select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
// PosPage has been moved to ./pages/PosPage.tsx

function InvoicesPage({
  setSelectedInvoice,
  authUser,
}: {
  setSelectedInvoice: (invoice: any) => void;
  authUser: import('./types/api').UserDto;
}) {
  const canCancel = authUser.role === 'ROLE_ADMIN' || authUser.role === 'ROLE_MANAGER';
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ page: 0, size: 10, total: 0 });
  const [filters, setFilters] = React.useState({ search: '', status: 'ALL', fromDate: '', toDate: '' });
  const [reloadTick, setReloadTick] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetchOrdersPaged(pagination.page, pagination.size, filters.search, filters.status, filters.fromDate, filters.toDate)
      .then(res => {
        if (active) {
          setOrders(ordersToInvoices(res.content));
          setPagination(p => ({ ...p, total: res.totalElements }));
        }
      })
      .catch(e => {
        if (active) antdMessage.error('Lá»—i táº£i hÃ³a Ä‘Æ¡n');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pagination.page, pagination.size, filters.search, filters.status, filters.fromDate, filters.toDate, reloadTick]);

  const columns = [
    { title: 'MÃ£ hÃ³a Ä‘Æ¡n', dataIndex: 'key', render: (v: string, row: any) => <button className="font-bold text-primary hover:text-emerald" onClick={() => setSelectedInvoice(row)}>{v}</button> },
    { title: 'KhÃ¡ch hÃ ng', dataIndex: 'customer' },
    { title: 'Thu ngÃ¢n', dataIndex: 'cashier' },
    { title: 'Tá»•ng thanh toÃ¡n', dataIndex: 'amount', render: (v: number) => money(v) },
    { title: 'Thá»i gian', dataIndex: 'time' },
    { title: 'Tráº¡ng thÃ¡i', dataIndex: 'status', render: (v: string) => <StatusChip tone={v.includes('toÃ¡n') ? 'success' : 'warning'}>{v}</StatusChip> },
    {
      title: 'HÃ nh Ä‘á»™ng',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => setSelectedInvoice(row)}>Chi tiáº¿t</Button>
          {canCancel && row.rawStatus === 'COMPLETED' && (
            <Button
              size="small"
              danger
              onClick={async () => {
                try {
                  await cancelOrder(row.orderId);
                  antdMessage.success('ÄÃ£ há»§y hÃ³a Ä‘Æ¡n');
                  setReloadTick((t) => t + 1);
                } catch (e) {
                  antdMessage.error(e instanceof Error ? e.message : 'Há»§y tháº¥t báº¡i');
                }
              }}
            >
              Há»§y
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <CardHeader title="Danh sÃ¡ch hÃ³a Ä‘Æ¡n" className="shrink-0" action={
        <div className="flex gap-2">
          <Input.Search
            placeholder="TÃ¬m mÃ£, khÃ¡ch hÃ ng..."
            onSearch={val => { setFilters(f => ({ ...f, search: val })); setPagination(p => ({ ...p, page: 0 })); }}
            style={{ width: 240 }}
            allowClear
          />
          <select
            className="h-8 px-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-primary bg-white"
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 0 })); }}
          >
            <option value="ALL">Táº¥t cáº£ tráº¡ng thÃ¡i</option>
            <option value="COMPLETED">ÄÃ£ thanh toÃ¡n</option>
            <option value="CANCELLED">ÄÃ£ há»§y</option>
          </select>
          <DatePicker
            placeholder="Tá»« ngÃ y"
            onChange={(_, dateStr) => { setFilters(f => ({ ...f, fromDate: dateStr ? (dateStr as string) + 'T00:00:00' : '' })); setPagination(p => ({ ...p, page: 0 })); }}
          />
          <DatePicker
            placeholder="Äáº¿n ngÃ y"
            onChange={(_, dateStr) => { setFilters(f => ({ ...f, toDate: dateStr ? (dateStr as string) + 'T23:59:59' : '' })); setPagination(p => ({ ...p, page: 0 })); }}
          />
        </div>
      } />
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{
            current: pagination.page + 1,
            pageSize: pagination.size,
            total: pagination.total,
            onChange: (page, size) => setPagination(p => ({ ...p, page: page - 1, size })),
            className: 'px-5 py-3 !m-0 border-t border-slate-100 bg-white sticky bottom-0 z-10'
          }}
          rowKey="key"
          scroll={{ y: 'calc(100vh - 275px)' }}
        />
      </div>
    </Card>
  );
}



function InventoryPage({ openProduct, productsList }: { openProduct: (product: Product) => void; productsList: Product[] }) {
  const [rows, setRows] = React.useState(productsList);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    fetchInventory()
      .then((inv) => {
        const mapped: Product[] = inv.map((row) => {
          const stock = Math.round(Number(row.availableQuantity));
          return {
            key: String(row.id),
            sku: row.itemCode,
            name: row.itemName,
            category: row.locationName,
            categoryId: 0,
            price: 0,
            cost: 0,
            stock,
            sold: 0,
            supplier: '-',
            status: stock === 0 ? 'Háº¿t hÃ ng' : stock <= 40 ? 'Sáº¯p háº¿t' : 'CÃ²n hÃ ng',
            expiry: row.expiryDate ?? 'KhÃ´ng Ã¡p dá»¥ng',
            purchaseRatio: 1,
          };
        });
        setRows(mapped.length ? mapped : productsList);
      })
      .catch(() => setRows(productsList))
      .finally(() => setLoading(false));
  }, [productsList]);
  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-muted">Äang táº£i tá»“n kho tá»« APIâ€¦</p>}
      <ProductsTable title="Tá»“n kho theo vá»‹ trÃ­ / lÃ´" rows={rows} openProduct={openProduct} />
    </div>
  );
}

function InventoryAlertsPage({ setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const [alerts, setAlerts] = React.useState<InventoryAlertDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetchInventoryAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-muted">Äang táº£i cáº£nh bÃ¡oâ€¦</p>;
  if (!alerts.length) return <p className="text-sm text-muted">KhÃ´ng cÃ³ cáº£nh bÃ¡o chÆ°a xá»­ lÃ½.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {alerts.map((alert) => (
        <Card className="p-5 flex flex-col justify-between min-h-[210px] relative overflow-hidden" key={alert.id}>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <AlertTriangle className={alert.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-500'} />
              <StatusChip tone={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>{alert.alertType}</StatusChip>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{alert.itemName}</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">{alert.message}</p>
          </div>
          <Button className="w-full mt-3" type="primary" onClick={() => setPage('import-create')}>
            Táº¡o phiáº¿u nháº­p Ä‘á»‘i tÃ¡c
          </Button>
        </Card>
      ))}
    </div>
  );
}

function AiForecastPage({ productsList: _productsList }: { productsList: Product[]; invoicesList: any[] }) {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<import('./types/api').ForecastResultDto[]>([]);
  const [aiStatus, setAiStatus] = React.useState<AiStatusDto | null>(null);
  const [revenueChart, setRevenueChart] = React.useState<Array<{ day: string; revenue: number; orders: number }>>([]);
  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null);
  const [dailyChart, setDailyChart] = React.useState<Array<{ date: string; qty: number }>>([]);

  const refreshStatus = React.useCallback(async () => {
    try {
      const status = await fetchAiStatus();
      setAiStatus(status);
    } catch {
      setAiStatus(null);
    }
  }, []);

  const refreshResults = React.useCallback(async () => {
    try {
      const r = await fetchForecastResults();
      setResults(r);
      if (r.length > 0) {
        const firstId = Number(r[0].itemId);
        if (!Number.isNaN(firstId)) {
          setSelectedItemId(firstId);
          const detail = await fetchForecastItemDetail(firstId);
          setDailyChart(
            (detail.dailySeries || []).map((p) => ({
              date: p.date.slice(5),
              qty: Number(p.predictedQty),
            }))
          );
        }
      }
    } catch {
      setResults([]);
    }
  }, []);

  React.useEffect(() => {
    refreshResults();
    refreshStatus();
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    fetchSalesReport(from, to, 'DAY')
      .then((rows) => {
        setRevenueChart(
          rows.map((r) => ({
            day: r.period.slice(5),
            revenue: Number(r.totalRevenue),
            orders: Number(r.totalOrders),
          }))
        );
      })
      .catch(() => setRevenueChart([]));
  }, [refreshResults, refreshStatus]);

  const handleTrain = async () => {
    setLoading(true);
    try {
      await trainForecast();
      await refreshResults();
      await refreshStatus();
      antdMessage.success('Huáº¥n luyá»‡n mÃ´ hÃ¬nh thÃ nh cÃ´ng');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Huáº¥n luyá»‡n tháº¥t báº¡i');
    } finally {
      setLoading(false);
    }
  };

  const loadItemChart = async (itemId: number) => {
    setSelectedItemId(itemId);
    try {
      const detail = await fetchForecastItemDetail(itemId);
      setDailyChart(
        (detail.dailySeries || []).map((p) => ({
          date: p.date.slice(5),
          qty: Number(p.predictedQty),
        }))
      );
    } catch {
      setDailyChart([]);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      await runForecast();
      await refreshResults();
      await refreshStatus();
      antdMessage.success('Dá»± bÃ¡o hoÃ n táº¥t');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Dá»± bÃ¡o tháº¥t báº¡i â€” kiá»ƒm tra ai-service');
    } finally {
      setLoading(false);
    }
  };

  const modelLabel = (t?: string) => {
    if (t === 'random_forest') return <Tag color="blue">RF</Tag>;
    if (t === 'xgboost') return <Tag color="purple">XGB</Tag>;
    return <Tag>MA</Tag>;
  };

  const formatTrainedAt = (iso?: string) => {
    if (!iso) return 'ChÆ°a huáº¥n luyá»‡n';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Tráº¡ng thÃ¡i AI" description="FastAPI ML service + backend orchestration" />
        <div className="px-5 pb-5 flex flex-wrap gap-4 items-center">
          <Tag color={aiStatus?.aiOnline ? 'success' : 'error'}>
            {aiStatus?.aiOnline ? 'AI Online' : 'AI Offline'}
          </Tag>
          <Tag color={aiStatus?.modelLoaded ? 'processing' : 'default'}>
            {aiStatus?.modelLoaded ? 'Model loaded' : 'ChÆ°a cÃ³ model'}
          </Tag>
          <span className="text-sm text-slate-500">
            Version: <strong>{aiStatus?.aiVersion ?? 'â€”'}</strong>
          </span>
          <span className="text-sm text-slate-500">
            Model: <strong>{aiStatus?.modelType ?? 'â€”'}</strong>
          </span>
          <span className="text-sm text-slate-500">
            Huáº¥n luyá»‡n láº§n cuá»‘i: <strong>{formatTrainedAt(aiStatus?.lastTrainedAt)}</strong>
          </span>
          <span className="text-sm text-slate-500">
            SKU Ä‘Ã£ dá»± bÃ¡o: <strong>{aiStatus?.totalForecasts ?? 0}</strong>
          </span>
        </div>
      </Card>
      <div className="flex gap-2">
        <Button type="primary" loading={loading} onClick={handleTrain}>Huáº¥n luyá»‡n AI</Button>
        <Button loading={loading} onClick={handleRun}>Cháº¡y dá»± bÃ¡o</Button>
      </div>
      {results.length > 0 ? (
        <Card>
          <CardHeader title="Káº¿t quáº£ dá»± bÃ¡o theo SKU" description={`${results.length} sáº£n pháº©m`} />
          <Table
            size="small"
            pagination={false}
            rowKey="itemId"
            dataSource={results}
            onRow={(row) => ({
              onClick: () => loadItemChart(row.itemId),
              className: row.itemId === selectedItemId ? 'bg-emerald-50' : 'cursor-pointer',
            })}
            columns={[
              { title: 'Sáº£n pháº©m', dataIndex: 'itemName' },
              { title: '7 ngÃ y', dataIndex: 'pred7d' },
              { title: '14 ngÃ y', dataIndex: 'pred14d' },
              { title: '30 ngÃ y', dataIndex: 'pred30d' },
              {
                title: 'Khoáº£ng tin cáº­y (30d)',
                render: (_, r) =>
                  r.confidenceLow != null
                    ? `${Number(r.confidenceLow).toFixed(0)} â€“ ${Number(r.confidenceHigh ?? 0).toFixed(0)}`
                    : 'â€”',
              },
              { title: 'Model', dataIndex: 'modelType', render: (v) => modelLabel(String(v)) },
            ]}
          />
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          message="ChÆ°a cÃ³ káº¿t quáº£ dá»± bÃ¡o"
          description="Nháº¥n Huáº¥n luyá»‡n AI Ä‘á»ƒ train model vÃ  cháº¡y dá»± bÃ¡o tá»± Ä‘á»™ng."
        />
      )}
      <Card>
        <CardHeader
          title="Chuá»—i dá»± bÃ¡o 30 ngÃ y (daily series)"
          description={selectedItemId ? `SKU #${selectedItemId}` : 'Cháº¡y dá»± bÃ¡o vÃ  chá»n má»™t dÃ²ng trong báº£ng'}
        />
        <div className="h-[320px] px-3 pb-5">
          {dailyChart.length === 0 ? (
            <div className="h-full grid place-items-center text-muted text-sm">ChÆ°a cÃ³ dá»¯ liá»‡u daily series</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Line type="monotone" dataKey="qty" name="SL dá»± bÃ¡o" stroke="#006c49" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="hover:shadow-xl transition-all duration-300">
          <CardHeader title="Doanh thu & Ä‘Æ¡n hÃ ng thá»±c táº¿" description="Dá»¯ liá»‡u tá»« bÃ¡o cÃ¡o bÃ¡n hÃ ng 30 ngÃ y gáº§n nháº¥t." />
          <div className="h-[360px] px-3 pb-5">
            {revenueChart.length === 0 ? (
              <div className="h-full grid place-items-center text-muted text-sm">ChÆ°a cÃ³ dá»¯ liá»‡u doanh thu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 14, right: 18, bottom: 6, left: 0 }}>
                  <defs>
                    <linearGradient id="forecastRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="forecastOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4648d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4648d4" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <ChartTooltip content={<SmartTooltip />} />
                  <Area dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={3} fill="url(#forecastRevenue)" type="monotone" dot={false} activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive animationDuration={900} />
                  <Area dataKey="orders" name="ÄÆ¡n hÃ ng" stroke="#4648d4" strokeWidth={3} fill="url(#forecastOrders)" type="monotone" dot={false} activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive animationDuration={1050} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <AiSummary setPage={() => { }} />
      </div>
    </div>
  );
}

function PurchaseSuggestionsPage({ productsList: _productsList, setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const [recs, setRecs] = React.useState<Record<string, unknown>[]>([]);
  React.useEffect(() => {
    fetchReorderRecommendations().then(setRecs).catch(() => setRecs([]));
  }, []);
  const suggestions = recs.map((r) => ({
    key: String(r.itemId),
    name: String(r.itemName),
    stock: Number(r.currentAvailable),
    sold: Number(r.predictedDemand14d ?? r.predictedDemand7d),
    suggested: Number(r.suggestedQty),
    risk: String(r.riskLevel),
    source: String(r.source ?? 'AI'),
  }));
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">AI Äá» xuáº¥t nháº­p thÃªm hÃ ng</h2>
          <p className="text-xs text-slate-400">ÄÆ°á»£c Ä‘á» xuáº¥t tá»± Ä‘á»™ng dá»±a theo tá»‘c Ä‘á»™ bÃ¡n hÃ ng vÃ  chu ká»³ váº­n chuyá»ƒn.</p>
        </div>
        {suggestions.length > 0 && (
          <Button type="primary" onClick={() => setPage('import-create')}>Láº­p phiáº¿u táº¥t cáº£</Button>
        )}
      </div>
      <div className="px-5 pb-5">
        {suggestions.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            message="ChÆ°a cÃ³ Ä‘á» xuáº¥t nháº­p hÃ ng"
            description={
              <span>
                HÃ£y cháº¡y{' '}
                <Button type="link" size="small" className="p-0 h-auto" onClick={() => setPage('ai-forecast')}>
                  Huáº¥n luyá»‡n AI
                </Button>{' '}
                trÃªn trang Dá»± bÃ¡o AI trÆ°á»›c.
              </span>
            }
          />
        ) : (
          <Table
            dataSource={suggestions}
            columns={[
              { title: 'TÃªn hÃ ng', dataIndex: 'name', render: (v) => <span className="font-bold text-ink">{v}</span> },
              { title: 'Tá»“n hiá»‡n táº¡i', dataIndex: 'stock' },
              { title: 'Nhu cáº§u (14 ngÃ y)', dataIndex: 'sold' },
              { title: 'Sá»‘ lÆ°á»£ng Ä‘á» xuáº¥t', dataIndex: 'suggested' },
              { title: 'Nguá»“n', dataIndex: 'source', render: (v) => <Tag color={v === 'AI' ? 'green' : 'orange'}>{v}</Tag> },
              { title: 'Äá»™ Æ°u tiÃªn', render: (_, row) => <Tag color={row.stock === 0 ? 'red' : 'orange'}>{row.stock === 0 ? 'KHáº¨N Cáº¤P' : 'CAO'}</Tag> },
              { title: 'HÃ nh Ä‘á»™ng', render: () => <Button size="small" type="primary" ghost onClick={() => setPage('import-create')}>Láº­p phiáº¿u</Button> }
            ]}
            pagination={false}
            rowKey="key"
          />
        )}
      </div>
    </Card>
  );
}

function ExpiryRiskPage({ productsList: _productsList, setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetchNearExpiry()
      .then((rows) => {
        const mapped: Product[] = rows.map((row) => ({
          key: String(row.itemId),
          sku: row.itemCode,
          name: row.itemName,
          category: row.locationName,
          categoryId: 0,
          price: 0,
          cost: 0,
          stock: Math.round(Number(row.availableQuantity)),
          sold: 0,
          supplier: '-',
          status: 'Nguy cÆ¡' as const,
          expiry: row.expiryDate ?? 'â€”',
          purchaseRatio: 1,
        }));
        if (active) setItems(mapped);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <Card className="p-8 text-center text-muted">Äang táº£i danh sÃ¡ch cáº­n háº¡n...</Card>;
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500">
        KhÃ´ng cÃ³ máº·t hÃ ng cáº­n háº¡n sá»­ dá»¥ng (API tráº£ vá» 0). VÃ o <Button type="link" className="p-0 h-auto" onClick={() => setPage('promotions')}>Äá» xuáº¥t KM (AI)</Button> Ä‘á»ƒ táº¡o KM thá»§ cÃ´ng.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card className="p-5 flex flex-col justify-between h-[220px]" key={item.key}>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo shadow-[0_2px_8px_rgba(70,72,212,0.1)]">
                <CalendarClock size={20} />
              </div>
              <StatusChip tone="warning">Cáº­n háº¡n</StatusChip>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{item.name}</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              HSD: {item.expiry} Â· Tá»“n: {item.stock}. DÃ¹ng AI Ä‘á» xuáº¥t KM Ä‘á»ƒ xáº£ hÃ ng.
            </p>
          </div>
          <Button className="w-full mt-3 font-semibold" type="primary" ghost onClick={() => setPage('promotions')}>
            Äá» xuáº¥t KM (AI)
          </Button>
        </Card>
      ))}
    </div>
  );
}

function AssistantPage({
  productsList,
  chatHistory,
  setChatHistory,
  setPage,
}: {
  productsList: Product[];
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>;
  setChatHistory: React.Dispatch<React.SetStateAction<Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>>>;
  setPage: (page: PageKey) => void;
}) {
  const [typedMessage, setTypedMessage] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    const userMsg = typedMessage;
    const newHistory = [...chatHistory, { sender: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setTypedMessage('');

    aiChat(userMsg)
      .then((aiText) => {
        const lower = userMsg.toLowerCase();
        let action: { label: string; page: PageKey } | undefined;
        if (lower.includes('nháº­p') || lower.includes('tá»“n')) {
          action = { label: 'Táº¡o phiáº¿u nháº­p', page: 'import-create' };
        } else if (lower.includes('bÃ¡o cÃ¡o') || lower.includes('doanh thu')) {
          action = { label: 'Xem bÃ¡o cÃ¡o', page: 'reports' };
        }
        setChatHistory([...newHistory, { sender: 'ai' as const, text: aiText, action }]);
      })
      .catch(() => {
        setChatHistory([
          ...newHistory,
          {
            sender: 'ai' as const,
            text: 'KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c trá»£ lÃ½ AI. Vui lÃ²ng thá»­ láº¡i hoáº·c kiá»ƒm tra quyá»n ADMIN/MANAGER.',
          },
        ]);
      });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="min-h-[580px] flex flex-col justify-between">
        <CardHeader title="Trá»£ lÃ½ váº­n hÃ nh thÃ´ng minh AI" description="Há»i Ä‘Ã¡p thá»i gian thá»±c vá» tá»“n kho, Ä‘á» xuáº¥t nháº­p hÃ ng vÃ  hiá»‡u quáº£ doanh thu." />
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 max-h-[380px] scrollbar-thin">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col max-w-[80%] rounded-2xl p-4 text-sm relative',
                msg.sender === 'user'
                  ? 'ml-auto bg-primary text-white shadow-md'
                  : 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200'
              )}
            >
              {msg.sender === 'ai' ? <MarkdownMessage text={msg.text} /> : <span>{msg.text}</span>}
              {msg.action && (
                <Button
                  className="mt-3 font-semibold text-xs h-8 bg-white border border-indigo/20 text-indigo hover:text-indigo-700"
                  onClick={() => setPage(msg.action!.page)}
                >
                  {msg.action.label}
                </Button>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex gap-2">
          <Input
            size="large"
            placeholder="VÃ­ dá»¥: 'Sáº£n pháº©m nÃ o sáº¯p háº¿t hÃ ng?'..."
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            onPressEnter={handleSendMessage}
          />
          <Button type="primary" size="large" icon={<Send size={17} />} onClick={handleSendMessage} />
        </div>
      </Card>
    </div>
  );
}

function ReportsPage({ productsList, invoicesList }: { productsList: Product[]; invoicesList: any[] }) {
  const [activeTab, setActiveTab] = React.useState('sales');
  const [dateRange, setDateRange] = React.useState<[any, any] | null>(null);
  const [groupBy, setGroupBy] = React.useState<string>('day');
  const [loading, setLoading] = React.useState(false);

  const [salesData, setSalesData] = React.useState<SalesReportDto[]>([]);
  const [purchaseData, setPurchaseData] = React.useState<PurchaseReportDto[]>([]);
  const [inventoryData, setInventoryData] = React.useState<InventoryReportDto[]>([]);

  const formatRange = (): { from?: string; to?: string } => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return {};
    return {
      from: dateRange[0].format('YYYY-MM-DD'),
      to: dateRange[1].format('YYYY-MM-DD'),
    };
  };

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    const { from, to } = formatRange();
    try {
      if (activeTab === 'sales') {
        const data = await fetchSalesReport(from, to, groupBy);
        setSalesData(data);
      } else if (activeTab === 'purchase') {
        const data = await fetchPurchaseReport(from, to);
        setPurchaseData(data);
      } else {
        const data = await fetchInventoryReport(from, to);
        setInventoryData(data);
      }
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'KhÃ´ng táº£i Ä‘Æ°á»£c bÃ¡o cÃ¡o');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, groupBy]);

  React.useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const salesTotals = React.useMemo(() => {
    const totalRevenue = salesData.reduce((s, r) => s + r.totalRevenue, 0);
    const totalOrders = salesData.reduce((s, r) => s + r.totalOrders, 0);
    const grossProfit = salesData.reduce((s, r) => s + r.grossProfit, 0);
    const totalItemsSold = salesData.reduce((s, r) => s + r.totalItemsSold, 0);
    return { totalRevenue, totalOrders, grossProfit, totalItemsSold };
  }, [salesData]);

  const purchaseTotals = React.useMemo(() => {
    const totalAmount = purchaseData.reduce((s, r) => s + r.totalAmount, 0);
    const totalOrders = purchaseData.reduce((s, r) => s + r.totalOrders, 0);
    const totalQuantity = purchaseData.reduce((s, r) => s + r.totalQuantity, 0);
    return { totalAmount, totalOrders, totalQuantity, supplierCount: purchaseData.length };
  }, [purchaseData]);

  const inventoryTotals = React.useMemo(() => {
    const totalStock = inventoryData.reduce((s, r) => s + r.currentStock, 0);
    const totalShrinkage = inventoryData.reduce((s, r) => s + r.shrinkage, 0);
    const nearExpiry = inventoryData.filter((r) => r.daysUntilExpiry != null && r.daysUntilExpiry <= 30).length;
    const avgTurnover = inventoryData.length
      ? inventoryData.reduce((s, r) => s + r.turnoverRate, 0) / inventoryData.length
      : 0;
    return { totalStock, totalShrinkage, nearExpiry, avgTurnover };
  }, [inventoryData]);

  const salesColumns: ColumnsType<SalesReportDto> = [
    { title: 'Ká»³ bÃ¡o cÃ¡o', dataIndex: 'period', width: 130, fixed: 'left' },
    { title: 'Tá»•ng Ä‘Æ¡n', dataIndex: 'totalOrders', width: 100, sorter: (a, b) => a.totalOrders - b.totalOrders },
    { title: 'ÄÆ¡n há»§y', dataIndex: 'cancelledOrders', width: 100 },
    { title: 'Doanh thu', dataIndex: 'totalRevenue', width: 150, render: (v: number) => money(v), sorter: (a, b) => a.totalRevenue - b.totalRevenue },
    { title: 'GiÃ¡ vá»‘n', dataIndex: 'totalCost', width: 150, render: (v: number) => money(v) },
    { title: 'Lá»£i nhuáº­n gá»™p', dataIndex: 'grossProfit', width: 150, render: (v: number) => <span className={v >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{money(v)}</span>, sorter: (a, b) => a.grossProfit - b.grossProfit },
    { title: 'SP bÃ¡n ra', dataIndex: 'totalItemsSold', width: 110 },
    { title: 'Top sáº£n pháº©m', dataIndex: 'topProducts', width: 220, render: (tops: SalesReportDto['topProducts']) => tops?.length ? tops.slice(0, 3).map((t) => t.itemName).join(', ') : 'â€”' },
  ];

  const purchaseColumns: ColumnsType<PurchaseReportDto> = [
    { title: 'NhÃ  cung cáº¥p', dataIndex: 'supplierName', width: 200, fixed: 'left' },
    { title: 'Sá»‘ Ä‘Æ¡n nháº­p', dataIndex: 'totalOrders', width: 120, sorter: (a, b) => a.totalOrders - b.totalOrders },
    { title: 'Tá»•ng giÃ¡ trá»‹', dataIndex: 'totalAmount', width: 160, render: (v: number) => money(v), sorter: (a, b) => a.totalAmount - b.totalAmount },
    { title: 'Loáº¡i SP nháº­p', dataIndex: 'totalItemTypes', width: 120 },
    { title: 'Tá»•ng SL nháº­p', dataIndex: 'totalQuantity', width: 130, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
  ];

  const inventoryColumns: ColumnsType<InventoryReportDto> = [
    { title: 'MÃ£ SP', dataIndex: 'itemCode', width: 120, fixed: 'left' },
    { title: 'TÃªn sáº£n pháº©m', dataIndex: 'itemName', width: 200 },
    { title: 'Danh má»¥c', dataIndex: 'categoryName', width: 140 },
    { title: 'Tá»“n hiá»‡n táº¡i', dataIndex: 'currentStock', width: 120, render: (v: number) => Math.round(v).toLocaleString('vi-VN'), sorter: (a, b) => a.currentStock - b.currentStock },
    { title: 'ÄÃ£ nháº­p', dataIndex: 'totalPurchased', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'ÄÃ£ bÃ¡n', dataIndex: 'totalSold', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'ÄÃ£ há»§y', dataIndex: 'totalScrapped', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'Hao há»¥t', dataIndex: 'shrinkage', width: 110, render: (v: number) => <span className={v > 0 ? 'text-red-600 font-semibold' : ''}>{Math.round(v).toLocaleString('vi-VN')}</span> },
    { title: 'Quay vÃ²ng', dataIndex: 'turnoverRate', width: 110, render: (v: number) => v?.toFixed(2) ?? 'â€”', sorter: (a, b) => a.turnoverRate - b.turnoverRate },
    { title: 'Háº¡n gáº§n nháº¥t', dataIndex: 'nearestExpiryDate', width: 130, render: (v: string) => v ?? 'â€”' },
    { title: 'CÃ²n (ngÃ y)', dataIndex: 'daysUntilExpiry', width: 110, render: (v: number | undefined) => v != null ? <Tag color={v <= 7 ? 'red' : v <= 30 ? 'orange' : 'green'}>{v} ngÃ y</Tag> : 'â€”', sorter: (a, b) => (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999) },
  ];

  const StatCard = ({ label, value, color = 'text-slate-800' }: { label: string; value: string | number; color?: string }) => (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-extrabold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="flex flex-wrap items-center gap-2">
              <MuiDatePicker
                label="Tá»« ngÃ y"
                format="DD/MM/YYYY"
                value={dateRange && dateRange[0] ? dateRange[0] : null}
                onChange={(val) => {
                  setDateRange((prev) => [val, prev ? prev[1] : null]);
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    style: { width: 150 },
                    onKeyDown: (e) => e.preventDefault(),
                    slotProps: {
                      htmlInput: {
                        readOnly: true,
                      }
                    }
                  },
                  popper: {
                    style: { zIndex: 9999 }
                  }
                }}
              />
              <span className="text-slate-400">â€”</span>
              <MuiDatePicker
                label="Äáº¿n ngÃ y"
                format="DD/MM/YYYY"
                value={dateRange && dateRange[1] ? dateRange[1] : null}
                onChange={(val) => {
                  setDateRange((prev) => [prev ? prev[0] : null, val]);
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    style: { width: 150 },
                    onKeyDown: (e) => e.preventDefault(),
                    slotProps: {
                      htmlInput: {
                        readOnly: true,
                      }
                    }
                  },
                  popper: {
                    style: { zIndex: 9999 }
                  }
                }}
              />
            </div>
          </LocalizationProvider>
          {activeTab === 'sales' && (
            <ReactSelect
              value={[
                { value: 'day', label: 'Theo ngÃ y' },
                { value: 'month', label: 'Theo thÃ¡ng' },
                { value: 'year', label: 'Theo nÄƒm' },
              ].find((opt) => opt.value === groupBy)}
              onChange={(newValue) => {
                if (newValue) {
                  setGroupBy(newValue.value);
                }
              }}
              styles={{
                control: (base, state) => ({
                  ...base,
                  width: 160,
                  minHeight: '40px',
                  height: '40px',
                  borderRadius: '0.75rem',
                  borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
                  boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
                  '&:hover': {
                    borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
                  },
                  fontSize: '14px',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#6366f1'
                    : state.isFocused
                      ? '#f3f4f6'
                      : 'transparent',
                  color: state.isSelected ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  cursor: 'pointer',
                  '&:active': {
                    backgroundColor: '#e0e7ff',
                  },
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  zIndex: 9999,
                }),
              }}
              options={[
                { value: 'day', label: 'Theo ngÃ y' },
                { value: 'month', label: 'Theo thÃ¡ng' },
                { value: 'year', label: 'Theo nÄƒm' },
              ]}
            />
          )}
          <Button type="primary" onClick={loadReport} loading={loading}>
            Táº£i bÃ¡o cÃ¡o
          </Button>
        </div>
      </Card>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'sales',
            label: 'BÃ¡o cÃ¡o bÃ¡n hÃ ng',
            children: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Doanh thu" value={money(salesTotals.totalRevenue)} color="text-emerald-600" />
                  <StatCard label="Tá»•ng Ä‘Æ¡n hÃ ng" value={salesTotals.totalOrders.toLocaleString('vi-VN')} />
                  <StatCard label="Lá»£i nhuáº­n gá»™p" value={money(salesTotals.grossProfit)} color={salesTotals.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                  <StatCard label="SP bÃ¡n ra" value={salesTotals.totalItemsSold.toLocaleString('vi-VN')} />
                </div>
                <Card>
                  <CardHeader title="Chi tiáº¿t bÃ¡o cÃ¡o bÃ¡n hÃ ng" description={`${salesData.length} ká»³ bÃ¡o cÃ¡o`} />
                  <div className="px-4 pb-4">
                    <Table loading={loading} dataSource={salesData.map((r, i) => ({ ...r, key: i }))} columns={salesColumns} pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} size="small" />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'purchase',
            label: 'BÃ¡o cÃ¡o nháº­p hÃ ng',
            children: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Tá»•ng chi nháº­p" value={money(purchaseTotals.totalAmount)} color="text-blue-600" />
                  <StatCard label="Sá»‘ Ä‘Æ¡n nháº­p" value={purchaseTotals.totalOrders.toLocaleString('vi-VN')} />
                  <StatCard label="Tá»•ng SL nháº­p" value={Math.round(purchaseTotals.totalQuantity).toLocaleString('vi-VN')} />
                  <StatCard label="NhÃ  cung cáº¥p" value={purchaseTotals.supplierCount} />
                </div>
                <Card>
                  <CardHeader title="Chi tiáº¿t nháº­p hÃ ng theo NCC" description={`${purchaseData.length} nhÃ  cung cáº¥p`} />
                  <div className="px-4 pb-4">
                    <Table loading={loading} dataSource={purchaseData.map((r) => ({ ...r, key: r.supplierId }))} columns={purchaseColumns} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} size="small" />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'inventory',
            label: 'BÃ¡o cÃ¡o tá»“n kho',
            children: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Tá»•ng tá»“n kho" value={Math.round(inventoryTotals.totalStock).toLocaleString('vi-VN')} />
                  <StatCard label="Tá»•ng hao há»¥t" value={Math.round(inventoryTotals.totalShrinkage).toLocaleString('vi-VN')} color={inventoryTotals.totalShrinkage > 0 ? 'text-red-600' : 'text-slate-800'} />
                  <StatCard label="Cáº­n háº¡n (â‰¤30 ngÃ y)" value={inventoryTotals.nearExpiry} color={inventoryTotals.nearExpiry > 0 ? 'text-amber-600' : 'text-slate-800'} />
                  <StatCard label="Quay vÃ²ng TB" value={inventoryTotals.avgTurnover.toFixed(2)} />
                </div>
                <Card>
                  <CardHeader title="Chi tiáº¿t tá»“n kho" description={`${inventoryData.length} sáº£n pháº©m`} />
                  <div className="px-4 pb-4">
                    <Table loading={loading} dataSource={inventoryData.map((r) => ({ ...r, key: r.itemId }))} columns={inventoryColumns} pagination={{ pageSize: 10 }} scroll={{ x: 1500 }} size="small" />
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
const userFormValidateMessages = {
  required: 'Vui lÃ²ng nháº­p ${label}',
  types: {
    email: '${label} khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng',
  },
  string: {
    min: '${label} pháº£i cÃ³ Ã­t nháº¥t ${min} kÃ½ tá»±',
    max: '${label} khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ ${max} kÃ½ tá»±',
  },
};
function UsersPage() {
  const [users, setUsers] = React.useState<UserDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserDto | null>(null);
  const [form] = Form.useForm();

  const loadUsers = React.useCallback(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch((e) => antdMessage.error(e instanceof Error ? e.message : 'KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch ngÆ°á»i dÃ¹ng'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'ROLE_STAFF' });
    setModalOpen(true);
  };

  const openEdit = (user: UserDto) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingUser) {
        const fullName = values.fullName?.trim();
        const email = values.email?.trim();

        await updateUser(editingUser.id, {
          fullName: fullName || undefined,
          email: email || undefined,
        });
        antdMessage.success('Cáº­p nháº­t ngÆ°á»i dÃ¹ng thÃ nh cÃ´ng');
      } else {
        await createUser({
          username: values.username.trim(),
          password: values.password,
          email: values.email.trim(),
          fullName: values.fullName?.trim() || undefined,
          role: values.role,
        });
        antdMessage.success('Táº¡o ngÆ°á»i dÃ¹ng thÃ nh cÃ´ng');
      }
      setModalOpen(false);
      loadUsers();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Thao tÃ¡c tháº¥t báº¡i');
    }
  };

  const statusTag = (status: UserStatus) => {
    if (status === 'ACTIVE') return <Tag color="green">ACTIVE</Tag>;
    if (status === 'LOCKED') return <Tag color="orange">LOCKED</Tag>;
    return <Tag color="red">INACTIVE</Tag>;
  };

  const roleText = (role: Role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'ADMIN';
      case 'ROLE_MANAGER':
        return 'QUáº¢N LÃ';
      case 'ROLE_STAFF':
        return 'THU NGÃ‚N';
      case 'ROLE_WAREHOUSE':
        return 'KHO';
      case 'ROLE_ANALYST':
        return 'PHÃ‚N TÃCH';
    }
  };
  const columns: ColumnsType<UserDto> = [
    { title: 'TÃªn Ä‘Äƒng nháº­p', dataIndex: 'username' },
    { title: 'Há» tÃªn', dataIndex: 'fullName' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Vai trÃ²', dataIndex: 'role', render: roleText },
    { title: 'Tráº¡ng thÃ¡i', dataIndex: 'status', render: statusTag },
    {
      title: 'Thao tÃ¡c',
      render: (_, user) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEdit(user)}>Sá»­a</Button>
          <Button
            size="small"
            danger
            disabled={user.status === 'LOCKED' || user.status === 'INACTIVE'}
            onClick={() => {
              Modal.confirm({
                title: 'KhÃ³a tÃ i khoáº£n?',
                content: `Báº¡n muá»‘n khÃ³a ${user.username}?`,
                onOk: async () => {
                  try {
                    await lockUser(user.id);
                    antdMessage.success('KhÃ³a tÃ i khoáº£n thÃ nh cÃ´ng');
                    loadUsers();
                  } catch (e) {
                  antdMessage.error(e instanceof Error ? e.message : 'KhÃ´ng thá»ƒ khÃ³a tÃ i khoáº£n');
                  }
                },
              });
            }}
          >
            KhÃ³a
          </Button>
          <Button
            size="small"
            disabled={user.status !== 'LOCKED'}
            onClick={() => {
              Modal.confirm({
                title: 'Má»Ÿ khÃ³a tÃ i khoáº£n?',
                content: `Báº¡n muá»‘n má»Ÿ khÃ³a ${user.username}?`,
                onOk: async () => {
                  await unlockUser(user.id);
                  antdMessage.success('Má»Ÿ khÃ³a tÃ i khoáº£n thÃ nh cÃ´ng');
                  loadUsers();
                },
          });
    }}
>
  Má»Ÿ khÃ³a
</Button>
          <Button
            size="small"
            danger
            disabled={user.status !== 'LOCKED'}
            onClick={() => {
              Modal.confirm({
                title: 'XÃ³a má»m tÃ i khoáº£n?',
                content: 'Backend yÃªu cáº§u tÃ i khoáº£n pháº£i LOCKED trÆ°á»›c khi chuyá»ƒn sang INACTIVE.',
                onOk: async () => {
                  await softDeleteUser(user.id);
                  antdMessage.success('XÃ³a má»m thÃ nh cÃ´ng');
                  loadUsers();
                },
              });
            }}
          >
            XÃ³a má»m
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="NgÆ°á»i dÃ¹ng há»‡ thá»‘ng"
        description="Admin táº¡o tÃ i khoáº£n, cáº­p nháº­t vai trÃ², khÃ³a vÃ  xÃ³a má»m nhÃ¢n sá»±."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Táº¡o má»›i</Button>}
      />

      <div className="px-5 pb-5">
        <Table rowKey="id" loading={loading} dataSource={users} columns={columns} />
      </div>

      <Modal
        title={editingUser ? 'Sá»­a thÃ´ng tin' : 'ThÃªm ngÆ°á»i dÃ¹ng má»›i'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingUser ? 'Cáº­p nháº­t' : 'Táº¡o má»›i'}
        cancelText="Há»§y"
        forceRender
      >
        <Form form={form} layout="vertical" validateMessages={userFormValidateMessages}>
          {!editingUser && (
            <>
              <Form.Item name="username" label="TÃªn Ä‘Äƒng nháº­p" messageVariables={{ label: 'tÃªn Ä‘Äƒng nháº­p' }} rules={[{ required: true }, { min: 4 }, { max: 50 }, { pattern: /^[a-zA-Z0-9_.]+$/, message: 'TÃªn Ä‘Äƒng nháº­p chá»‰ Ä‘Æ°á»£c chá»©a chá»¯, sá»‘ vÃ  gáº¡ch dÆ°á»›i hoáº·c dáº¥u cháº¥m' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Máº­t kháº©u" messageVariables={{ label: 'máº­t kháº©u' }} rules={[{ required: true }, { min: 6 }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item name="fullName" label="Há» tÃªn" messageVariables={{ label: 'há» tÃªn' }} rules={[{ max: 100 }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            messageVariables={{ label: 'email' }}
            rules={[
              ...(!editingUser ? [{ required: true }] : []),
              { type: 'email' },
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="role"
              label="Vai trÃ²"
              messageVariables={{ label: 'vai trÃ²' }}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'ROLE_ADMIN' satisfies Role, label: 'Admin' },
                  { value: 'ROLE_MANAGER' satisfies Role, label: 'Quáº£n lÃ½' },
                  { value: 'ROLE_STAFF' satisfies Role, label: 'Thu ngÃ¢n' },
                  { value: 'ROLE_WAREHOUSE' satisfies Role, label: 'Kho' },
                  { value: 'ROLE_ANALYST' satisfies Role, label: 'PhÃ¢n tÃ­ch' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}

function SettingsPage() {
  const [settings, setSettings] = React.useState<Array<{ key: string; value: string; description?: string }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSettings()
      .then((rows) => setSettings(rows.map((r) => ({ key: r.key, value: r.value, description: r.description }))))
      .catch(() => setSettings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    try {
      await updateSetting(key, value);
      antdMessage.success('ÄÃ£ lÆ°u cáº¥u hÃ¬nh');
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'LÆ°u tháº¥t báº¡i');
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted">Äang táº£i cáº¥u hÃ¬nh...</Card>;
  }

  if (settings.length === 0) {
    return (
      <Card className="p-8 text-center text-muted">
        ChÆ°a cÃ³ cáº¥u hÃ¬nh trong há»‡ thá»‘ng. ThÃªm báº£n ghi vÃ o báº£ng settings (Flyway V3).
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {settings.map((setting) => (
        <Card className="p-5" key={setting.key}>
          <h3 className="text-lg font-semibold mb-1">{setting.key}</h3>
          {setting.description && <p className="text-sm text-muted mb-4">{setting.description}</p>}
          <Form layout="vertical" onFinish={(vals) => handleSave(setting.key, vals.value)}>
            <Form.Item label="GiÃ¡ trá»‹" name="value" initialValue={setting.value}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">LÆ°u</Button>
          </Form>
        </Card>
      ))}
    </div>
  );
}

function InvoiceDrawer({
  invoice,
  authUser,
  onClose,
  onCancelled,
}: {
  invoice: any | null;
  authUser: UserDto;
  onClose: () => void;
  onCancelled?: () => void;
}) {
  const canCancel = authUser.role === 'ROLE_ADMIN' || authUser.role === 'ROLE_MANAGER';

  const handlePrint = async () => {
    if (!invoice?.orderId) {
      antdMessage.warning('KhÃ´ng cÃ³ mÃ£ Ä‘Æ¡n Ä‘á»ƒ in');
      return;
    }
    try {
      const data = await fetchOrderPrint(invoice.orderId);
      const lines = data.items.map((it) =>
        `<tr><td>${it.itemName}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${money(it.unitPrice)}</td><td style="text-align:right">${money(it.lineTotal)}</td></tr>`
      ).join('');
      const html = `<html><head><title>${data.orderCode}</title></head><body style="font-family:monospace;padding:16px">
        <h2>SMARTMART AI</h2><p>MÃ£ HÄ: ${data.orderCode}</p><p>KH: ${data.customerName}</p><p>NV: ${data.staffName}</p>
        <table width="100%" border="1" cellpadding="4"><tr><th>SP</th><th>SL</th><th>ÄG</th><th>TT</th></tr>${lines}</table>
        <p><strong>Tá»•ng: ${money(data.totalAmount)}</strong></p></body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'In hÃ³a Ä‘Æ¡n tháº¥t báº¡i');
    }
  };

  const handleCancel = async () => {
    if (!invoice?.orderId) return;
    try {
      await cancelOrder(invoice.orderId);
      antdMessage.success('ÄÃ£ há»§y hÃ³a Ä‘Æ¡n');
      onCancelled?.();
      onClose();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Há»§y tháº¥t báº¡i');
    }
  };
  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (invoice) animateDrawer(bodyRef.current, true);
  }, [invoice]);
  return (
    <Drawer open={Boolean(invoice)} onClose={onClose} title="Chi tiáº¿t hÃ³a Ä‘Æ¡n bÃ¡n hÃ ng" width={450}>
      {invoice ? (
        <div ref={bodyRef} className="space-y-5">
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-4">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <strong className="text-slate-800 text-lg">{invoice.key}</strong>
              <StatusChip tone={invoice.status.includes('toÃ¡n') ? 'success' : 'warning'}>{invoice.status}</StatusChip>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600">
              <span>KhÃ¡ch hÃ ng:</span><span className="font-bold text-slate-800 text-right">{invoice.customer}</span>
              <span>Thá»i gian mua:</span><span className="text-slate-800 text-right">{invoice.time} - HÃ´m nay</span>
              <span>Thu ngÃ¢n:</span><span className="text-slate-800 text-right">{invoice.cashier}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Chi tiáº¿t sáº£n pháº©m</h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {invoice.items?.map((it: any, idx: number) => (
                <div className="flex justify-between items-center rounded-xl bg-slate-50 p-3 text-sm border border-slate-100" key={idx}>
                  <div className="min-w-0 flex-1 pr-3">
                    <strong className="font-semibold text-slate-700 block truncate">{it.name}</strong>
                    <span className="text-xs text-slate-400">{it.qty} x {money(it.price)}</span>
                  </div>
                  <strong className="text-slate-800 font-bold">{money(it.qty * it.price)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-slate-200 pt-4 bg-slate-50/50 p-4 rounded-xl">
            <div className="flex justify-between text-slate-500">
              <span>Táº¡m tÃ­nh</span>
              <span>{money(invoice.subtotal || invoice.amount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Giáº£m giÃ¡ KM</span>
                <span>-{money(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Thuáº¿ VAT (8%)</span>
              <span>{money(invoice.vat || 0)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-800 border-t border-slate-200 pt-2 mt-2">
              <span>Tá»•ng sá»‘ tiá»n:</span>
              <span className="text-primary text-lg">{money(invoice.amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button icon={<Printer size={16} />} onClick={handlePrint}>In hÃ³a Ä‘Æ¡n</Button>
            {canCancel && invoice.rawStatus === 'COMPLETED' && (
              <Button danger onClick={handleCancel}>Há»§y hÃ³a Ä‘Æ¡n</Button>
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const [action, setAction] = React.useState<string | undefined>();
  const [username, setUsername] = React.useState<string | undefined>();
  const [entityType, setEntityType] = React.useState<string | undefined>();
  const [actionOptions, setActionOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
  if (!entityType) {
    setActionOptions([]);
    return;
  }

  fetchAuditLogActions(entityType)
    .then(setActionOptions)
    .catch(() => setActionOptions([]));
}, [entityType]);

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      let res;

      if (action) {
        res = await fetchAuditLogsByAction(action, page, size);
      } else if (entityType) {
        res = await fetchAuditLogsByEntity(entityType, undefined, page, size);
      } else if (username) {
        res = await fetchAuditLogsByUsername(username, page, size);
      } else {
        res = await fetchAuditLogs(page, size);
      }

      setLogs(res.content);
      setTotal(res.totalElements);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'KhÃ´ng táº£i Ä‘Æ°á»£c nháº­t kÃ½ há»‡ thá»‘ng');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, action, username, entityType]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const columns: ColumnsType<AuditLogDto> = [
    {
      title: 'Thá»i gian',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString('vi-VN'),
    },
    {
    title: 'HÃ nh Ä‘á»™ng',
    dataIndex: 'action',
    render: (value: string) => (
      <Tag color="blue">{formatAuditAction(value)}</Tag>
  ),
    },
    {
      title: 'PhÃ¢n há»‡',
      dataIndex: 'entityType',
      render: (value?: string | null) => formatAuditModule(value),
    },
    {
      title: 'NgÆ°á»i thao tÃ¡c',
      dataIndex: 'username',
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Chi tiáº¿t',
      dataIndex: 'detail',
      render: (value?: string) => value || '-',
    },
    {
      title: 'Thay Ä‘á»•i',
      render: (_, row) => (
      <div className="space-y-3 text-xs">
        <AuditDataBlock title="TrÆ°á»›c" value={row.beforeData} />
      <AuditDataBlock title="Sau" value={row.afterData} />
    </div>
  ),
},
  ];


  const auditModuleOptions = [
  { value: 'AUTH', label: 'ÄÄƒng nháº­p vÃ  báº£o máº­t' },
  { value: 'USER', label: 'Quáº£n lÃ½ ngÆ°á»i dÃ¹ng' },
  { value: 'CUSTOMER', label: 'KhÃ¡ch hÃ ng' },
  { value: 'CATEGORY', label: 'Danh má»¥c' },
  { value: 'ITEM', label: 'Sáº£n pháº©m' },
  { value: 'SUPPLIER', label: 'NhÃ  cung cáº¥p' },
  { value: 'LOCATION', label: 'Kho vÃ  vá»‹ trÃ­' },
  { value: 'UOM', label: 'ÄÆ¡n vá»‹ tÃ­nh' },
  { value: 'ORDER', label: 'BÃ¡n hÃ ng vÃ  hÃ³a Ä‘Æ¡n' },
  { value: 'PURCHASE_ORDER', label: 'Nháº­p hÃ ng' },
  { value: 'SCRAP_ORDER', label: 'Há»§y hÃ ng' },
  { value: 'INVENTORY_ALERT', label: 'Cáº£nh bÃ¡o tá»“n kho' },
  { value: 'PROMOTION', label: 'Khuyáº¿n mÃ£i' },
  { value: 'SYSTEM', label: 'Há»‡ thá»‘ng' },
  { value: 'PROMOTION', label: 'Khuyáº¿n mÃ£i' },
];

  function AuditDataBlock({ title, value }: { title: string; value?: string | null }) {
  const items = parseAuditData(value);

  if (!items.length) {
    return (
      <div>
        <div className="mb-1 font-semibold text-slate-500">{title}</div>
        <span className="text-slate-400">KhÃ´ng cÃ³ dá»¯ liá»‡u</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 font-semibold text-slate-500">{title}</div>
      <div className="space-y-1 rounded-lg bg-slate-50 p-2">
        {items.map((item) => (
          <div key={item.key} className="flex gap-2">
            <span className="min-w-[90px] font-medium text-slate-500">{auditFieldLabel(item.key)}:</span>
            <span className="break-all text-slate-800">{formatAuditValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseAuditData(value?: string | null) {
  if (!value || value === '-') return [];

  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [key, ...rest] = part.split('=');
      return {
        key: key.trim(),
        value: rest.join('=').trim(),
      };
    })
    .filter((item) => item.key);
}

function auditFieldLabel(key: string) {
  const labels: Record<string, string> = {
    username: 'TÃªn Ä‘Äƒng nháº­p',
    email: 'Email',
    fullName: 'Há» tÃªn',
    role: 'Vai trÃ²',
    status: 'Tráº¡ng thÃ¡i',
    itemCode: 'MÃ£ sáº£n pháº©m',
    itemName: 'TÃªn sáº£n pháº©m',
    itemType: 'Loáº¡i sáº£n pháº©m',
    categoryId: 'Danh má»¥c',
    supplierName: 'NhÃ  cung cáº¥p',
    contactPerson: 'NgÆ°á»i liÃªn há»‡',
    phone: 'Sá»‘ Ä‘iá»‡n thoáº¡i',
    address: 'Äá»‹a chá»‰',
    locationName: 'TÃªn kho',
    locationType: 'Loáº¡i kho',
    parentId: 'PhÃ¢n cáº¥p cha',
    uomName: 'ÄÆ¡n vá»‹ tÃ­nh',
    conversionRatio: 'Tá»· lá»‡ quy Ä‘á»•i',
    baseUnit: 'ÄÆ¡n vá»‹ cÆ¡ sá»Ÿ',
    costPrice: 'GiÃ¡ nháº­p',
    sellingPrice: 'GiÃ¡ bÃ¡n',
    minimumStock: 'Tá»“n tá»‘i thiá»ƒu',
    hasExpiry: 'CÃ³ háº¡n sá»­ dá»¥ng',
    active: 'Hoáº¡t Ä‘á»™ng',
    orderCode: 'MÃ£ hÃ³a Ä‘Æ¡n',
    customerName: 'KhÃ¡ch hÃ ng',
    paymentMethod: 'Thanh toÃ¡n',
    discountAmount: 'Giáº£m giÃ¡',
    totalAmount: 'Tá»•ng tiá»n',
    loyaltyPoints: 'Äiá»ƒm tÃ­ch lÅ©y',
    tier: 'Háº¡ng thÃ nh viÃªn',
    alertType: 'Loáº¡i cáº£nh bÃ¡o',
    severity: 'Má»©c Ä‘á»™',
    resolved: 'ÄÃ£ xá»­ lÃ½',
    itemCount: 'Sá»‘ máº·t hÃ ng',
    note: 'Ghi chÃº',
    reason: 'LÃ½ do',
    name: 'TÃªn khuyáº¿n mÃ£i',
    code: 'MÃ£ khuyáº¿n mÃ£i',
    type: 'Loáº¡i khuyáº¿n mÃ£i',
    value: 'GiÃ¡ trá»‹',
    minOrder: 'ÄÆ¡n hÃ ng tá»‘i thiá»ƒu',
    startDate: 'NgÃ y báº¯t Ä‘áº§u',
    endDate: 'NgÃ y káº¿t thÃºc',
  };

  return labels[key] ?? key;
}

function formatAuditValue(value: string) {
  if (!value) return '-';

  const roleLabels: Record<string, string> = {
    ROLE_ADMIN: 'Admin',
    ROLE_MANAGER: 'Quáº£n lÃ½',
    ROLE_STAFF: 'Thu ngÃ¢n',
    ROLE_WAREHOUSE: 'Kho',
    ROLE_ANALYST: 'PhÃ¢n tÃ­ch',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Hoáº¡t Ä‘á»™ng',
    LOCKED: 'ÄÃ£ khÃ³a',
    INACTIVE: 'KhÃ´ng hoáº¡t Ä‘á»™ng',
  };

  return roleLabels[value] ?? statusLabels[value] ?? value;
}

  const resetFilters = () => {
    setAction(undefined);
    setUsername(undefined);
    setEntityType(undefined);
    setPage(0);
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-5">
        <h2 className="text-lg font-bold text-ink">Nháº­t kÃ½ há»‡ thá»‘ng</h2>
        <p className="text-sm text-slate-500">
          Theo dÃµi cÃ¡c thao tÃ¡c quan trá»ng nhÆ° Ä‘Äƒng nháº­p, táº¡o ngÆ°á»i dÃ¹ng, cáº­p nháº­t tráº¡ng thÃ¡i vÃ  thay Ä‘á»•i dá»¯ liá»‡u.
        </p>
      </div>

      <div className="grid gap-3 border-b border-line p-5 md:grid-cols-3">
  <Select
    allowClear
    showSearch
    placeholder="PhÃ¢n há»‡"
    value={entityType}
    optionFilterProp="label"
    onChange={(value) => {
      setEntityType(value);
      setAction(undefined);
      setPage(0);
    }}
    options={auditModuleOptions}
  />

  <Select
  allowClear
  showSearch
  placeholder="HÃ nh Ä‘á»™ng"
  value={action}
  disabled={!entityType}
  optionFilterProp="label"
  onChange={(value) => {
    setAction(value);
    setPage(0);
  }}
  options={actionOptions.map((item) => ({
    value: item,
    label: formatAuditAction(item),
  }))}
/>

  <Input
    placeholder="NgÆ°á»i thao tÃ¡c"
    value={username}
    onChange={(e) => {
      setUsername(e.target.value || undefined);
      setPage(0);
    }}
  />

</div>

      <div className="flex justify-end gap-2 px-5 py-3">
        <Button onClick={resetFilters}>XÃ³a lá»c</Button>
        <Button type="primary" onClick={loadLogs}>Táº£i láº¡i</Button>
      </div>

      <div className="px-5 pb-5">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={logs}
          columns={columns}
          pagination={{
            current: page + 1,
            pageSize: size,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage - 1);
              setSize(nextSize);
            },
          }}
        />
      </div>
    </Card>
  );
}
function formatAuditModule(entityType?: string | null) {
  const labels: Record<string, string> = {
  AUTH: 'ÄÄƒng nháº­p vÃ  báº£o máº­t',
  USER: 'Quáº£n lÃ½ ngÆ°á»i dÃ¹ng',
  CUSTOMER: 'KhÃ¡ch hÃ ng',
  CATEGORY: 'Danh má»¥c',
  ITEM: 'Sáº£n pháº©m',
  SUPPLIER: 'NhÃ  cung cáº¥p',
  LOCATION: 'Kho vÃ  vá»‹ trÃ­',
  UOM: 'ÄÆ¡n vá»‹ tÃ­nh',
  ORDER: 'BÃ¡n hÃ ng vÃ  hÃ³a Ä‘Æ¡n',
  PURCHASE_ORDER: 'Nháº­p hÃ ng',
  SCRAP_ORDER: 'Há»§y hÃ ng',
  INVENTORY_ALERT: 'Cáº£nh bÃ¡o tá»“n kho',
  PROMOTION: 'Khuyáº¿n mÃ£i',
  SYSTEM: 'Há»‡ thá»‘ng',
};

  return entityType ? labels[entityType] ?? entityType : '-';
}

function formatAuditAction(action?: string | null) {
  if (!action) return '-';

  const labels: Record<string, string> = {
    AUTH_LOGIN: 'ÄÄƒng nháº­p',
    AUTH_LOGOUT: 'ÄÄƒng xuáº¥t',
    AUTH_REFRESH: 'LÃ m má»›i phiÃªn Ä‘Äƒng nháº­p',

    CUSTOMER_CREATE: 'Táº¡o khÃ¡ch hÃ ng',
    CUSTOMER_UPDATE: 'Cáº­p nháº­t khÃ¡ch hÃ ng',
    CUSTOMER_POINTS_EARNED: 'Cá»™ng Ä‘iá»ƒm khÃ¡ch hÃ ng',

    USER_CREATE: 'Táº¡o ngÆ°á»i dÃ¹ng',
    USER_UPDATE: 'Cáº­p nháº­t ngÆ°á»i dÃ¹ng',
    USER_LOCKED: 'KhÃ³a tÃ i khoáº£n',
    USER_UNLOCKED: 'Má»Ÿ khÃ³a tÃ i khoáº£n',
    USER_SOFT_DELETE: 'Ngá»«ng hoáº¡t Ä‘á»™ng tÃ i khoáº£n',

    SUPPLIER_CREATE: 'Táº¡o nhÃ  cung cáº¥p',
    SUPPLIER_UPDATE: 'Cáº­p nháº­t nhÃ  cung cáº¥p',

    LOCATION_CREATE: 'Táº¡o kho',
    LOCATION_UPDATE: 'Cáº­p nháº­t kho',

    UOM_CREATE: 'Táº¡o Ä‘Æ¡n vá»‹ tÃ­nh',

    ORDER_CREATE: 'Táº¡o hÃ³a Ä‘Æ¡n',
    ORDER_CANCEL: 'Há»§y hÃ³a Ä‘Æ¡n',

    INVENTORY_ALERT_CREATE: 'Táº¡o cáº£nh bÃ¡o tá»“n kho',
    INVENTORY_ALERT_RESOLVE: 'Xá»­ lÃ½ cáº£nh bÃ¡o tá»“n kho',

    ITEM_CREATE: 'Táº¡o sáº£n pháº©m',
    ITEM_UPDATE: 'Cáº­p nháº­t sáº£n pháº©m',
    ITEM_DELETE: 'Ngá»«ng kinh doanh sáº£n pháº©m',

    PURCHASE_CREATE: 'Táº¡o phiáº¿u nháº­p',
    PURCHASE_RECEIVE: 'Nháº­n hÃ ng',
    PURCHASE_CANCEL: 'Há»§y phiáº¿u nháº­p',

    SCRAP_CREATE: 'Táº¡o phiáº¿u há»§y hÃ ng',
    SCRAP_APPROVE: 'Duyá»‡t phiáº¿u há»§y hÃ ng',
    SCRAP_CANCEL: 'Tá»« chá»‘i phiáº¿u há»§y hÃ ng',

    PROMOTION_CREATE: 'Táº¡o khuyáº¿n mÃ£i',
    PROMOTION_UPDATE: 'Cáº­p nháº­t khuyáº¿n mÃ£i',
    PROMOTION_DELETE: 'XÃ³a khuyáº¿n mÃ£i',
  };

  return labels[action] ?? action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
export default App;
