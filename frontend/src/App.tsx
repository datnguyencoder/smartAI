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
  { key: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { key: 'products', label: 'Sản phẩm', icon: Package },
  { key: 'categories', label: 'Danh mục', icon: Tags },
  { key: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
  { key: 'locations', label: 'Vị trí kho', icon: Building2 },
  { key: 'pos', label: 'Bán hàng tại quầy', icon: ShoppingCart },
  { key: 'customers', label: 'Khách hàng', icon: UserCheck },
  { key: 'invoices', label: 'Hóa đơn bán hàng', icon: ReceiptText },
  { key: 'import-create', label: 'Tạo phiếu nhập', icon: FileInput },
  { key: 'import-slips', label: 'Phiếu nhập hàng', icon: ClipboardCheck },
  { key: 'inventory', label: 'Tồn kho', icon: Warehouse },
  { key: 'scrap-orders', label: 'Quản lý Yêu cầu loại bỏ', icon: Trash2 },
  { key: 'scrap-create', label: 'Tạo Yêu cầu loại bỏ', icon: Plus },
  { key: 'inventory-alerts', label: 'Cảnh báo tồn kho', icon: AlertTriangle },
  { key: 'inventory-logs', label: 'Lịch sử biến động', icon: ScrollText },
  { key: 'ai-forecast', label: 'Dự báo AI', icon: BrainCircuit },
  { key: 'purchase-suggestions', label: 'Gợi ý nhập hàng', icon: Bot },
  { key: 'expiry-risk', label: 'Rủi ro hết hạn', icon: CalendarClock },
  { key: 'promotions', label: 'Đề xuất KM (AI)', icon: WandSparkles },
  { key: 'promotion-manage', label: 'Quản lý mã KM', icon: BadgePercent },
  { key: 'ai-assistant', label: 'Trợ lý AI', icon: Sparkles },
  { key: 'reports', label: 'Báo cáo hệ thống', icon: BarChart3 },
  { key: 'users', label: 'Người dùng', icon: UsersRound },
  { key: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
  {key: 'audit-logs', label: 'Nhật ký hệ thống', icon: FileClock },
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
  { name: 'Đồ uống', value: 34, color: '#10b981' },
  { name: 'Bánh kẹo', value: 22, color: '#4648d4' },
  { name: 'Thực phẩm', value: 18, color: '#f59e0b' },
  { name: 'Gia dụng', value: 14, color: '#0ea5e9' },
  { name: 'Khác', value: 12, color: '#94a3b8' },
];

const money = formatMoney;

function ordersToInvoices(orders: Awaited<ReturnType<typeof fetchOrders>>) {
  return orders.map((o) => ({
    key: o.orderCode,
    orderId: o.id,
    rawStatus: o.status,
    customer: o.customerName,
    amount: Number(o.totalAmount),
    cashier: o.cashierName || 'Hệ thống',
    status: o.status === 'CANCELLED' ? 'Đã hủy' : 'Đã thanh toán',
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
          if (prod.stock === 0) prod.status = 'Hết hàng';
          else if (prod.stock <= (item.minimumStock ?? 0)) prod.status = 'Sắp hết';
          else prod.status = 'Còn hàng';
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

const pageTitles: Record<PageKey, { title: string; description: string }> = {
  dashboard: { title: 'Bảng điều khiển', description: 'Tổng quan doanh thu, tồn kho, cảnh báo và dự báo AI.' },
  products: { title: 'Quản lý sản phẩm', description: 'Theo dõi SKU, giá bán, tồn kho và trạng thái kinh doanh.' },
  categories: { title: 'Quản lý danh mục', description: 'Tổ chức nhóm hàng, biên lợi nhuận và số lượng sản phẩm.' },
  suppliers: { title: 'Quản lý nhà cung cấp', description: 'Theo dõi đối tác, công nợ, lịch giao hàng và SLA.' },
  locations: { title: 'Vị trí kho hàng', description: 'Sơ đồ kho, sức chứa và khu vực lưu trữ hàng hóa.' },
  pos: { title: 'Bán hàng tại quầy POS', description: 'Quét sản phẩm, tạo giỏ hàng và thanh toán nhanh.' },
  customers: { title: 'Quản lý khách hàng', description: 'Tra cứu SĐT, điểm tích lũy và lịch sử mua hàng.' },
  invoices: { title: 'Hóa đơn bán hàng', description: 'Tra cứu hóa đơn, trạng thái thanh toán và giao dịch hoàn tiền.' },
  'import-create': { title: 'Tạo phiếu nhập hàng', description: 'Nhập hàng từ nhà cung cấp với kiểm tra tồn kho tức thời.' },
  'import-slips': { title: 'Phiếu nhập hàng', description: 'Quản lý phiếu nhập, trạng thái duyệt và lịch nhận hàng.' },
  inventory: { title: 'Quản lý tồn kho', description: 'Kiểm soát tồn theo kho, ngưỡng cảnh báo và vòng quay hàng.' },
  'scrap-orders': { title: 'Quản lý Yêu cầu loại bỏ hàng hóa', description: 'Danh sách và duyệt các yêu cầu xuất hủy hàng hóa.' },
  'scrap-create': { title: 'Tạo Yêu cầu loại bỏ hàng hóa', description: 'Tạo phiếu xuất hủy hàng hóa hỏng, lỗi, hoặc hết hạn.' },
  'inventory-alerts': { title: 'Cảnh báo tồn kho', description: 'Ưu tiên sản phẩm hết hàng, sắp hết và tồn bất thường.' },
  'inventory-logs': { title: 'Lịch sử biến động kho', description: 'Nhật ký toàn bộ biến động nhập, xuất, hủy và điều chỉnh tồn kho.' },
  'ai-forecast': { title: 'Dự báo AI', description: 'Mô hình dự báo nhu cầu, doanh thu và rủi ro vận hành.' },
  'purchase-suggestions': { title: 'Gợi ý nhập hàng', description: 'Đề xuất số lượng nhập tối ưu dựa trên tốc độ bán.' },
  'expiry-risk': { title: 'Rủi ro hết hạn', description: 'Theo dõi lô hàng gần hết hạn và đề xuất xử lý.' },
  promotions: { title: 'Đề xuất KM (AI)', description: 'Gemini đề xuất giảm giá — Manager duyệt → mã KM dùng tại POS.' },
  'promotion-manage': { title: 'Quản lý mã KM', description: 'Tạo mã giảm giá, thời hạn áp dụng và dùng ngay tại POS.' },
  'ai-assistant': { title: 'Trợ lý AI', description: 'Hỏi đáp nghiệp vụ, phân tích bán hàng và tạo tác vụ nhanh.' },
  reports: { title: 'Báo cáo hệ thống', description: 'Báo cáo doanh thu, tồn kho, nhân sự và hiệu quả AI.' },
  users: { title: 'Quản lý người dùng', description: 'Phân quyền nhân viên, vai trò và nhật ký truy cập.' },
  settings: { title: 'Cài đặt hệ thống', description: 'Cấu hình cửa hàng, AI, cảnh báo và tích hợp.' },
  'audit-logs': {
  title: 'Nhật ký hệ thống',
  description: 'Theo dõi lịch sử thao tác, thay đổi dữ liệu và hoạt động người dùng.',
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
          <p className="text-xs text-slate-300">Quản lý siêu thị mini bằng AI</p>
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
          <Sparkles size={16} /> Nâng cấp AI Pro
        </UiButton>
        <p className="mb-2 px-2 text-xs text-slate-400 truncate">
          {authUser.fullName ?? authUser.username} · {roleLabel(authUser.role)}
        </p>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={onLogout}
        >
          <LogOut size={16} /> Đăng xuất
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
            <p className="text-xs text-slate-300">Quản lý siêu thị mini bằng AI</p>
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
            <LogOut size={16} /> Đăng xuất
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
        <Button className="md:hidden" icon={<Menu size={17} />} onClick={openMobileNav} aria-label="Mở menu" />
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
            placeholder="Tìm kiếm sản phẩm, hóa đơn, cảnh báo..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            allowClear
          />
          <Button
            icon={themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            onClick={onToggleTheme}
            aria-label="Đổi giao diện"
          />
          <SystemActivityBell authUser={authUser} setPage={setPage} />
          {showQuickCreate && (
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Tạo nhanh
            </Button>
          )}
          <span className="text-xs font-medium text-muted hidden xl:inline">{roleLabel(authUser.role)}</span>
        </div>
        {showQuickCreate && (
          <Button className="lg:hidden" type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            Tạo
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
          <strong className="text-sm text-ink">Hoạt động hệ thống</strong>
          <p className="text-xs text-muted">Tự động cập nhật mỗi 15 giây</p>
        </div>
        <Button type="link" size="small" onClick={() => setPage('inventory-alerts')}>
          Cảnh báo kho
        </Button>
      </div>
      <div className="max-h-[420px] overflow-y-auto py-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Đang tải hoạt động...</p>
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Chưa có hoạt động mới.</p>
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
                  {activity.username} · {formatActivityTime(activity.createdAt)}
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
        <Button icon={<Bell size={16} />} aria-label="Xem hoạt động hệ thống" />
      </Badge>
    </Popover>
  );
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
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
        <CardHeader title="Không có quyền truy cập" description="Liên hệ quản trị để được cấp quyền." />
        <p className="px-5 pb-5 text-sm text-muted">
          Vai trò hiện tại: {roleLabel(authUser.role)}. Các mục được phép:{' '}
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
          Tạo hóa đơn POS
        </Button>
        {canAccessPage(authUser.role, 'import-create') && (
          <Button icon={<FileInput size={16} />} onClick={() => setPage('import-create')}>
            Tạo phiếu nhập hàng
          </Button>
        )}
        <Button className="ml-auto" type="primary" ghost icon={<Sparkles size={16} />} onClick={() => setPage('ai-forecast')}>
          Chạy dự báo AI
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
        <ProductsTable title="Sản phẩm bán chạy (7 ngày)" rows={topRows} openProduct={openProduct} />
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
    { label: 'Doanh thu thực tế', value: money(todayRevenue), delta: 'Hôm nay', icon: ChartNoAxesCombined, tone: 'emerald' },
    { label: 'Đơn hàng hôm nay', value: todayOrders.toString(), delta: 'Hôm nay', icon: ShoppingCart, tone: 'indigo' },
    { label: 'Sắp hết hàng', value: lowStockCount.toString(), delta: 'Cần nhập', icon: AlertTriangle, tone: 'amber' },
    { label: 'Hết hàng (Nguy cơ)', value: outOfStockCount.toString(), delta: 'Ưu tiên', icon: Gauge, tone: 'red' },
    {
      label: 'Cảnh báo tồn',
      value: String(summary?.activeAlerts ?? lowStockCount + outOfStockCount),
      delta: 'Chưa xử lý',
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
        title="Doanh thu 7 ngày gần nhất"
        description="So sánh doanh thu thực tế và dự báo thông minh từ AI."
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
              name="Doanh thu thực tế"
              fill="url(#revenueBar)"
              radius={[6, 6, 0, 0]}
              barSize={28}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Area
              dataKey="forecast"
              name="Dự báo AI"
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
              {entry.dataKey === 'revenue' || entry.dataKey === 'forecast' ? `${entry.value} triệu` : entry.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiSummary({ setPage }: { setPage: (page: PageKey) => void }) {
  const insights = [
    ['Cần nhập hàng', '12', 'warning'],
    ['Nguy cơ hết hàng', '7', 'danger'],
    ['Tồn kho dư thừa', '5', 'ai'],
    ['Sắp hết hạn', '8', 'neutral'],
  ] as const;
  return (
    <Card className="border-t-4 border-t-indigo">
      <CardHeader title="Tóm tắt AI Forecast" description="Nhận diện ưu tiên vận hành trong ngày." action={<Sparkles className="text-indigo animate-pulse" size={22} />} />
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
          Xem gợi ý nhập hàng
        </UiButton>
      </div>
    </Card>
  );
}

function UrgentAlerts({ productsList }: { productsList: Product[] }) {
  const lowStock = productsList.filter(p => p.stock <= 20);
  return (
    <Card>
      <CardHeader title="Cảnh báo khẩn" description="Các vấn đề cần xử lý trước ca tối." />
      <div className="space-y-3 px-5 pb-5">
        {lowStock.slice(0, 3).map((item) => (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4" key={item.key}>
            <div className="flex items-center justify-between">
              <strong className="text-red-800">{item.name}</strong>
              <Tag color="red">{item.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'}</Tag>
            </div>
            <p className="mt-2 text-sm text-red-700">
              {item.stock === 0
                ? 'Còn 0 sản phẩm trong kho, nguy cơ mất doanh số cao!'
                : `Chỉ còn ${item.stock} sản phẩm, dự báo hết hàng trong vòng 1.2 ngày tới.`}
            </p>
          </div>
        ))}
        {lowStock.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <CheckCircle2 size={36} className="text-emerald text-center mb-2" />
            <span className="text-sm">Mọi mặt hàng đều được cấp đầy đủ!</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function IntegrationsStrip() {
  return (
    <Card>
      <CardHeader title="Tích hợp" />
      <div className="grid gap-3 px-5 pb-5 md:grid-cols-4">
        {['Momo Pay', 'Zalo OA', 'KiotViet', 'Google Sheets'].map((name) => (
          <div className="flex items-center justify-between rounded-xl border border-line bg-slate-50 px-4 py-3" key={name}>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-primary shadow-sm">
                <Building2 size={17} />
              </div>
              <strong className="text-sm font-semibold">{name}</strong>
            </div>
            <StatusChip tone="success">Đã kết nối</StatusChip>
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
          placeholder="Tìm theo tên, SKU, mã vạch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-48 h-8 px-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-primary bg-white"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
        >
          <option value="all">Tất cả danh mục</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <Button className="ml-auto" type="primary" icon={<Plus size={16} />} onClick={openModal}>
          Thêm mới sản phẩm
        </Button>
      </Card>
      <ProductsTable title="Danh sách sản phẩm" rows={filtered} openProduct={openProduct} />
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
          <h2 className="font-semibold text-lg">Danh mục hàng hóa</h2>
          <Input className="w-64" prefix={<Search size={16} />} placeholder="Tìm kiếm danh mục..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} allowClear />
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
                  <StatusChip tone={cat.active ? 'success' : 'warning'}>{cat.active ? 'Đang bán' : 'Ngưng'}</StatusChip>
                </div>
                <strong className="text-ink text-base">{cat.categoryName}</strong>
                <p className="mt-1 text-sm text-muted">{count} sản phẩm đang bày bán · Biên lợi nhuận {15 + idx}%</p>
              </motion.div>
            );
          })}
        </div>
      </Card>
      <AiSummary setPage={() => { }} />
      <Modal title={`Sản phẩm trong danh mục: ${selectedCat?.categoryName}`} open={!!selectedCat} onCancel={() => setSelectedCat(null)} footer={null} width={900}>
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
          antdMessage.success('Cập nhật nhà cung cấp thành công');
          setIsEditing(false);
          setSelectedSup(null);
          if (reloadCatalog) await reloadCatalog();
        } catch (e: any) {
          antdMessage.error(e.message || 'Lỗi khi cập nhật');
        } finally {
          setLoading(false);
        }
      };

      if (selectedSup.active && !isActive) {
        Modal.confirm({
          title: 'Xác nhận ngừng hoạt động',
          content: 'Ngừng hoạt động nhà cung cấp này có thể ảnh hưởng đến việc nhập hàng. Bạn có chắc chắn?',
          okText: 'Đồng ý',
          cancelText: 'Hủy',
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
          <h2 className="font-semibold text-lg">Nhà cung cấp đối tác</h2>
          <Input className="w-64" prefix={<Search size={16} />} placeholder="Tìm theo tên, SĐT..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} allowClear />
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {filteredSuppliers.map((sup) => (
            <motion.div whileHover={{ y: -3 }} onClick={() => handleOpen(sup)} className="cursor-pointer rounded-xl border border-line bg-slate-50 p-4 transition-colors hover:bg-slate-100 hover:border-indigo-300" key={sup.id}>
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo">
                  <Truck size={18} />
                </div>
                <StatusChip tone={sup.active ? 'success' : 'warning'}>{sup.active ? 'Hoạt động' : 'Ngưng'}</StatusChip>
              </div>
              <strong className="text-ink text-base">{sup.supplierName}</strong>
              <p className="text-xs text-muted mt-0.5">{sup.contactPerson ?? '—'} · {sup.phone ?? '—'}</p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                {productsList.length} SKU trong hệ thống
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
      <AiSummary setPage={() => { }} />
      <Modal
        title={isEditing ? 'Sửa thông tin Nhà cung cấp' : `Chi tiết: ${selectedSup?.supplierName}`}
        open={!!selectedSup}
        onCancel={() => { setSelectedSup(null); setIsEditing(false); }}
        footer={
          isEditing ? (
            <div className="flex justify-end gap-2">
              <UiButton variant="secondary" onClick={() => setIsEditing(false)} disabled={loading}>Hủy</UiButton>
              <UiButton variant="primary" onClick={handleUpdate} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</UiButton>
            </div>
          ) : (
            canEdit ? <UiButton variant="primary" onClick={() => setIsEditing(true)}>Chỉnh sửa</UiButton> : null
          )
        }
        forceRender
      >
        {selectedSup && !isEditing && (
          <div className="space-y-3 mt-4 text-sm text-slate-700">
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Tên NCC:</span><span>{selectedSup.supplierName}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Người liên hệ:</span><span>{selectedSup.contactPerson || '—'}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">SĐT:</span><span>{selectedSup.phone || '—'}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Email:</span><span>{selectedSup.email || '—'}</span></div>
            <div className="grid grid-cols-[120px_1fr]"><span className="font-semibold text-slate-500">Địa chỉ:</span><span>{selectedSup.address || '—'}</span></div>
          </div>
        )}

        {selectedSup && isEditing && (
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="supplierName" label="Tên nhà cung cấp" rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}>
              <Input placeholder="Nhập tên" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="contactPerson" label="Người liên hệ">
                <Input placeholder="Tên người đại diện" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="Nhập SĐT" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="email" label="Email" className="col-span-2">
                <Input type="email" placeholder="Nhập email" />
              </Form.Item>
            </div>
            <Form.Item name="address" label="Địa chỉ">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
            <Form.Item name="active" label="Trạng thái">
              <select className="h-[34px] w-full px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white">
                <option value="true">Hoạt động</option>
                <option value="false">Ngưng</option>
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
        if (active) antdMessage.error('Lỗi tải hóa đơn');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pagination.page, pagination.size, filters.search, filters.status, filters.fromDate, filters.toDate, reloadTick]);

  const columns = [
    { title: 'Mã hóa đơn', dataIndex: 'key', render: (v: string, row: any) => <button className="font-bold text-primary hover:text-emerald" onClick={() => setSelectedInvoice(row)}>{v}</button> },
    { title: 'Khách hàng', dataIndex: 'customer' },
    { title: 'Thu ngân', dataIndex: 'cashier' },
    { title: 'Tổng thanh toán', dataIndex: 'amount', render: (v: number) => money(v) },
    { title: 'Thời gian', dataIndex: 'time' },
    { title: 'Trạng thái', dataIndex: 'status', render: (v: string) => <StatusChip tone={v.includes('toán') ? 'success' : 'warning'}>{v}</StatusChip> },
    {
      title: 'Hành động',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => setSelectedInvoice(row)}>Chi tiết</Button>
          {canCancel && row.rawStatus === 'COMPLETED' && (
            <Button
              size="small"
              danger
              onClick={async () => {
                try {
                  await cancelOrder(row.orderId);
                  antdMessage.success('Đã hủy hóa đơn');
                  setReloadTick((t) => t + 1);
                } catch (e) {
                  antdMessage.error(e instanceof Error ? e.message : 'Hủy thất bại');
                }
              }}
            >
              Hủy
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <CardHeader title="Danh sách hóa đơn" className="shrink-0" action={
        <div className="flex gap-2">
          <Input.Search
            placeholder="Tìm mã, khách hàng..."
            onSearch={val => { setFilters(f => ({ ...f, search: val })); setPagination(p => ({ ...p, page: 0 })); }}
            style={{ width: 240 }}
            allowClear
          />
          <select
            className="h-8 px-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-primary bg-white"
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 0 })); }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="COMPLETED">Đã thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <DatePicker
            placeholder="Từ ngày"
            onChange={(_, dateStr) => { setFilters(f => ({ ...f, fromDate: dateStr ? (dateStr as string) + 'T00:00:00' : '' })); setPagination(p => ({ ...p, page: 0 })); }}
          />
          <DatePicker
            placeholder="Đến ngày"
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
            status: stock === 0 ? 'Hết hàng' : stock <= 40 ? 'Sắp hết' : 'Còn hàng',
            expiry: row.expiryDate ?? 'Không áp dụng',
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
      {loading && <p className="text-sm text-muted">Đang tải tồn kho từ API…</p>}
      <ProductsTable title="Tồn kho theo vị trí / lô" rows={rows} openProduct={openProduct} />
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
  if (loading) return <p className="text-sm text-muted">Đang tải cảnh báo…</p>;
  if (!alerts.length) return <p className="text-sm text-muted">Không có cảnh báo chưa xử lý.</p>;
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
            Tạo phiếu nhập đối tác
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
      antdMessage.success('Huấn luyện mô hình thành công');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Huấn luyện thất bại');
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
      antdMessage.success('Dự báo hoàn tất');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Dự báo thất bại — kiểm tra ai-service');
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
    if (!iso) return 'Chưa huấn luyện';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Trạng thái AI" description="FastAPI ML service + backend orchestration" />
        <div className="px-5 pb-5 flex flex-wrap gap-4 items-center">
          <Tag color={aiStatus?.aiOnline ? 'success' : 'error'}>
            {aiStatus?.aiOnline ? 'AI Online' : 'AI Offline'}
          </Tag>
          <Tag color={aiStatus?.modelLoaded ? 'processing' : 'default'}>
            {aiStatus?.modelLoaded ? 'Model loaded' : 'Chưa có model'}
          </Tag>
          <span className="text-sm text-slate-500">
            Version: <strong>{aiStatus?.aiVersion ?? '—'}</strong>
          </span>
          <span className="text-sm text-slate-500">
            Model: <strong>{aiStatus?.modelType ?? '—'}</strong>
          </span>
          <span className="text-sm text-slate-500">
            Huấn luyện lần cuối: <strong>{formatTrainedAt(aiStatus?.lastTrainedAt)}</strong>
          </span>
          <span className="text-sm text-slate-500">
            SKU đã dự báo: <strong>{aiStatus?.totalForecasts ?? 0}</strong>
          </span>
        </div>
      </Card>
      <div className="flex gap-2">
        <Button type="primary" loading={loading} onClick={handleTrain}>Huấn luyện AI</Button>
        <Button loading={loading} onClick={handleRun}>Chạy dự báo</Button>
      </div>
      {results.length > 0 ? (
        <Card>
          <CardHeader title="Kết quả dự báo theo SKU" description={`${results.length} sản phẩm`} />
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
              { title: 'Sản phẩm', dataIndex: 'itemName' },
              { title: '7 ngày', dataIndex: 'pred7d' },
              { title: '14 ngày', dataIndex: 'pred14d' },
              { title: '30 ngày', dataIndex: 'pred30d' },
              {
                title: 'Khoảng tin cậy (30d)',
                render: (_, r) =>
                  r.confidenceLow != null
                    ? `${Number(r.confidenceLow).toFixed(0)} – ${Number(r.confidenceHigh ?? 0).toFixed(0)}`
                    : '—',
              },
              { title: 'Model', dataIndex: 'modelType', render: (v) => modelLabel(String(v)) },
            ]}
          />
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Chưa có kết quả dự báo"
          description="Nhấn Huấn luyện AI để train model và chạy dự báo tự động."
        />
      )}
      <Card>
        <CardHeader
          title="Chuỗi dự báo 30 ngày (daily series)"
          description={selectedItemId ? `SKU #${selectedItemId}` : 'Chạy dự báo và chọn một dòng trong bảng'}
        />
        <div className="h-[320px] px-3 pb-5">
          {dailyChart.length === 0 ? (
            <div className="h-full grid place-items-center text-muted text-sm">Chưa có dữ liệu daily series</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Line type="monotone" dataKey="qty" name="SL dự báo" stroke="#006c49" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="hover:shadow-xl transition-all duration-300">
          <CardHeader title="Doanh thu & đơn hàng thực tế" description="Dữ liệu từ báo cáo bán hàng 30 ngày gần nhất." />
          <div className="h-[360px] px-3 pb-5">
            {revenueChart.length === 0 ? (
              <div className="h-full grid place-items-center text-muted text-sm">Chưa có dữ liệu doanh thu</div>
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
                  <Area dataKey="orders" name="Đơn hàng" stroke="#4648d4" strokeWidth={3} fill="url(#forecastOrders)" type="monotone" dot={false} activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive animationDuration={1050} />
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
          <h2 className="text-base font-bold text-ink">AI Đề xuất nhập thêm hàng</h2>
          <p className="text-xs text-slate-400">Được đề xuất tự động dựa theo tốc độ bán hàng và chu kỳ vận chuyển.</p>
        </div>
        {suggestions.length > 0 && (
          <Button type="primary" onClick={() => setPage('import-create')}>Lập phiếu tất cả</Button>
        )}
      </div>
      <div className="px-5 pb-5">
        {suggestions.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            message="Chưa có đề xuất nhập hàng"
            description={
              <span>
                Hãy chạy{' '}
                <Button type="link" size="small" className="p-0 h-auto" onClick={() => setPage('ai-forecast')}>
                  Huấn luyện AI
                </Button>{' '}
                trên trang Dự báo AI trước.
              </span>
            }
          />
        ) : (
          <Table
            dataSource={suggestions}
            columns={[
              { title: 'Tên hàng', dataIndex: 'name', render: (v) => <span className="font-bold text-ink">{v}</span> },
              { title: 'Tồn hiện tại', dataIndex: 'stock' },
              { title: 'Nhu cầu (14 ngày)', dataIndex: 'sold' },
              { title: 'Số lượng đề xuất', dataIndex: 'suggested' },
              { title: 'Nguồn', dataIndex: 'source', render: (v) => <Tag color={v === 'AI' ? 'green' : 'orange'}>{v}</Tag> },
              { title: 'Độ ưu tiên', render: (_, row) => <Tag color={row.stock === 0 ? 'red' : 'orange'}>{row.stock === 0 ? 'KHẨN CẤP' : 'CAO'}</Tag> },
              { title: 'Hành động', render: () => <Button size="small" type="primary" ghost onClick={() => setPage('import-create')}>Lập phiếu</Button> }
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
          status: 'Nguy cơ' as const,
          expiry: row.expiryDate ?? '—',
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
    return <Card className="p-8 text-center text-muted">Đang tải danh sách cận hạn...</Card>;
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500">
        Không có mặt hàng cận hạn sử dụng (API trả về 0). Vào <Button type="link" className="p-0 h-auto" onClick={() => setPage('promotions')}>Đề xuất KM (AI)</Button> để tạo KM thủ công.
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
              <StatusChip tone="warning">Cận hạn</StatusChip>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{item.name}</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              HSD: {item.expiry} · Tồn: {item.stock}. Dùng AI đề xuất KM để xả hàng.
            </p>
          </div>
          <Button className="w-full mt-3 font-semibold" type="primary" ghost onClick={() => setPage('promotions')}>
            Đề xuất KM (AI)
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
        if (lower.includes('nhập') || lower.includes('tồn')) {
          action = { label: 'Tạo phiếu nhập', page: 'import-create' };
        } else if (lower.includes('báo cáo') || lower.includes('doanh thu')) {
          action = { label: 'Xem báo cáo', page: 'reports' };
        }
        setChatHistory([...newHistory, { sender: 'ai' as const, text: aiText, action }]);
      })
      .catch(() => {
        setChatHistory([
          ...newHistory,
          {
            sender: 'ai' as const,
            text: 'Không kết nối được trợ lý AI. Vui lòng thử lại hoặc kiểm tra quyền ADMIN/MANAGER.',
          },
        ]);
      });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="min-h-[580px] flex flex-col justify-between">
        <CardHeader title="Trợ lý vận hành thông minh AI" description="Hỏi đáp thời gian thực về tồn kho, đề xuất nhập hàng và hiệu quả doanh thu." />
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
            placeholder="Ví dụ: 'Sản phẩm nào sắp hết hàng?'..."
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
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được báo cáo');
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
    { title: 'Kỳ báo cáo', dataIndex: 'period', width: 130, fixed: 'left' },
    { title: 'Tổng đơn', dataIndex: 'totalOrders', width: 100, sorter: (a, b) => a.totalOrders - b.totalOrders },
    { title: 'Đơn hủy', dataIndex: 'cancelledOrders', width: 100 },
    { title: 'Doanh thu', dataIndex: 'totalRevenue', width: 150, render: (v: number) => money(v), sorter: (a, b) => a.totalRevenue - b.totalRevenue },
    { title: 'Giá vốn', dataIndex: 'totalCost', width: 150, render: (v: number) => money(v) },
    { title: 'Lợi nhuận gộp', dataIndex: 'grossProfit', width: 150, render: (v: number) => <span className={v >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{money(v)}</span>, sorter: (a, b) => a.grossProfit - b.grossProfit },
    { title: 'SP bán ra', dataIndex: 'totalItemsSold', width: 110 },
    { title: 'Top sản phẩm', dataIndex: 'topProducts', width: 220, render: (tops: SalesReportDto['topProducts']) => tops?.length ? tops.slice(0, 3).map((t) => t.itemName).join(', ') : '—' },
  ];

  const purchaseColumns: ColumnsType<PurchaseReportDto> = [
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', width: 200, fixed: 'left' },
    { title: 'Số đơn nhập', dataIndex: 'totalOrders', width: 120, sorter: (a, b) => a.totalOrders - b.totalOrders },
    { title: 'Tổng giá trị', dataIndex: 'totalAmount', width: 160, render: (v: number) => money(v), sorter: (a, b) => a.totalAmount - b.totalAmount },
    { title: 'Loại SP nhập', dataIndex: 'totalItemTypes', width: 120 },
    { title: 'Tổng SL nhập', dataIndex: 'totalQuantity', width: 130, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
  ];

  const inventoryColumns: ColumnsType<InventoryReportDto> = [
    { title: 'Mã SP', dataIndex: 'itemCode', width: 120, fixed: 'left' },
    { title: 'Tên sản phẩm', dataIndex: 'itemName', width: 200 },
    { title: 'Danh mục', dataIndex: 'categoryName', width: 140 },
    { title: 'Tồn hiện tại', dataIndex: 'currentStock', width: 120, render: (v: number) => Math.round(v).toLocaleString('vi-VN'), sorter: (a, b) => a.currentStock - b.currentStock },
    { title: 'Đã nhập', dataIndex: 'totalPurchased', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'Đã bán', dataIndex: 'totalSold', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'Đã hủy', dataIndex: 'totalScrapped', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'Hao hụt', dataIndex: 'shrinkage', width: 110, render: (v: number) => <span className={v > 0 ? 'text-red-600 font-semibold' : ''}>{Math.round(v).toLocaleString('vi-VN')}</span> },
    { title: 'Quay vòng', dataIndex: 'turnoverRate', width: 110, render: (v: number) => v?.toFixed(2) ?? '—', sorter: (a, b) => a.turnoverRate - b.turnoverRate },
    { title: 'Hạn gần nhất', dataIndex: 'nearestExpiryDate', width: 130, render: (v: string) => v ?? '—' },
    { title: 'Còn (ngày)', dataIndex: 'daysUntilExpiry', width: 110, render: (v: number | undefined) => v != null ? <Tag color={v <= 7 ? 'red' : v <= 30 ? 'orange' : 'green'}>{v} ngày</Tag> : '—', sorter: (a, b) => (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999) },
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
                label="Từ ngày"
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
              <span className="text-slate-400">—</span>
              <MuiDatePicker
                label="Đến ngày"
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
                { value: 'day', label: 'Theo ngày' },
                { value: 'month', label: 'Theo tháng' },
                { value: 'year', label: 'Theo năm' },
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
                { value: 'day', label: 'Theo ngày' },
                { value: 'month', label: 'Theo tháng' },
                { value: 'year', label: 'Theo năm' },
              ]}
            />
          )}
          <Button type="primary" onClick={loadReport} loading={loading}>
            Tải báo cáo
          </Button>
        </div>
      </Card>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'sales',
            label: 'Báo cáo bán hàng',
            children: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Doanh thu" value={money(salesTotals.totalRevenue)} color="text-emerald-600" />
                  <StatCard label="Tổng đơn hàng" value={salesTotals.totalOrders.toLocaleString('vi-VN')} />
                  <StatCard label="Lợi nhuận gộp" value={money(salesTotals.grossProfit)} color={salesTotals.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                  <StatCard label="SP bán ra" value={salesTotals.totalItemsSold.toLocaleString('vi-VN')} />
                </div>
                <Card>
                  <CardHeader title="Chi tiết báo cáo bán hàng" description={`${salesData.length} kỳ báo cáo`} />
                  <div className="px-4 pb-4">
                    <Table loading={loading} dataSource={salesData.map((r, i) => ({ ...r, key: i }))} columns={salesColumns} pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} size="small" />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'purchase',
            label: 'Báo cáo nhập hàng',
            children: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Tổng chi nhập" value={money(purchaseTotals.totalAmount)} color="text-blue-600" />
                  <StatCard label="Số đơn nhập" value={purchaseTotals.totalOrders.toLocaleString('vi-VN')} />
                  <StatCard label="Tổng SL nhập" value={Math.round(purchaseTotals.totalQuantity).toLocaleString('vi-VN')} />
                  <StatCard label="Nhà cung cấp" value={purchaseTotals.supplierCount} />
                </div>
                <Card>
                  <CardHeader title="Chi tiết nhập hàng theo NCC" description={`${purchaseData.length} nhà cung cấp`} />
                  <div className="px-4 pb-4">
                    <Table loading={loading} dataSource={purchaseData.map((r) => ({ ...r, key: r.supplierId }))} columns={purchaseColumns} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} size="small" />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'inventory',
            label: 'Báo cáo tồn kho',
            children: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Tổng tồn kho" value={Math.round(inventoryTotals.totalStock).toLocaleString('vi-VN')} />
                  <StatCard label="Tổng hao hụt" value={Math.round(inventoryTotals.totalShrinkage).toLocaleString('vi-VN')} color={inventoryTotals.totalShrinkage > 0 ? 'text-red-600' : 'text-slate-800'} />
                  <StatCard label="Cận hạn (≤30 ngày)" value={inventoryTotals.nearExpiry} color={inventoryTotals.nearExpiry > 0 ? 'text-amber-600' : 'text-slate-800'} />
                  <StatCard label="Quay vòng TB" value={inventoryTotals.avgTurnover.toFixed(2)} />
                </div>
                <Card>
                  <CardHeader title="Chi tiết tồn kho" description={`${inventoryData.length} sản phẩm`} />
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
  required: 'Vui lòng nhập ${label}',
  types: {
    email: '${label} không đúng định dạng',
  },
  string: {
    min: '${label} phải có ít nhất ${min} ký tự',
    max: '${label} không được vượt quá ${max} ký tự',
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
      .catch((e) => antdMessage.error(e instanceof Error ? e.message : 'Không tải được danh sách người dùng'))
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
        antdMessage.success('Cập nhật người dùng thành công');
      } else {
        await createUser({
          username: values.username.trim(),
          password: values.password,
          email: values.email.trim(),
          fullName: values.fullName?.trim() || undefined,
          role: values.role,
        });
        antdMessage.success('Tạo người dùng thành công');
      }
      setModalOpen(false);
      loadUsers();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Thao tác thất bại');
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
        return 'QUẢN LÝ';
      case 'ROLE_STAFF':
        return 'THU NGÂN';
      case 'ROLE_WAREHOUSE':
        return 'KHO';
      case 'ROLE_ANALYST':
        return 'PHÂN TÍCH';
    }
  };
  const columns: ColumnsType<UserDto> = [
    { title: 'Tên đăng nhập', dataIndex: 'username' },
    { title: 'Họ tên', dataIndex: 'fullName' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Vai trò', dataIndex: 'role', render: roleText },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    {
      title: 'Thao tác',
      render: (_, user) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEdit(user)}>Sửa</Button>
          <Button
            size="small"
            danger
            disabled={user.status === 'LOCKED' || user.status === 'INACTIVE'}
            onClick={() => {
              Modal.confirm({
                title: 'Khóa tài khoản?',
                content: `Bạn muốn khóa ${user.username}?`,
                onOk: async () => {
                  try {
                    await lockUser(user.id);
                    antdMessage.success('Khóa tài khoản thành công');
                    loadUsers();
                  } catch (e) {
                  antdMessage.error(e instanceof Error ? e.message : 'Không thể khóa tài khoản');
                  }
                },
              });
            }}
          >
            Khóa
          </Button>
          <Button
            size="small"
            disabled={user.status !== 'LOCKED'}
            onClick={() => {
              Modal.confirm({
                title: 'Mở khóa tài khoản?',
                content: `Bạn muốn mở khóa ${user.username}?`,
                onOk: async () => {
                  await unlockUser(user.id);
                  antdMessage.success('Mở khóa tài khoản thành công');
                  loadUsers();
                },
          });
    }}
>
  Mở khóa
</Button>
          <Button
            size="small"
            danger
            disabled={user.status !== 'LOCKED'}
            onClick={() => {
              Modal.confirm({
                title: 'Xóa mềm tài khoản?',
                content: 'Backend yêu cầu tài khoản phải LOCKED trước khi chuyển sang INACTIVE.',
                onOk: async () => {
                  await softDeleteUser(user.id);
                  antdMessage.success('Xóa mềm thành công');
                  loadUsers();
                },
              });
            }}
          >
            Xóa mềm
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Người dùng hệ thống"
        description="Admin tạo tài khoản, cập nhật vai trò, khóa và xóa mềm nhân sự."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tạo mới</Button>}
      />

      <div className="px-5 pb-5">
        <Table rowKey="id" loading={loading} dataSource={users} columns={columns} />
      </div>

      <Modal
        title={editingUser ? 'Sửa thông tin' : 'Thêm người dùng mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingUser ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        forceRender
      >
        <Form form={form} layout="vertical" validateMessages={userFormValidateMessages}>
          {!editingUser && (
            <>
              <Form.Item name="username" label="Tên đăng nhập" messageVariables={{ label: 'tên đăng nhập' }} rules={[{ required: true }, { min: 4 }, { max: 50 }, { pattern: /^[a-zA-Z0-9_.]+$/, message: 'Tên đăng nhập chỉ được chứa chữ, số và gạch dưới hoặc dấu chấm' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Mật khẩu" messageVariables={{ label: 'mật khẩu' }} rules={[{ required: true }, { min: 6 }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item name="fullName" label="Họ tên" messageVariables={{ label: 'họ tên' }} rules={[{ max: 100 }]}>
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
              label="Vai trò"
              messageVariables={{ label: 'vai trò' }}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'ROLE_ADMIN' satisfies Role, label: 'Admin' },
                  { value: 'ROLE_MANAGER' satisfies Role, label: 'Quản lý' },
                  { value: 'ROLE_STAFF' satisfies Role, label: 'Thu ngân' },
                  { value: 'ROLE_WAREHOUSE' satisfies Role, label: 'Kho' },
                  { value: 'ROLE_ANALYST' satisfies Role, label: 'Phân tích' },
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
      antdMessage.success('Đã lưu cấu hình');
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted">Đang tải cấu hình...</Card>;
  }

  if (settings.length === 0) {
    return (
      <Card className="p-8 text-center text-muted">
        Chưa có cấu hình trong hệ thống. Thêm bản ghi vào bảng settings (Flyway V3).
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
            <Form.Item label="Giá trị" name="value" initialValue={setting.value}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">Lưu</Button>
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
      antdMessage.warning('Không có mã đơn để in');
      return;
    }
    try {
      const data = await fetchOrderPrint(invoice.orderId);
      const lines = data.items.map((it) =>
        `<tr><td>${it.itemName}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${money(it.unitPrice)}</td><td style="text-align:right">${money(it.lineTotal)}</td></tr>`
      ).join('');
      const html = `<html><head><title>${data.orderCode}</title></head><body style="font-family:monospace;padding:16px">
        <h2>SMARTMART AI</h2><p>Mã HĐ: ${data.orderCode}</p><p>KH: ${data.customerName}</p><p>NV: ${data.staffName}</p>
        <table width="100%" border="1" cellpadding="4"><tr><th>SP</th><th>SL</th><th>ĐG</th><th>TT</th></tr>${lines}</table>
        <p><strong>Tổng: ${money(data.totalAmount)}</strong></p></body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'In hóa đơn thất bại');
    }
  };

  const handleCancel = async () => {
    if (!invoice?.orderId) return;
    try {
      await cancelOrder(invoice.orderId);
      antdMessage.success('Đã hủy hóa đơn');
      onCancelled?.();
      onClose();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Hủy thất bại');
    }
  };
  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (invoice) animateDrawer(bodyRef.current, true);
  }, [invoice]);
  return (
    <Drawer open={Boolean(invoice)} onClose={onClose} title="Chi tiết hóa đơn bán hàng" width={450}>
      {invoice ? (
        <div ref={bodyRef} className="space-y-5">
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-4">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <strong className="text-slate-800 text-lg">{invoice.key}</strong>
              <StatusChip tone={invoice.status.includes('toán') ? 'success' : 'warning'}>{invoice.status}</StatusChip>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600">
              <span>Khách hàng:</span><span className="font-bold text-slate-800 text-right">{invoice.customer}</span>
              <span>Thời gian mua:</span><span className="text-slate-800 text-right">{invoice.time} - Hôm nay</span>
              <span>Thu ngân:</span><span className="text-slate-800 text-right">{invoice.cashier}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Chi tiết sản phẩm</h4>
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
              <span>Tạm tính</span>
              <span>{money(invoice.subtotal || invoice.amount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Giảm giá KM</span>
                <span>-{money(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Thuế VAT (8%)</span>
              <span>{money(invoice.vat || 0)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-800 border-t border-slate-200 pt-2 mt-2">
              <span>Tổng số tiền:</span>
              <span className="text-primary text-lg">{money(invoice.amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button icon={<Printer size={16} />} onClick={handlePrint}>In hóa đơn</Button>
            {canCancel && invoice.rawStatus === 'COMPLETED' && (
              <Button danger onClick={handleCancel}>Hủy hóa đơn</Button>
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
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được nhật ký hệ thống');
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
      title: 'Thời gian',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString('vi-VN'),
    },
    {
    title: 'Hành động',
    dataIndex: 'action',
    render: (value: string) => (
      <Tag color="blue">{formatAuditAction(value)}</Tag>
  ),
    },
    {
      title: 'Phân hệ',
      dataIndex: 'entityType',
      render: (value?: string | null) => formatAuditModule(value),
    },
    {
      title: 'Người thao tác',
      dataIndex: 'username',
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Chi tiết',
      dataIndex: 'detail',
      render: (value?: string) => value || '-',
    },
    {
      title: 'Thay đổi',
      render: (_, row) => (
      <div className="space-y-3 text-xs">
        <AuditDataBlock title="Trước" value={row.beforeData} />
      <AuditDataBlock title="Sau" value={row.afterData} />
    </div>
  ),
},
  ];

  
  const auditModuleOptions = [
  { value: 'AUTH', label: 'Đăng nhập và bảo mật' },
  { value: 'USER', label: 'Quản lý người dùng' },
  { value: 'ORDER', label: 'Bán hàng và hóa đơn' },
  { value: 'ITEM', label: 'Sản phẩm' },
  { value: 'PURCHASE_ORDER', label: 'Nhập hàng' },
  { value: 'SCRAP_ORDER', label: 'Hủy hàng' },
  { value: 'INVENTORY', label: 'Tồn kho' },
  { value: 'AI', label: 'AI và dự báo' },
  { value: 'SYSTEM', label: 'Hệ thống' },
];

  function AuditDataBlock({ title, value }: { title: string; value?: string | null }) {
  const items = parseAuditData(value);

  if (!items.length) {
    return (
      <div>
        <div className="mb-1 font-semibold text-slate-500">{title}</div>
        <span className="text-slate-400">Không có dữ liệu</span>
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
    username: 'Tên đăng nhập',
    email: 'Email',
    fullName: 'Họ tên',
    role: 'Vai trò',
    status: 'Trạng thái',
  };

  return labels[key] ?? key;
}

function formatAuditValue(value: string) {
  if (!value) return '-';

  const roleLabels: Record<string, string> = {
    ROLE_ADMIN: 'Admin',
    ROLE_MANAGER: 'Quản lý',
    ROLE_STAFF: 'Thu ngân',
    ROLE_WAREHOUSE: 'Kho',
    ROLE_ANALYST: 'Phân tích',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    LOCKED: 'Đã khóa',
    INACTIVE: 'Không hoạt động',
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
        <h2 className="text-lg font-bold text-ink">Nhật ký hệ thống</h2>
        <p className="text-sm text-slate-500">
          Theo dõi các thao tác quan trọng như đăng nhập, tạo người dùng, cập nhật trạng thái và thay đổi dữ liệu.
        </p>
      </div>

      <div className="grid gap-3 border-b border-line p-5 md:grid-cols-3">
  <Select
    allowClear
    showSearch
    placeholder="Phân hệ"
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
  placeholder="Hành động"
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
    placeholder="Người thao tác"
    value={username}
    onChange={(e) => {
      setUsername(e.target.value || undefined);
      setPage(0);
    }}
  />

</div>

      <div className="flex justify-end gap-2 px-5 py-3">
        <Button onClick={resetFilters}>Xóa lọc</Button>
        <Button type="primary" onClick={loadLogs}>Tải lại</Button>
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
    AUTH: 'Đăng nhập và bảo mật',
    USER: 'Quản lý người dùng',
    ORDER: 'Bán hàng và hóa đơn',
    ITEM: 'Sản phẩm',
    PURCHASE_ORDER: 'Nhập hàng',
    SCRAP_ORDER: 'Hủy hàng',
    INVENTORY: 'Tồn kho',
    AI: 'AI và dự báo',
    SYSTEM: 'Hệ thống',
  };

  return entityType ? labels[entityType] ?? entityType : '-';
}

function formatAuditAction(action?: string | null) {
  if (!action) return '-';

  const labels: Record<string, string> = {
    AUTH_LOGIN: 'Đăng nhập',
    AUTH_LOGOUT: 'Đăng xuất',

    USER_CREATE: 'Tạo người dùng',
    USER_UPDATE: 'Cập nhật người dùng',
    USER_LOCKED: 'Khóa tài khoản',
    USER_UNLOCKED: 'Mở khóa tài khoản',
    USER_SOFT_DELETE: 'Ngừng hoạt động tài khoản',

    ORDER_CREATE: 'Tạo hóa đơn',
    ORDER_CANCEL: 'Hủy hóa đơn',

    ITEM_CREATE: 'Tạo sản phẩm',
    ITEM_UPDATE: 'Cập nhật sản phẩm',
    ITEM_DELETE: 'Ngừng kinh doanh sản phẩm',

    PURCHASE_CREATE: 'Tạo phiếu nhập',
    PURCHASE_RECEIVE: 'Nhận hàng',
    PURCHASE_CANCEL: 'Hủy phiếu nhập',

    SCRAP_CREATE: 'Tạo phiếu hủy hàng',
    SCRAP_COMPLETE: 'Hoàn tất hủy hàng',

    AI_FORECAST_RUN: 'Chạy dự báo AI',
    AI_FORECAST_TRAIN: 'Huấn luyện mô hình AI',
  };

  return labels[action] ?? action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default App;
