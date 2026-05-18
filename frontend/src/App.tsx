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
import type { ColumnsType } from 'antd/es/table';
import { motion, AnimatePresence } from 'framer-motion';
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
import { cn } from './lib/utils';

type PageKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'pos'
  | 'invoices'
  | 'import-create'
  | 'import-slips'
  | 'inventory'
  | 'inventory-alerts'
  | 'ai-forecast'
  | 'purchase-suggestions'
  | 'expiry-risk'
  | 'promotions'
  | 'ai-assistant'
  | 'reports'
  | 'users'
  | 'settings';

type Product = {
  key: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  sold: number;
  price: number;
  supplier: string;
  status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng' | 'Nguy cơ';
  expiry: string;
};

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

const INITIAL_PRODUCTS: Product[] = [
  { key: 'P001', name: 'Nước ngọt Coca-Cola 330ml', sku: 'COLA-330', category: 'Đồ uống', stock: 452, sold: 1260, price: 12000, supplier: 'Coca-Cola VN', status: 'Còn hàng', expiry: '12/11/2026' },
  { key: 'P002', name: 'Sữa tươi Vinamilk ít đường', sku: 'MILK-VNM', category: 'Sữa & bơ', stock: 16, sold: 890, price: 34000, supplier: 'Vinamilk', status: 'Sắp hết', expiry: '21/06/2026' },
  { key: 'P003', name: 'Mì Hảo Hảo tôm chua cay', sku: 'NOOD-HH', category: 'Thực phẩm khô', stock: 0, sold: 2130, price: 4500, supplier: 'Acecook', status: 'Hết hàng', expiry: '14/01/2027' },
  { key: 'P004', name: 'Bánh Choco Pie hộp 12 cái', sku: 'CHOCO-12', category: 'Bánh kẹo', stock: 72, sold: 410, price: 52000, supplier: 'Orion', status: 'Nguy cơ', expiry: '08/06/2026' },
  { key: 'P005', name: 'Nước suối Lavie 500ml', sku: 'LAVIE-500', category: 'Đồ uống', stock: 820, sold: 1640, price: 7000, supplier: 'Lavie', status: 'Còn hàng', expiry: '02/12/2026' },
  { key: 'P006', name: 'Khăn giấy Pulppy 180 tờ', sku: 'PUL-180', category: 'Gia dụng', stock: 38, sold: 320, price: 28000, supplier: 'New Toyo', status: 'Sắp hết', expiry: 'Không áp dụng' },
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

const INITIAL_INVOICES = [
  { key: 'HD-1028', customer: 'Khách lẻ', amount: 486000, cashier: 'Nguyễn Văn An', status: 'Đã thanh toán', time: '14:35', subtotal: 450000, discount: 0, vat: 36000, items: [{ name: 'Nước ngọt Coca-Cola 330ml', qty: 25, price: 12000 }, { name: 'Bánh Choco Pie hộp 12 cái', qty: 3, price: 50000 }] },
  { key: 'HD-1027', customer: 'Trần Thị Lan', amount: 128000, cashier: 'Lê Minh Tuấn', status: 'Đã thanh toán', time: '14:21', subtotal: 118518, discount: 0, vat: 9482, items: [{ name: 'Sữa tươi Vinamilk ít đường', qty: 3, price: 34000 }, { name: 'Nước ngọt Coca-Cola 330ml', qty: 2, price: 12000 }] },
  { key: 'HD-1026', customer: 'Khách lẻ', amount: 742000, cashier: 'Nguyễn Văn An', status: 'Hoàn một phần', time: '13:58', subtotal: 687037, discount: 0, vat: 54963, items: [{ name: 'Bánh Choco Pie hộp 12 cái', qty: 10, price: 52000 }, { name: 'Sữa tươi Vinamilk ít đường', qty: 5, price: 34000 }] },
  { key: 'HD-1025', customer: 'Phạm Quang Huy', amount: 93000, cashier: 'Võ Thị Mai', status: 'Đã thanh toán', time: '13:47', subtotal: 86111, discount: 0, vat: 6889, items: [{ name: 'Khăn giấy Pulppy 180 tờ', qty: 3, price: 28000 }, { name: 'Mì Hảo Hảo tôm chua cay', qty: 2, price: 4500 }] },
];

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

function statusTone(status: Product['status']) {
  if (status === 'Còn hàng') return 'success';
  if (status === 'Sắp hết') return 'warning';
  return 'danger';
}

function App() {
  const [page, setPage] = React.useState<PageKey>('dashboard');
  const [drawerProduct, setDrawerProduct] = React.useState<Product | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Dynamic state declarations
  const [productsList, setProductsList] = React.useState<Product[]>(INITIAL_PRODUCTS);
  const [invoicesList, setInvoicesList] = React.useState<any[]>(INITIAL_INVOICES);
  
  const [importSlips, setImportSlips] = React.useState<any[]>([
    { key: 'PN-204', supplier: 'Vinamilk', amount: 18200000, status: 'Chờ duyệt', time: 'Hôm nay' },
    { key: 'PN-203', supplier: 'Acecook', amount: 9400000, status: 'Đã nhận', time: 'Hôm qua' },
    { key: 'PN-202', supplier: 'Lavie', amount: 12600000, status: 'Đang giao', time: '16/05/2026' }
  ]);

  const [activePromotions, setActivePromotions] = React.useState<Record<string, number>>({}); // maps Product Key -> discount %
  
  const [chatHistory, setChatHistory] = React.useState<Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>>([
    { sender: 'ai', text: 'Chào bạn! Tôi là trợ lý vận hành AI. Bạn cần tôi phân tích hàng tồn kho, lập chiến dịch khuyến mãi giảm giá hay lên phiếu nhập hàng giúp không? Hãy thử hỏi tôi: "Hàng nào sắp hết hạn?" hoặc "Sản phẩm nào cần nhập thêm?".' }
  ]);
  
  const [posCart, setPosCart] = React.useState<Array<{ product: Product; quantity: number }>>([]);

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
          Select: { controlHeight: 40 },
        },
      }}
    >
      <div className="min-h-screen bg-[#f8fafc] text-ink">
        <Sidebar page={page} setPage={setPage} />
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} page={page} setPage={setPage} />
        <main className="min-h-screen md:pl-[260px]">
          <Topbar
            title={pageMeta.title}
            description={pageMeta.description}
            setModalOpen={setModalOpen}
            openMobileNav={() => setMobileNavOpen(true)}
          />
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="mx-auto max-w-[1220px] px-4 py-5 sm:px-6"
          >
            <PageRenderer
              page={page}
              openProduct={setDrawerProduct}
              openModal={() => setModalOpen(true)}
              setPage={setPage}
              productsList={productsList}
              setProductsList={setProductsList}
              invoicesList={invoicesList}
              setInvoicesList={setInvoicesList}
              importSlips={importSlips}
              setImportSlips={setImportSlips}
              activePromotions={activePromotions}
              setActivePromotions={setActivePromotions}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              posCart={posCart}
              setPosCart={setPosCart}
              setSelectedInvoice={setSelectedInvoice}
            />
          </motion.div>
        </main>
        <ProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} />
        <InvoiceDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
        <CreateModal
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          page={page}
          productsList={productsList}
          setProductsList={setProductsList}
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

function Sidebar({ page, setPage }: { page: PageKey; setPage: (page: PageKey) => void }) {
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
        {navItems.map((item) => {
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
        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-slate-700">
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
}: {
  open: boolean;
  onClose: () => void;
  page: PageKey;
  setPage: (page: PageKey) => void;
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
          {navItems.map((item) => {
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
      </div>
    </Drawer>
  );
}

function Topbar({
  title,
  description,
  setModalOpen,
  openMobileNav,
}: {
  title: string;
  description: string;
  setModalOpen: (open: boolean) => void;
  openMobileNav: () => void;
}) {
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
          <Input prefix={<Search size={16} />} placeholder="Tìm kiếm sản phẩm, hóa đơn, cảnh báo..." />
          <Badge dot>
            <Button icon={<Bell size={16} />} />
          </Badge>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            Tạo nhanh
          </Button>
        </div>
        <Button className="lg:hidden" type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
          Tạo
        </Button>
      </div>
    </header>
  );
}

function PageRenderer({
  page,
  openProduct,
  openModal,
  setPage,
  productsList,
  setProductsList,
  invoicesList,
  setInvoicesList,
  importSlips,
  setImportSlips,
  activePromotions,
  setActivePromotions,
  chatHistory,
  setChatHistory,
  posCart,
  setPosCart,
  setSelectedInvoice,
}: {
  page: PageKey;
  openProduct: (product: Product) => void;
  openModal: () => void;
  setPage: (page: PageKey) => void;
  productsList: Product[];
  setProductsList: React.Dispatch<React.SetStateAction<Product[]>>;
  invoicesList: any[];
  setInvoicesList: React.Dispatch<React.SetStateAction<any[]>>;
  importSlips: any[];
  setImportSlips: React.Dispatch<React.SetStateAction<any[]>>;
  activePromotions: Record<string, number>;
  setActivePromotions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  chatHistory: any[];
  setChatHistory: React.Dispatch<React.SetStateAction<any[]>>;
  posCart: any[];
  setPosCart: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedInvoice: (invoice: any) => void;
}) {
  if (page === 'dashboard') {
    return <Dashboard openProduct={openProduct} setPage={setPage} productsList={productsList} invoicesList={invoicesList} />;
  }
  if (page === 'pos') {
    return (
      <PosPage
        productsList={productsList}
        setProductsList={setProductsList}
        posCart={posCart}
        setPosCart={setPosCart}
        invoicesList={invoicesList}
        setInvoicesList={setInvoicesList}
        activePromotions={activePromotions}
        setPage={setPage}
      />
    );
  }
  if (page === 'products') {
    return <ProductsPage openProduct={openProduct} openModal={openModal} productsList={productsList} activePromotions={activePromotions} />;
  }
  if (page === 'categories') {
    return <CategoriesPage productsList={productsList} />;
  }
  if (page === 'suppliers') {
    return <SuppliersPage productsList={productsList} />;
  }
  if (page === 'invoices') {
    return <InvoicesPage invoicesList={invoicesList} setSelectedInvoice={setSelectedInvoice} />;
  }
  if (page === 'import-create') {
    return <ImportCreatePage productsList={productsList} importSlips={importSlips} setImportSlips={setImportSlips} setPage={setPage} />;
  }
  if (page === 'import-slips') {
    return <ImportSlipsPage importSlips={importSlips} />;
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
        setImportSlips={setImportSlips}
        setActivePromotions={setActivePromotions}
        importSlips={importSlips}
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
      <KpiGrid productsList={productsList} invoicesList={invoicesList} />
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

function KpiGrid({ productsList, invoicesList }: { productsList: Product[]; invoicesList: any[] }) {
  // Sum today's real invoices
  const todayRevenue = invoicesList.reduce((sum, inv) => sum + inv.amount, 0);
  const todayOrders = invoicesList.length;
  
  const lowStockCount = productsList.filter(p => p.stock > 0 && p.stock <= 40).length;
  const outOfStockCount = productsList.filter(p => p.stock === 0).length;

  const items = [
    { label: 'Doanh thu thực tế', value: money(todayRevenue), delta: '+20.2%', icon: ChartNoAxesCombined, tone: 'emerald' },
    { label: 'Đơn hàng hôm nay', value: todayOrders.toString(), delta: '+4.7%', icon: ShoppingCart, tone: 'indigo' },
    { label: 'Sắp hết hàng', value: lowStockCount.toString(), delta: 'Cần nhập', icon: AlertTriangle, tone: 'amber' },
    { label: 'Hết hàng (Nguy cơ)', value: outOfStockCount.toString(), delta: 'Ưu tiên', icon: Gauge, tone: 'red' },
    { label: 'Độ chính xác AI', value: '88.5%', delta: '+3.1%', icon: BrainCircuit, tone: 'ai' },
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

function RevenueCard({ invoicesList }: { invoicesList: any[] }) {
  // Sum today's active POS invoices to show updates to CN dynamically
  const todayPOSRevenue = invoicesList.reduce((sum, inv) => sum + inv.amount, 0);
  const salesDataWithPOS = salesData.map(d => {
    if (d.day === 'CN') {
      // 14.9 is base forecast CN, let's scale additional POS revenue to millions format
      return { ...d, revenue: parseFloat((14.9 + todayPOSRevenue / 1000000).toFixed(2)) };
    }
    return d;
  });

  return (
    <Card className="chart-card overflow-hidden hover:shadow-xl transition-all duration-300">
      <CardHeader
        title="Doanh thu 7 ngày gần nhất"
        description="So sánh doanh thu thực tế và dự báo thông minh từ AI."
        action={<Button type="text" className="hover:bg-slate-100 rounded-lg">...</Button>}
      />
      <div className="h-[310px] px-3 pb-5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={salesDataWithPOS} margin={{ top: 14, right: 18, bottom: 6, left: 0 }}>
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

function AiSummary({ setPage }: { setPage: (page: PageKey) => void }) {
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

function ProductsTable({ title, rows, openProduct }: { title: string; rows: Product[]; openProduct: (product: Product) => void }) {
  const columns: ColumnsType<Product> = [
    { title: 'Sản phẩm', dataIndex: 'name', render: (v, row) => <button className="text-left font-semibold text-ink hover:text-primary transition" onClick={() => openProduct(row)}>{v}</button> },
    { title: 'Danh mục', dataIndex: 'category' },
    { title: 'Đã bán', dataIndex: 'sold', sorter: (a, b) => a.sold - b.sold },
    { title: 'Tồn', dataIndex: 'stock' },
    { title: 'Doanh thu', dataIndex: 'price', render: (_, row) => money(row.price * row.sold) },
    { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusChip tone={statusTone(v)}>{v}</StatusChip> },
  ];
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} />
      <Table<Product> columns={columns} dataSource={rows} pagination={false} size="middle" rowKey="key" />
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

function CategoriesPage({ productsList }: { productsList: Product[] }) {
  const categories = Array.from(new Set(productsList.map(p => p.category)));
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Danh mục hàng hóa" />
        <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
          {categories.map((cat, idx) => {
            const count = productsList.filter(p => p.category === cat).length;
            return (
              <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-line bg-slate-50 p-4" key={cat}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-primary">
                    <Tags size={18} />
                  </div>
                  <StatusChip tone="success">Đang bán</StatusChip>
                </div>
                <strong className="text-ink text-base">{cat}</strong>
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

function SuppliersPage({ productsList }: { productsList: Product[] }) {
  const suppliersList = [
    { name: 'Vinamilk', contact: 'Đại lý Sữa miền Nam', email: 'sales@vinamilk.com.vn', sla: '98%', debt: 12400000 },
    { name: 'Coca-Cola VN', contact: 'Đại lý Nước ngọt Coca', email: 'coke@cocacola.com', sla: '95%', debt: 8200000 },
    { name: 'Acecook', contact: 'Phân phối Mì ăn liền', email: 'ace@cook.vn', sla: '92%', debt: 0 },
    { name: 'Orion Food', contact: 'Nhà phân phối Orion', email: 'contact@orion.com.vn', sla: '96%', debt: 4500000 },
    { name: 'Lavie', contact: 'Nước khoáng Lavie', email: 'info@laviewater.co', sla: '97%', debt: 1500000 },
    { name: 'New Toyo', contact: 'Gia dụng Pulppy', email: 'sales@newtoyo.com', sla: '94%', debt: 0 },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Nhà cung cấp đối tác" />
        <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
          {suppliersList.map((sup) => {
            const count = productsList.filter(p => p.supplier === sup.name).length;
            return (
              <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-line bg-slate-50 p-4" key={sup.name}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo">
                    <Truck size={18} />
                  </div>
                  <Tag color="cyan">SLA {sup.sla}</Tag>
                </div>
                <strong className="text-ink text-base">{sup.name}</strong>
                <p className="text-xs text-muted mt-0.5">{sup.contact} · {sup.email}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <span className="text-slate-500">{count} mặt hàng cung cấp</span>
                  <span className="font-semibold text-red-600">Nợ: {money(sup.debt)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
      <AiSummary setPage={() => {}} />
    </div>
  );
}

function PosPage({
  productsList,
  setProductsList,
  posCart,
  setPosCart,
  invoicesList,
  setInvoicesList,
  activePromotions,
  setPage,
}: {
  productsList: Product[];
  setProductsList: React.Dispatch<React.SetStateAction<Product[]>>;
  posCart: Array<{ product: Product; quantity: number }>;
  setPosCart: React.Dispatch<React.SetStateAction<Array<{ product: Product; quantity: number }>>>;
  invoicesList: any[];
  setInvoicesList: React.Dispatch<React.SetStateAction<any[]>>;
  activePromotions: Record<string, number>;
  setPage: (page: PageKey) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Tất cả');
  const [selectedCustomer, setSelectedCustomer] = React.useState('Khách lẻ');
  const [appliedPromo, setAppliedPromo] = React.useState<string>('Không có');
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [lastInvoice, setLastInvoice] = React.useState<any | null>(null);

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

  const handleCheckout = () => {
    if (posCart.length === 0) {
      antdMessage.warning('Giỏ hàng trống! Hãy quét chọn sản phẩm.');
      return;
    }

    // Deduct stock and increment sold in products state
    const updatedProducts = productsList.map(prod => {
      const cartItem = posCart.find(item => item.product.key === prod.key);
      if (cartItem) {
        const newStock = Math.max(0, prod.stock - cartItem.quantity);
        return {
          ...prod,
          stock: newStock,
          sold: prod.sold + cartItem.quantity,
          status: newStock === 0 ? 'Hết hàng' : newStock <= 20 ? 'Sắp hết' : 'Còn hàng' as any
        };
      }
      return prod;
    });
    setProductsList(updatedProducts);

    // Create invoice record
    const invoiceId = `HD-${1000 + invoicesList.length + 29}`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newInvoice = {
      key: invoiceId,
      customer: selectedCustomer,
      amount: Math.round(total),
      cashier: 'Lê Minh Tuấn',
      status: 'Đã thanh toán',
      time: timeStr,
      items: posCart.map(item => ({
        name: item.product.name,
        qty: item.quantity,
        price: getProductPrice(item.product)
      })),
      subtotal: Math.round(subtotal),
      discount: Math.round(promoDiscount),
      vat: Math.round(vat),
    };

    setInvoicesList([newInvoice, ...invoicesList]);
    setLastInvoice(newInvoice);
    setReceiptOpen(true);
    setPosCart([]);
    antdMessage.success('Thanh toán đơn hàng thành công!');
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_430px]">
      <Card>
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-ink">Danh sách sản phẩm bán</h2>
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
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredProducts.map((product) => {
              const discount = activePromotions[product.key] || 0;
              const originalPrice = product.price;
              const curPrice = getProductPrice(product);
              return (
                <button
                  className={cn(
                    'rounded-xl border border-line bg-slate-50 p-4 text-left transition hover:border-emerald hover:bg-emerald-50/50 flex flex-col justify-between h-[156px] relative overflow-hidden',
                    product.stock === 0 && 'opacity-60 cursor-not-allowed bg-slate-100/50'
                  )}
                  key={product.key}
                  onClick={() => handleAddToCart(product)}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm font-bold text-ink line-clamp-2 leading-snug">{product.name}</strong>
                      {discount > 0 && <Tag color="volcano" className="mr-0 font-bold">-{discount}%</Tag>}
                    </div>
                    <p className="mt-1 text-xs text-slate-400 font-medium">{product.sku} · Tồn {product.stock}</p>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-extrabold text-primary text-base">{money(curPrice)}</span>
                    {discount > 0 && <span className="text-xs text-slate-400 line-through">{money(originalPrice)}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
      
      <Card className="flex flex-col h-fit">
        <CardHeader title="Giỏ hàng hiện tại" action={<Tag color="green" className="font-bold">{posCart.length} dòng hàng</Tag>} />
        <div className="space-y-3 px-5 pb-2 flex-1 max-h-[380px] overflow-y-auto scrollbar-thin">
          {posCart.map((item) => {
            const discPrice = getProductPrice(item.product);
            return (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 hover:border-slate-200 transition" key={item.product.key}>
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
          
          <UiButton className="w-full h-11" variant="primary" onClick={handleCheckout}>
            Xác nhận thanh toán
          </UiButton>
        </div>
      </Card>
      
      {/* Dynamic invoice checkout receipt modal */}
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
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 font-mono text-xs">
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

function ImportCreatePage({
  productsList,
  importSlips,
  setImportSlips,
  setPage,
}: {
  productsList: Product[];
  importSlips: any[];
  setImportSlips: React.Dispatch<React.SetStateAction<any[]>>;
  setPage: (page: PageKey) => void;
}) {
  const [form] = Form.useForm();
  
  const handleCreateSlip = (values: any) => {
    const slipId = `PN-${200 + importSlips.length + 5}`;
    const newSlip = {
      key: slipId,
      supplier: values.supplier || 'Chưa chọn',
      amount: Math.round((values.price || 24000) * (values.quantity || 100)),
      status: 'Chờ duyệt',
      time: 'Hôm nay',
    };
    
    setImportSlips([newSlip, ...importSlips]);
    antdMessage.success(`Tạo phiếu nhập ${slipId} thành công!`);
    form.resetFields();
    setPage('import-slips');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader title="Thông tin lập phiếu nhập hàng" />
        <Form layout="vertical" form={form} onFinish={handleCreateSlip} className="px-5 pb-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name="supplier" label="Nhà cung cấp đối tác" rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp' }]}>
              <Select placeholder="Chọn nhà cung cấp" options={[{ value: 'Vinamilk', label: 'Vinamilk' }, { value: 'Coca-Cola Việt Nam', label: 'Coca-Cola Việt Nam' }, { value: 'Acecook', label: 'Acecook' }]} />
            </Form.Item>
            <Form.Item name="deliveryDate" label="Ngày giao dự kiến">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="productName" label="Sản phẩm cần nhập" rules={[{ required: true, message: 'Nhập tên hoặc SKU sản phẩm' }]}>
              <Select
                placeholder="Chọn sản phẩm"
                options={productsList.map(p => ({ value: p.name, label: `${p.name} (Tồn: ${p.stock})` }))}
              />
            </Form.Item>
            <Form.Item name="quantity" label="Số lượng nhập" rules={[{ required: true, message: 'Nhập số lượng nhập' }]}>
              <InputNumber className="w-full" min={1} defaultValue={100} />
            </Form.Item>
            <Form.Item name="price" label="Đơn giá mua dự kiến (VNĐ)">
              <InputNumber className="w-full" min={1000} defaultValue={25000} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" icon={<Plus size={16} />} className="mt-2">
            Thêm vào phiếu và Lưu phiếu
          </Button>
        </Form>
      </Card>
      <AiSummary setPage={setPage} />
    </div>
  );
}

function ImportSlipsPage({ importSlips }: { importSlips: any[] }) {
  const columns = [
    { title: 'Mã phiếu', dataIndex: 'key' },
    { title: 'Nhà cung cấp', dataIndex: 'supplier' },
    { title: 'Tổng giá trị nhập', dataIndex: 'amount', render: (v: number) => money(v) },
    { title: 'Thời gian', dataIndex: 'time' },
    { title: 'Trạng thái', dataIndex: 'status', render: (v: string) => <StatusChip tone={v.includes('duyệt') ? 'warning' : 'success'}>{v}</StatusChip> }
  ];
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Danh sách phiếu nhập hàng" />
      <Table columns={columns} dataSource={importSlips} pagination={{ pageSize: 8 }} rowKey="key" />
    </Card>
  );
}

function InventoryPage({ openProduct, productsList }: { openProduct: (product: Product) => void; productsList: Product[] }) {
  return (
    <div className="space-y-4">
      <KpiGrid productsList={productsList} invoicesList={[]} />
      <ProductsTable title="Tồn kho theo sản phẩm" rows={productsList} openProduct={openProduct} />
    </div>
  );
}

function InventoryAlertsPage({ productsList, setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {productsList.filter((p) => p.stock <= 40).map((product) => (
        <Card className="p-5 flex flex-col justify-between h-[210px] relative overflow-hidden" key={product.key}>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <AlertTriangle className={product.stock === 0 ? 'text-red-600' : 'text-amber-500'} />
              <StatusChip tone={product.stock === 0 ? 'danger' : 'warning'}>
                {product.stock === 0 ? 'Hết hàng' : 'Sắp hết'}
              </StatusChip>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{product.name}</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">Tồn hiện tại: <span className="font-bold">{product.stock}</span>. AI đề xuất khẩn trương nhập thêm.</p>
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
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <Card className="hover:shadow-xl transition-all duration-300">
        <CardHeader title="Dự báo doanh thu & đơn hàng từ AI" description="Mô hình học sâu kết hợp doanh số lịch sử, thời tiết và lịch sự kiện." />
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
  );
}

function PurchaseSuggestionsPage({ productsList, setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const suggestions = productsList.filter((p) => p.stock <= 40);
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
  const items = productsList.filter((p) => p.expiry !== 'Không áp dụng');
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
  setImportSlips,
  setActivePromotions,
  importSlips,
}: {
  productsList: Product[];
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>;
  setChatHistory: React.Dispatch<React.SetStateAction<Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>>>;
  setPage: (page: PageKey) => void;
  setImportSlips: React.Dispatch<React.SetStateAction<any[]>>;
  setActivePromotions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  importSlips: any[];
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

    // Simulate AI response
    setTimeout(() => {
      let aiText = '';
      let action: any = undefined;
      const lower = userMsg.toLowerCase();

      if (lower.includes('hết hàng') || lower.includes('tồn kho')) {
        const outStock = productsList.filter(p => p.stock === 0);
        const lowStock = productsList.filter(p => p.stock > 0 && p.stock <= 40);
        aiText = `Hệ thống ghi nhận có ${outStock.length} sản phẩm đã Hết hàng hoàn toàn (${outStock.map(o=>o.name).join(', ')}) và ${lowStock.length} mặt hàng sắp Hết hàng. Bạn nên tạo phiếu nhập hàng sớm!`;
        action = { label: 'Tạo phiếu nhập', page: 'import-create' };
      } else if (lower.includes('doanh thu') || lower.includes('bán chạy')) {
        aiText = 'Doanh thu hôm nay đang tăng trưởng tốt nhờ sức mua mạnh từ ngành hàng Đồ uống & Sữa. Biểu đồ cấu cơ doanh số chỉ ra Coca-Cola là sản phẩm mang lại lợi nhuận cao nhất trong 7 ngày qua.';
        action = { label: 'Xem báo cáo', page: 'reports' };
      } else if (lower.includes('khuyến mãi') || lower.includes('giảm giá')) {
        aiText = 'Mì Hảo Hảo hiện đang có nguy cơ tồn kho cao. AI đề xuất chạy chương trình Flash Sale giảm giá 15% cho dòng Bánh kẹo & Mì gói để giải quyết lượng tồn cận hạn.';
        action = { label: 'Thiết lập KM', page: 'promotions' };
      } else {
        aiText = 'Tôi đã rà soát hệ thống. Mọi luồng vận hành tại SmartMart đang hoạt động ổn định. Để kiểm soát chặt chẽ, bạn có thể thực hiện kiểm kê kho định kỳ hoặc hỏi tôi cụ thể hơn nhé!';
      }

      setChatHistory([...newHistory, { sender: 'ai' as const, text: aiText, action }]);
    }, 850);
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
  return <SimpleManagementPage title="Người dùng hệ thống" icon={UsersRound} rows={['Admin Demo', 'Thu ngân ca sáng', 'Quản lý kho', 'Kế toán', 'Quản lý cửa hàng', 'AI Auditor']} />;
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

function ProductDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <Drawer open={Boolean(product)} onClose={onClose} title="Chi tiết sản phẩm" width={440}>
      {product ? (
        <div className="space-y-5">
          <div className="rounded-2xl bg-slate-50 p-5">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-sm text-muted">{product.sku} · {product.category}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Statistic title="Tồn kho" value={product.stock} />
            <Statistic title="Đã bán" value={product.sold} />
            <Statistic title="Giá bán" value={product.price} formatter={(v) => money(Number(v))} />
            <Statistic title="Hạn dùng" value={product.expiry} />
          </div>
          <Progress percent={Math.min(100, Math.round((product.stock / 900) * 100))} strokeColor="#006c49" />
          <Button type="primary" block onClick={() => antdMessage.success('Đã lưu hành động xử lý hàng tồn.')}>
            Tạo hành động xử lý tồn kho
          </Button>
        </div>
      ) : null}
    </Drawer>
  );
}

function InvoiceDrawer({ invoice, onClose }: { invoice: any | null; onClose: () => void }) {
  return (
    <Drawer open={Boolean(invoice)} onClose={onClose} title="Chi tiết hóa đơn bán hàng" width={450}>
      {invoice ? (
        <div className="space-y-5">
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

function CreateModal({
  open,
  onCancel,
  page,
  productsList,
  setProductsList,
}: {
  open: boolean;
  onCancel: () => void;
  page: PageKey;
  productsList: Product[];
  setProductsList: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    if (page === 'products') {
      const newProductKey = `P00${productsList.length + 1}`;
      const newProduct: Product = {
        key: newProductKey,
        name: values.name,
        sku: values.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        category: values.category || 'Chưa phân loại',
        stock: values.stock || 0,
        sold: 0,
        price: values.price || 0,
        supplier: values.supplier || 'Không có',
        status: (values.stock === 0 ? 'Hết hàng' : values.stock <= 20 ? 'Sắp hết' : 'Còn hàng') as any,
        expiry: values.expiry || 'Không áp dụng',
      };
      
      setProductsList([newProduct, ...productsList]);
      antdMessage.success(`Thêm mới sản phẩm ${values.name} thành công!`);
    } else {
      antdMessage.success('Tạo thành công tác vụ vận hành mới!');
    }
    
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={page === 'products' ? 'Thêm mới Sản phẩm vào hệ thống' : `Tạo nhanh - ${pageTitles[page].title}`}
      okText="Tạo"
      cancelText="Hủy"
      onOk={() => form.submit()}
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        {page === 'products' ? (
          <div className="space-y-1">
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
              <Input placeholder="Nhập tên sản phẩm (Ví dụ: Trà sữa đóng chai)" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="sku" label="SKU sản phẩm">
                <Input placeholder="Ví dụ: MILK-BOT-500" />
              </Form.Item>
              <Form.Item name="category" label="Danh mục">
                <Select placeholder="Chọn danh mục" options={[{ value: 'Đồ uống', label: 'Đồ uống' }, { value: 'Sữa & bơ', label: 'Sữa & bơ' }, { value: 'Thực phẩm khô', label: 'Thực phẩm khô' }, { value: 'Bánh kẹo', label: 'Bánh kẹo' }, { value: 'Gia dụng', label: 'Gia dụng' }]} />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="stock" label="Số lượng tồn ban đầu" rules={[{ required: true, message: 'Nhập số lượng tồn' }]}>
                <InputNumber className="w-full" min={0} defaultValue={100} />
              </Form.Item>
              <Form.Item name="price" label="Đơn giá bán ra (VNĐ)" rules={[{ required: true, message: 'Nhập đơn giá bán' }]}>
                <InputNumber className="w-full" min={0} defaultValue={15000} />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="supplier" label="Nhà cung cấp">
                <Select placeholder="Chọn đối tác" options={[{ value: 'Vinamilk', label: 'Vinamilk' }, { value: 'Coca-Cola VN', label: 'Coca-Cola VN' }, { value: 'Acecook', label: 'Acecook' }]} />
              </Form.Item>
              <Form.Item name="expiry" label="Hạn sử dụng">
                <Input placeholder="Ví dụ: 12/12/2026 hoặc Không áp dụng" />
              </Form.Item>
            </div>
          </div>
        ) : (
          <>
            <Form.Item name="name" label="Tên mục" rules={[{ required: true, message: 'Nhập tên...' }]}>
              <Input placeholder="Nhập tên..." />
            </Form.Item>
            <Form.Item name="type" label="Loại tác vụ">
              <Select defaultValue="manual" options={[{ value: 'manual', label: 'Thủ công' }, { value: 'ai', label: 'Đề xuất bởi AI' }]} />
            </Form.Item>
            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={4} placeholder="Ghi chú vận hành..." />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}

export default App;
