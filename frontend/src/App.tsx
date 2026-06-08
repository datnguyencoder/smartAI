import {
  Avatar,
  Badge,
  Button,
  ConfigProvider,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Select,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  message as antdMessage,
} from 'antd';
import * as React from 'react';
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
  Warehouse,
  Printer,
  Trash2,
  Send,
  UserCheck,
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
} from 'recharts';
import { Card, CardHeader, StatusChip, UiButton } from './components/ui';
import { LoginScreen } from './components/LoginScreen';
import { ProductDrawer } from './components/ProductDrawer';
import { ProductsTable } from './components/products/ProductsTable';
import { ProductThumbnail } from './components/ProductThumbnail';
import { CreateProductModal } from './components/CreateProductModal';
import ImportCreatePage from './pages/ImportCreatePage';
import ImportSlipsPage from './pages/ImportSlipsPage';
import { cn } from './lib/utils';
import { itemToProduct, formatMoney, statusTone, type Product } from './lib/itemMapper';
import type { PageKey } from './types/pages';
import {
  aiChat,
  createOrder,
  fetchDashboardSummary,
  fetchInventory,
  fetchInventoryAlerts,
  fetchNearExpiry,
  fetchUsers,
  fetchItemByBarcode,
  createPurchaseOrder,
  fetchCategories,
  fetchDashboardRevenue,
  fetchForecastResults,
  fetchItems,
  fetchLocations,
  fetchOrders,
  fetchReorderRecommendations,
  fetchSuppliers,
  fetchUoms,
  updateItem,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  fetchPurchaseOrdersPaged,
  runForecast,
  trainForecast,
} from './services/wmsApi';
import type { CategoryDto, DashboardSummaryDto, InventoryAlertDto, LocationDto, SupplierDto, UomDto, UserDto } from './types/api';
import { useAuth } from './contexts/AuthContext';
import { pageFromPath, pathFromPage } from './lib/pageRoutes';
import {
  allowedPages,
  canAccessPage,
  canQuickCreate,
  defaultPageForRole,
  roleLabel,
} from './lib/permissions';

type NavItem = { key: PageKey; label: string; icon: typeof LayoutDashboard };

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { key: 'products', label: 'Sản phẩm', icon: Package },
  { key: 'categories', label: 'Danh mục', icon: Tags },
  { key: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
  { key: 'pos', label: 'Bán hàng tại quầy', icon: ShoppingCart },
  { key: 'invoices', label: 'Hóa đơn bán hàng', icon: ReceiptText },
  { key: 'import-create', label: 'Tạo phiếu nhập', icon: FileInput },
  { key: 'import-slips', label: 'Phiếu nhập hàng', icon: ClipboardCheck },
  { key: 'inventory', label: 'Tồn kho', icon: Warehouse },
  { key: 'inventory-alerts', label: 'Cảnh báo tồn kho', icon: AlertTriangle },
  { key: 'ai-forecast', label: 'Dự báo AI', icon: BrainCircuit },
  { key: 'purchase-suggestions', label: 'Gợi ý nhập hàng', icon: Bot },
  { key: 'expiry-risk', label: 'Rủi ro hết hạn', icon: CalendarClock },
  { key: 'promotions', label: 'Đề xuất khuyến mãi', icon: WandSparkles },
  { key: 'ai-assistant', label: 'Trợ lý AI', icon: Sparkles },
  { key: 'reports', label: 'Báo cáo hệ thống', icon: BarChart3 },
  { key: 'users', label: 'Người dùng', icon: UsersRound },
  { key: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
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
    customer: o.customerName,
    amount: Number(o.totalAmount),
    cashier: 'Hệ thống',
    status: o.status === 'CANCELLED' ? 'Đã hủy' : 'Đã thanh toán',
    time: new Date(o.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    subtotal: Number(o.totalAmount) / 1.08,
    discount: 0,
    vat: Number(o.totalAmount) * 0.08 / 1.08,
    items: (o.items ?? []).map((i) => ({ name: i.itemName, qty: Number(i.quantity), price: Number(i.unitPrice) })),
  }));
}

function App() {
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
  const [categories, setCategories] = React.useState<CategoryDto[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierDto[]>([]);
  const [locations, setLocations] = React.useState<LocationDto[]>([]);
  const [uoms, setUoms] = React.useState<UomDto[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [activePromotions, setActivePromotions] = React.useState<Record<string, number>>({});
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

  const handleLogout = React.useCallback(async () => {
    await authLogout();
    setPosCart([]);
    setPage('dashboard');
    antdMessage.success('Đã đăng xuất');
  }, [authLogout, setPage]);

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
    setCatalogLoading(true);
    try {
      const [items, orders, cats, sups, locs, uomList] = await Promise.all([
        fetchItems().catch(() => []),
        (authUser && canAccessPage(authUser.role, 'invoices')) ? fetchOrders().catch(() => []) : Promise.resolve([]),
        fetchCategories().catch(() => []),
        fetchSuppliers().catch(() => []),
        fetchLocations().catch(() => []),
        fetchUoms().catch(() => []),
      ]);
      setProductsList((Array.isArray(items) ? items : []).map(itemToProduct));
      setInvoicesList(ordersToInvoices(Array.isArray(orders) ? orders : []));
      setCategories(Array.isArray(cats) ? cats : []);
      setSuppliers(Array.isArray(sups) ? sups : []);
      setLocations(Array.isArray(locs) ? locs : []);
      setUoms(Array.isArray(uomList) ? uomList : []);
      console.log('Catalog loaded TEXT:', JSON.stringify({ items, orders, cats, sups, locs, uomList }).substring(0, 500));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được dữ liệu API');
    } finally {
      setCatalogLoading(false);
    }
  }, [authUser]);

  React.useEffect(() => {
    if (authUser && localStorage.getItem('smartmart_token')) {
      reloadCatalog();
    }
  }, [authUser, reloadCatalog]);

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
      <div className="min-h-screen bg-[#f8fafc] text-ink">
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
            setModalOpen={setModalOpen}
            openMobileNav={() => setMobileNavOpen(true)}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
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
              activePromotions={activePromotions}
              setActivePromotions={setActivePromotions}
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
        <InvoiceDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
        <CreateProductModal
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          page={page}
          categories={categories}
          uoms={uoms}
          onCreated={reloadCatalog}
        />
      </div>
    </ConfigProvider>
  );
}

const pageTitles: Record<PageKey, { title: string; description: string }> = {
  dashboard: { title: 'Bảng điều khiển', description: 'Tổng quan doanh thu, tồn kho, cảnh báo và dự báo AI.' },
  products: { title: 'Quản lý sản phẩm', description: 'Theo dõi SKU, giá bán, tồn kho và trạng thái kinh doanh.' },
  categories: { title: 'Quản lý danh mục', description: 'Tổ chức nhóm hàng, biên lợi nhuận và số lượng sản phẩm.' },
  suppliers: { title: 'Quản lý nhà cung cấp', description: 'Theo dõi đối tác, công nợ, lịch giao hàng và SLA.' },
  pos: { title: 'Bán hàng tại quầy POS', description: 'Quét sản phẩm, tạo giỏ hàng và thanh toán nhanh.' },
  invoices: { title: 'Hóa đơn bán hàng', description: 'Tra cứu hóa đơn, trạng thái thanh toán và giao dịch hoàn tiền.' },
  'import-create': { title: 'Tạo phiếu nhập hàng', description: 'Nhập hàng từ nhà cung cấp với kiểm tra tồn kho tức thời.' },
  'import-slips': { title: 'Phiếu nhập hàng', description: 'Quản lý phiếu nhập, trạng thái duyệt và lịch nhận hàng.' },
  inventory: { title: 'Quản lý tồn kho', description: 'Kiểm soát tồn theo kho, ngưỡng cảnh báo và vòng quay hàng.' },
  'inventory-alerts': { title: 'Cảnh báo tồn kho', description: 'Ưu tiên sản phẩm hết hàng, sắp hết và tồn bất thường.' },
  'ai-forecast': { title: 'Dự báo AI', description: 'Mô hình dự báo nhu cầu, doanh thu và rủi ro vận hành.' },
  'purchase-suggestions': { title: 'Gợi ý nhập hàng', description: 'Đề xuất số lượng nhập tối ưu dựa trên tốc độ bán.' },
  'expiry-risk': { title: 'Rủi ro hết hạn', description: 'Theo dõi lô hàng gần hết hạn và đề xuất xử lý.' },
  promotions: { title: 'Đề xuất khuyến mãi', description: 'Tạo chiến dịch giảm tồn và tối ưu doanh thu bằng AI.' },
  'ai-assistant': { title: 'Trợ lý AI', description: 'Hỏi đáp nghiệp vụ, phân tích bán hàng và tạo tác vụ nhanh.' },
  reports: { title: 'Báo cáo hệ thống', description: 'Báo cáo doanh thu, tồn kho, nhân sự và hiệu quả AI.' },
  users: { title: 'Quản lý người dùng', description: 'Phân quyền nhân viên, vai trò và nhật ký truy cập.' },
  settings: { title: 'Cài đặt hệ thống', description: 'Cấu hình cửa hàng, AI, cảnh báo và tích hợp.' },
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
  setModalOpen,
  openMobileNav,
  globalSearch,
  setGlobalSearch,
}: {
  title: string;
  description: string;
  authUser: UserDto;
  page: PageKey;
  setModalOpen: (open: boolean) => void;
  openMobileNav: () => void;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
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
          <Badge dot>
            <Button icon={<Bell size={16} />} />
          </Badge>
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
  activePromotions,
  setActivePromotions,
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
  activePromotions: Record<string, number>;
  setActivePromotions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
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
    return <Dashboard openProduct={openProduct} setPage={setPage} productsList={productsList} invoicesList={invoicesList} />;
  }
  if (page === 'pos') {
    return (
      <PosPage
        productsList={productsList}
        posCart={posCart}
        setPosCart={setPosCart}
        activePromotions={activePromotions}
        setPage={setPage}
        reloadCatalog={reloadCatalog}
        catalogLoading={catalogLoading}
        cartPanelRef={cartPanelRef}
      />
    );
  }
  if (page === 'products') {
    return <ProductsPage openProduct={openProduct} openModal={openModal} productsList={productsList} activePromotions={activePromotions} />;
  }
  if (page === 'categories') {
    return <CategoriesPage categories={categories} productsList={productsList} />;
  }
  if (page === 'suppliers') {
    return <SuppliersPage suppliers={suppliers} productsList={productsList} />;
  }
  if (page === 'invoices') {
    return <InvoicesPage invoicesList={invoicesList} setSelectedInvoice={setSelectedInvoice} />;
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
  if (page === 'ai-forecast') {
    return <AiForecastPage productsList={productsList} invoicesList={invoicesList} />;
  }
  if (page === 'purchase-suggestions') {
    return <PurchaseSuggestionsPage productsList={productsList} setPage={setPage} />;
  }
  if (page === 'expiry-risk') {
    return <ExpiryRiskPage productsList={productsList} setActivePromotions={setActivePromotions} setPage={setPage} />;
  }
  if (page === 'promotions') {
    return <PromotionsPage productsList={productsList} activePromotions={activePromotions} setActivePromotions={setActivePromotions} setPage={setPage} />;
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
  return <SettingsPage />;
}

function Dashboard({
  openProduct,
  setPage,
  productsList,
  invoicesList,
}: {
  openProduct: (product: Product) => void;
  setPage: (page: PageKey) => void;
  productsList: Product[];
  invoicesList: any[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button type="primary" icon={<ShoppingCart size={16} />} onClick={() => setPage('pos')}>
          Tạo hóa đơn POS
        </Button>
        <Button icon={<FileInput size={16} />} onClick={() => setPage('import-create')}>
          Tạo phiếu nhập hàng
        </Button>
        <Button className="ml-auto" type="primary" ghost icon={<Sparkles size={16} />} onClick={() => setPage('ai-forecast')}>
          Chạy dự báo AI
        </Button>
      </div>
      <KpiGrid productsList={productsList} invoicesList={invoicesList} useApiSummary />
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <RevenueCard invoicesList={invoicesList} />
        <AiSummary setPage={setPage} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <ProductsTable title="Sản phẩm bán chạy" rows={productsList.slice(0, 5)} openProduct={openProduct} />
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
  activePromotions,
}: {
  openProduct: (product: Product) => void;
  openModal: () => void;
  productsList: Product[];
  activePromotions: Record<string, number>;
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState('all');

  const filtered = productsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

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
        <Select
          className="w-48"
          value={selectedCat}
          onChange={setSelectedCat}
          options={[
            { value: 'all', label: 'Tất cả danh mục' },
            { value: 'Đồ uống', label: 'Đồ uống' },
            { value: 'Sữa & bơ', label: 'Sữa & bơ' },
            { value: 'Thực phẩm khô', label: 'Thực phẩm khô' },
            { value: 'Bánh kẹo', label: 'Bánh kẹo' },
            { value: 'Gia dụng', label: 'Gia dụng' },
          ]}
        />
        <Button className="ml-auto" type="primary" icon={<Plus size={16} />} onClick={openModal}>
          Thêm mới sản phẩm
        </Button>
      </Card>
      <ProductsTable title="Danh sách sản phẩm" rows={filtered} openProduct={openProduct} />
    </div>
  );
}

function CategoriesPage({ categories, productsList }: { categories: CategoryDto[]; productsList: Product[] }) {
  const rows =
    categories.length > 0
      ? categories
      : Array.from(new Set(productsList.map((p) => p.category))).map((name, i) => ({
          id: i,
          categoryName: name,
          active: true,
        }));
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Danh mục hàng hóa" />
        <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
          {rows.map((cat, idx) => {
            const count = productsList.filter((p) => p.category === cat.categoryName).length;
            return (
              <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-line bg-slate-50 p-4" key={cat.id}>
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
      <AiSummary setPage={() => {}} />
    </div>
  );
}

function SuppliersPage({ suppliers, productsList }: { suppliers: SupplierDto[]; productsList: Product[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Nhà cung cấp đối tác" />
        <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
          {suppliers.map((sup) => (
            <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-line bg-slate-50 p-4" key={sup.id}>
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
      <AiSummary setPage={() => {}} />
    </div>
  );
}

function PosPage({
  productsList,
  posCart,
  setPosCart,
  activePromotions,
  setPage,
  reloadCatalog,
  catalogLoading,
  cartPanelRef,
}: {
  productsList: Product[];
  posCart: Array<{ product: Product; quantity: number }>;
  setPosCart: React.Dispatch<React.SetStateAction<Array<{ product: Product; quantity: number }>>>;
  activePromotions: Record<string, number>;
  setPage: (page: PageKey) => void;
  reloadCatalog: () => Promise<void>;
  catalogLoading: boolean;
  cartPanelRef: React.RefObject<HTMLDivElement>;
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Tất cả');
  const [selectedCustomer, setSelectedCustomer] = React.useState('Khách lẻ');
  const [appliedPromo, setAppliedPromo] = React.useState<string>('Không có');
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [lastInvoice, setLastInvoice] = React.useState<any | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (receiptOpen) animateModalContent(receiptRef.current);
  }, [receiptOpen]);

  // Filter products based on search and category
  const filteredProducts = productsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Tất cả', ...Array.from(new Set(productsList.map(p => p.category)))];

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      antdMessage.error(`${product.name} đã hết hàng trong kho!`);
      return;
    }
    const existing = posCart.find(item => item.product.key === product.key);
    if (existing) {
      if (existing.quantity >= product.stock) {
        antdMessage.warning(`Chỉ còn ${product.stock} sản phẩm để bán!`);
        return;
      }
      setPosCart(posCart.map(item => item.product.key === product.key ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setPosCart([...posCart, { product, quantity: 1 }]);
    }
    animateCartBump(cartPanelRef.current);
  };

  const updateQuantity = (productKey: string, delta: number) => {
    const existing = posCart.find(item => item.product.key === productKey);
    if (!existing) return;
    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setPosCart(posCart.filter(item => item.product.key !== productKey));
    } else {
      const prod = productsList.find(p => p.key === productKey);
      if (prod && newQty > prod.stock) {
        antdMessage.warning(`Chỉ còn ${prod.stock} sản phẩm trong kho!`);
        return;
      }
      setPosCart(posCart.map(item => item.product.key === productKey ? { ...item, quantity: newQty } : item));
    }
  };

  // Price calculations with active AI promotions
  const getProductPrice = (product: Product) => {
    const discount = activePromotions[product.key] || 0;
    return product.price * (1 - discount / 100);
  };

  const subtotal = posCart.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0);
  
  let promoDiscount = 0;
  if (appliedPromo === 'AI_PROMO_10') promoDiscount = subtotal * 0.1;
  if (appliedPromo === 'AI_CLEARANCE_15') promoDiscount = subtotal * 0.15;
  
  const vat = (subtotal - promoDiscount) * 0.08;
  const total = subtotal - promoDiscount + vat;

  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  const handleCheckout = async () => {
    if (posCart.length === 0) {
      antdMessage.warning('Giỏ hàng trống! Hãy quét chọn sản phẩm.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const order = await createOrder({
        customerName: selectedCustomer,
        paymentMethod: 'CASH',
        items: posCart.map((item) => ({
          itemId: Number(item.product.key),
          quantity: item.quantity,
        })),
      });
      await reloadCatalog();
      const newInvoice = {
        key: order.orderCode,
        customer: order.customerName,
        amount: Math.round(Number(order.totalAmount)),
        cashier: 'Hệ thống',
        status: 'Đã thanh toán',
        time: new Date(order.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        items: posCart.map((item) => ({
          name: item.product.name,
          qty: item.quantity,
          price: getProductPrice(item.product),
        })),
        subtotal: Math.round(subtotal),
        discount: Math.round(promoDiscount),
        vat: Math.round(vat),
      };
      setLastInvoice(newInvoice);
      setReceiptOpen(true);
      setPosCart([]);
      antdMessage.success('Thanh toán đơn hàng thành công!');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Thanh toán thất bại');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_430px]">
      <Card>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-ink">Danh sách sản phẩm bán {catalogLoading ? '(đang tải…)' : ''}</h2>
            <p className="text-xs text-slate-400">Click chọn sản phẩm để thêm nhanh vào giỏ hàng POS.</p>
          </div>
          <div className="flex gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                type={selectedCategory === cat ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        <div className="px-5 pb-5 pt-4">
          <Input
            size="large"
            prefix={<Search size={18} />}
            placeholder="Tìm theo tên sản phẩm, SKU hoặc quét mã vạch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key !== 'Enter' || !searchQuery.trim()) return;
              e.preventDefault();
              const q = searchQuery.trim();
              const local = productsList.find(
                (p) => p.sku.toLowerCase() === q.toLowerCase() || p.key === q
              );
              if (local) {
                handleAddToCart(local);
                setSearchQuery('');
                return;
              }
              try {
                const item = await fetchItemByBarcode(q);
                handleAddToCart(itemToProduct(item));
                setSearchQuery('');
              } catch {
                antdMessage.warning(`Không tìm thấy sản phẩm với mã: ${q}`);
              }
            }}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredProducts.map((product) => {
              const discount = activePromotions[product.key] || 0;
              const originalPrice = product.price;
              const curPrice = getProductPrice(product);
              return (
                <button
                  className={cn(
                    'rounded-xl border border-line bg-white p-3 text-left transition hover:border-emerald hover:bg-emerald-50/50 flex flex-col h-[200px] relative overflow-hidden',
                    product.stock === 0 && 'opacity-60 cursor-not-allowed bg-slate-100/50'
                  )}
                  key={product.key}
                  onClick={() => handleAddToCart(product)}
                >
                  <div className="flex justify-center py-1">
                    <ProductThumbnail name={product.name} imageUrl={product.imageUrl} size={72} />
                  </div>
                  <div className="flex-1 flex flex-col justify-between mt-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-sm font-bold text-ink line-clamp-2 leading-snug">{product.name}</strong>
                        {discount > 0 && <Tag color="volcano" className="mr-0 font-bold shrink-0">-{discount}%</Tag>}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 font-medium">{product.sku} · Tồn {product.stock}</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-extrabold text-primary text-base">{money(curPrice)}</span>
                      {discount > 0 && <span className="text-xs text-slate-400 line-through">{money(originalPrice)}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
      
      <div ref={cartPanelRef}>
      <Card className="flex flex-col h-fit">
        <CardHeader title="Giỏ hàng hiện tại" action={<Tag color="green" className="font-bold">{posCart.length} dòng hàng</Tag>} />
        <div className="space-y-3 px-5 pb-2 flex-1 max-h-[380px] overflow-y-auto scrollbar-thin">
          {posCart.map((item) => {
            const discPrice = getProductPrice(item.product);
            return (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 hover:border-slate-200 transition" key={item.product.key}>
                <ProductThumbnail name={item.product.name} imageUrl={item.product.imageUrl} size={36} className="mr-2 shrink-0" />
                <div className="min-w-0 flex-1 pr-3">
                  <strong className="text-sm font-semibold text-ink line-clamp-1">{item.product.name}</strong>
                  <p className="text-xs text-slate-400 mt-0.5">{money(discPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="small" shape="circle" onClick={() => updateQuantity(item.product.key, -1)}>-</Button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <Button size="small" shape="circle" onClick={() => updateQuantity(item.product.key, 1)}>+</Button>
                </div>
                <span className="font-bold text-slate-700 ml-4 min-w-[70px] text-right">{money(discPrice * item.quantity)}</span>
              </div>
            );
          })}
          {posCart.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300">
              <ShoppingCart size={40} className="mb-2" />
              <span className="text-sm">Chưa có sản phẩm nào trong giỏ hàng POS</span>
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 rounded-b-2xl">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Khách hàng</label>
              <Select
                className="w-full"
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                options={[
                  { value: 'Khách lẻ', label: 'Khách lẻ' },
                  { value: 'Trần Thị Lan', label: 'Trần Thị Lan' },
                  { value: 'Phạm Quang Huy', label: 'Phạm Quang Huy' },
                  { value: 'Nguyễn Văn An', label: 'Nguyễn Văn An' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Khuyến mãi AI</label>
              <Select
                className="w-full"
                value={appliedPromo}
                onChange={setAppliedPromo}
                options={[
                  { value: 'Không có', label: 'Không áp dụng' },
                  { value: 'AI_PROMO_10', label: 'AI Giảm 10%' },
                  { value: 'AI_CLEARANCE_15', label: 'AI Cận hạn -15%' },
                ]}
              />
            </div>
          </div>
          
          <div className="space-y-1.5 text-sm border-t border-dashed border-slate-200 pt-3">
            <div className="flex justify-between text-slate-500">
              <span>Tạm tính</span>
              <span>{money(subtotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Khấu trừ giảm giá</span>
                <span>-{money(promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Thuế VAT (8%)</span>
              <span>{money(vat)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-ink border-t border-slate-200/80 pt-2 mt-2">
              <span>Tổng cộng thanh toán</span>
              <span className="text-primary">{money(total)}</span>
            </div>
          </div>
          
          <UiButton className="w-full h-11" variant="primary" onClick={handleCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? 'Đang xử lý…' : 'Xác nhận thanh toán'}
          </UiButton>
        </div>
      </Card>
      </div>
      
      <Modal
        open={receiptOpen}
        onCancel={() => setReceiptOpen(false)}
        footer={[
          <Button key="close" onClick={() => setReceiptOpen(false)}>Đóng</Button>,
          <Button key="print" type="primary" icon={<Printer size={16} />} onClick={() => antdMessage.info('Đang in hóa đơn hóa đơn ảo...')}>
            In hóa đơn
          </Button>
        ]}
        width={400}
        title="Hóa đơn thanh toán (POS)"
      >
        {lastInvoice && (
          <div ref={receiptRef} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 font-mono text-xs">
            <div className="text-center border-b border-dashed border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">SMARTMART AI</h3>
              <p className="text-slate-400 mt-1">Siêu Thị Mini Vận Hành Thông Minh</p>
              <p className="text-slate-400 mt-0.5">ĐT: 1900.2882</p>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between"><span>Số HĐ:</span><span className="font-bold">{lastInvoice.key}</span></div>
              <div className="flex justify-between"><span>Thời gian:</span><span>{lastInvoice.time} - Hôm nay</span></div>
              <div className="flex justify-between"><span>Thu ngân:</span><span>{lastInvoice.cashier}</span></div>
              <div className="flex justify-between"><span>Khách hàng:</span><span>{lastInvoice.customer}</span></div>
            </div>
            
            <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2">
              {lastInvoice.items.map((it: any) => (
                <div className="flex justify-between text-slate-700" key={it.name}>
                  <div className="pr-3 truncate w-[180px]">{it.name}</div>
                  <div>{it.qty} x {money(it.price)}</div>
                  <div className="font-semibold">{money(it.qty * it.price)}</div>
                </div>
              ))}
            </div>
            
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500"><span>Tạm tính:</span><span>{money(lastInvoice.subtotal)}</span></div>
              {lastInvoice.discount > 0 && <div className="flex justify-between text-red-600"><span>Giảm giá AI:</span><span>-{money(lastInvoice.discount)}</span></div>}
              <div className="flex justify-between text-slate-500"><span>Thuế VAT:</span><span>{money(lastInvoice.vat)}</span></div>
              <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-dashed border-slate-200 pt-2">
                <span>TỔNG THANH TOÁN:</span>
                <span className="text-primary text-base font-extrabold">{money(lastInvoice.amount)}</span>
              </div>
            </div>
            
            <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-3">
              <p>Cảm ơn Quý khách và hẹn gặp lại!</p>
              <p className="mt-1">Hóa đơn phát hành tự động bởi SmartMart AI</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InvoicesPage({ invoicesList, setSelectedInvoice }: { invoicesList: any[]; setSelectedInvoice: (invoice: any) => void }) {
  const columns = [
    { title: 'Mã hóa đơn', dataIndex: 'key', render: (v: string, row: any) => <button className="font-bold text-primary hover:text-emerald" onClick={() => setSelectedInvoice(row)}>{v}</button> },
    { title: 'Khách hàng', dataIndex: 'customer' },
    { title: 'Thu ngân', dataIndex: 'cashier' },
    { title: 'Tổng thanh toán', dataIndex: 'amount', render: (v: number) => money(v) },
    { title: 'Thời gian', dataIndex: 'time' },
    { title: 'Trạng thái', dataIndex: 'status', render: (v: string) => <StatusChip tone={v.includes('toán') ? 'success' : 'warning'}>{v}</StatusChip> },
    { title: 'Hành động', render: (_: any, row: any) => <Button size="small" onClick={() => setSelectedInvoice(row)}>Chi tiết</Button> }
  ];
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Danh sách hóa đơn" />
      <Table columns={columns} dataSource={invoicesList} pagination={{ pageSize: 8 }} rowKey="key" />
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
            key: String(row.itemId),
            sku: row.itemCode,
            name: row.itemName,
            category: row.locationName,
            price: 0,
            cost: 0,
            stock,
            sold: 0,
            supplier: '-',
            status: stock === 0 ? 'Hết hàng' : stock <= 40 ? 'Sắp hết' : 'Còn hàng',
            expiry: row.expiryDate ?? 'Không áp dụng',
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

function AiForecastPage({ productsList, invoicesList }: { productsList: Product[]; invoicesList: any[] }) {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<Record<string, unknown>[]>([]);

  const handleTrain = async () => {
    setLoading(true);
    try {
      await trainForecast();
      antdMessage.success('Huấn luyện mô hình thành công');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Huấn luyện thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      await runForecast();
      const r = await fetchForecastResults();
      setResults(r);
      antdMessage.success('Dự báo hoàn tất');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Dự báo thất bại — kiểm tra ai-service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="primary" loading={loading} onClick={handleTrain}>Huấn luyện AI</Button>
        <Button loading={loading} onClick={handleRun}>Chạy dự báo</Button>
      </div>
      {results.length > 0 && (
        <Card>
          <CardHeader title="Kết quả dự báo theo SKU" description={`${results.length} sản phẩm`} />
          <Table
            size="small"
            pagination={false}
            dataSource={results.map((r, i) => ({ ...r, key: i }))}
            columns={[
              { title: 'Sản phẩm', dataIndex: 'itemName' },
              { title: '7 ngày', dataIndex: 'pred7d' },
              { title: '14 ngày', dataIndex: 'pred14d' },
              { title: '30 ngày', dataIndex: 'pred30d' },
            ]}
          />
        </Card>
      )}
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <Card className="hover:shadow-xl transition-all duration-300">
        <CardHeader title="Dự báo doanh thu & đơn hàng từ AI" description="Mô hình ML (FastAPI) — train/run qua backend." />
        <div className="h-[360px] px-3 pb-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 14, right: 18, bottom: 6, left: 0 }}>
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
              <Area dataKey="revenue" name="Doanh thu dự báo" stroke="#10b981" strokeWidth={3} fill="url(#forecastRevenue)" type="monotone" dot={false} activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive animationDuration={900} />
              <Area dataKey="orders" name="Đơn hàng dự báo" stroke="#4648d4" strokeWidth={3} fill="url(#forecastOrders)" type="monotone" dot={false} activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive animationDuration={1050} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <AiSummary setPage={() => {}} />
    </div>
    </div>
  );
}

function PurchaseSuggestionsPage({ productsList, setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const [recs, setRecs] = React.useState<Record<string, unknown>[]>([]);
  React.useEffect(() => {
    fetchReorderRecommendations().then(setRecs).catch(() => setRecs([]));
  }, []);
  const suggestions = recs.length > 0
    ? recs.map((r) => ({
        key: String(r.itemId),
        name: String(r.itemName),
        stock: Number(r.currentAvailable),
        sold: Number(r.predictedDemand7d),
        suggested: Number(r.suggestedQty),
        risk: String(r.riskLevel),
      }))
    : productsList.filter((p) => p.stock <= 40).map((p) => ({
        key: p.key, name: p.name, stock: p.stock, sold: p.sold, suggested: 80, risk: 'MEDIUM',
      }));
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">AI Đề xuất nhập thêm hàng</h2>
          <p className="text-xs text-slate-400">Được đề xuất tự động dựa theo tốc độ bán hàng và chu kỳ vận chuyển.</p>
        </div>
        <Button type="primary" onClick={() => setPage('import-create')}>Lập phiếu tất cả</Button>
      </div>
      <div className="px-5 pb-5">
        <Table
          dataSource={suggestions}
          columns={[
            { title: 'Tên hàng', dataIndex: 'name', render: (v) => <span className="font-bold text-ink">{v}</span> },
            { title: 'Tồn hiện tại', dataIndex: 'stock' },
            { title: 'Đã bán (7 ngày)', dataIndex: 'sold' },
            { title: 'Số lượng đề xuất', render: (_, row) => Math.max(80, row.sold * 2) },
            { title: 'Độ ưu tiên', render: (_, row) => <Tag color={row.stock === 0 ? 'red' : 'orange'}>{row.stock === 0 ? 'KHẨN CẤP' : 'CAO'}</Tag> },
            { title: 'Hành động', render: () => <Button size="small" type="primary" ghost onClick={() => setPage('import-create')}>Lập phiếu</Button> }
          ]}
          pagination={false}
          rowKey="key"
        />
      </div>
    </Card>
  );
}

function ExpiryRiskPage({ productsList, setActivePromotions, setPage }: { productsList: Product[]; setActivePromotions: React.Dispatch<React.SetStateAction<Record<string, number>>>; setPage: (page: PageKey) => void }) {
  const [items, setItems] = React.useState<Product[]>(productsList.filter((p) => p.expiry !== 'Không áp dụng'));
  React.useEffect(() => {
    fetchNearExpiry()
      .then((rows) => {
        const mapped: Product[] = rows.map((row) => ({
          key: String(row.itemId),
          sku: row.itemCode,
          name: row.itemName,
          category: row.locationName,
          price: 0,
          cost: 0,
          stock: Math.round(Number(row.availableQuantity)),
          sold: 0,
          supplier: '-',
          status: 'Nguy cơ' as const,
          expiry: row.expiryDate ?? '—',
        }));
        if (mapped.length) setItems(mapped);
      })
      .catch(() => undefined);
  }, [productsList]);
  return <RiskCards title="Rủi ro hạn sử dụng" icon={CalendarClock} items={items} setActivePromotions={setActivePromotions} setPage={setPage} />;
}

function PromotionsPage({
  productsList,
  activePromotions,
  setActivePromotions,
  setPage,
}: {
  productsList: Product[];
  activePromotions: Record<string, number>;
  setActivePromotions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setPage: (page: PageKey) => void;
}) {
  const items = productsList.slice(1, 5);
  return <RiskCards title="Đề xuất khuyến mãi giảm giá" icon={WandSparkles} items={items} setActivePromotions={setActivePromotions} setPage={setPage} activePromotions={activePromotions} />;
}

function RiskCards({
  title,
  icon: Icon,
  items,
  setActivePromotions,
  setPage,
  activePromotions = {},
}: {
  title: string;
  icon: typeof CalendarClock;
  items: Product[];
  setActivePromotions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setPage: (page: PageKey) => void;
  activePromotions?: Record<string, number>;
}) {
  
  const handleApplyPromo = (productKey: string) => {
    setActivePromotions(prev => ({
      ...prev,
      [productKey]: 15 // Apply 15% discount for this product in POS!
    }));
    antdMessage.success(`Áp dụng chiến dịch giảm giá 15% cho sản phẩm thành công!`);
    setPage('pos');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const isApplied = activePromotions[item.key] !== undefined;
        return (
          <Card className="p-5 flex flex-col justify-between h-[220px]" key={item.key}>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo shadow-[0_2px_8px_rgba(70,72,212,0.1)]">
                  <Icon size={20} />
                </div>
                <StatusChip tone={isApplied ? 'success' : 'ai'}>{isApplied ? 'Đang áp dụng' : 'AI đề xuất'}</StatusChip>
              </div>
              <h3 className="font-semibold text-base line-clamp-1">{item.name}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                {title.includes('hạn') 
                  ? `Mặt hàng cận hạn (${item.expiry}). AI đề xuất chiến dịch giải phóng hàng tồn.` 
                  : 'AI gợi ý giảm giá 15% để kích thích cầu kéo tăng doanh thu dòng tiền.'}
              </p>
            </div>
            <Button
              className="w-full mt-3 font-semibold"
              type="primary"
              ghost={!isApplied}
              disabled={isApplied}
              onClick={() => handleApplyPromo(item.key)}
            >
              {isApplied ? 'Khuyến mãi hoạt động' : 'Áp dụng đề xuất AI (-15%)'}
            </Button>
          </Card>
        );
      })}
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
              <span>{msg.text}</span>
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
      <AiSummary setPage={setPage} />
    </div>
  );
}

function ReportsPage({ productsList, invoicesList }: { productsList: Product[]; invoicesList: any[] }) {
  const totalValue = categoryData.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr] relative">
      <div className="xl:col-span-2">
        <RevenueCard invoicesList={invoicesList} />
      </div>
      <Card className="hover:shadow-xl transition-all duration-300">
        <CardHeader title="Cơ cấu doanh thu" description="Phân bổ phần trăm doanh thu theo từng danh mục sản phẩm." />
        <div className="h-[290px] px-5 pb-5 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                innerRadius={68}
                outerRadius={96}
                paddingAngle={4}
                cornerRadius={5}
                isAnimationActive
                animationDuration={800}
              >
                {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <ChartTooltip content={<SmartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-slate-800">{totalValue}%</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng cộng</span>
          </div>
        </div>
      </Card>
      <Card className="hover:shadow-xl transition-all duration-300">
        <CardHeader title="Hiệu suất danh mục" description="Tỉ lệ đóng góp doanh thu thực tế của các ngành hàng chính." />
        <div className="h-[290px] px-4 pb-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 14, right: 18, bottom: 6, left: 0 }}>
              <defs>
                {categoryData.map((entry) => (
                  <linearGradient id={`grad-${entry.name}`} x1="0" y1="0" x2="0" y2="1" key={entry.name}>
                    <stop offset="0%" stopColor={entry.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
              <ChartTooltip content={<SmartTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.02)', radius: 6 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                {categoryData.map((entry) => <Cell key={entry.name} fill={`url(#grad-${entry.name})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = React.useState<UserDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-muted">Đang tải người dùng…</p>;
  return (
    <SimpleManagementPage
      title="Người dùng hệ thống"
      icon={UsersRound}
      rows={users.map((u) => `${u.fullName ?? u.username} (${u.role})`)}
    />
  );
}

function SettingsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {['Cấu hình cửa hàng', 'Thiết lập AI', 'Cảnh báo tồn kho', 'Tích hợp thanh toán'].map((title, index) => (
        <Card className="p-5" key={title}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Switch defaultChecked={index !== 3} />
          </div>
          <Form layout="vertical">
            <Form.Item label="Tên cấu hình"><Input defaultValue={title} /></Form.Item>
            <Form.Item label="Ngưỡng cảnh báo"><InputNumber className="w-full" defaultValue={index === 1 ? 88 : 20} /></Form.Item>
          </Form>
        </Card>
      ))}
    </div>
  );
}

function SimpleManagementPage({ title, rows, icon: Icon }: { title: string; rows: string[]; icon: typeof Tags }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title={title} action={<Button type="primary" icon={<Plus size={16} />}>Tạo mới</Button>} />
        <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
          {rows.map((row, index) => (
            <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-line bg-slate-50 p-4" key={row}>
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-primary">
                  <Icon size={18} />
                </div>
                <StatusChip tone={index % 3 === 0 ? 'warning' : 'success'}>{index % 3 === 0 ? 'Cần rà soát' : 'Hoạt động'}</StatusChip>
              </div>
              <strong className="text-ink">{row}</strong>
              <p className="mt-1 text-sm text-muted">{80 + index * 17} sản phẩm · biên lợi nhuận {12 + index}%</p>
            </motion.div>
          ))}
        </div>
      </Card>
      <AiSummary setPage={() => {}} />
    </div>
  );
}

function InvoiceDrawer({ invoice, onClose }: { invoice: any | null; onClose: () => void }) {
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
                <span>Giảm giá AI</span>
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
            <Button icon={<Printer size={16} />} onClick={() => antdMessage.info('Đang in hóa đơn ảo...')}>In hóa đơn</Button>
            <Button type="primary" block onClick={() => antdMessage.success('Đã gửi SMS cảm ơn đến khách hàng.')}>Gửi SMS khách</Button>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

export default App;
