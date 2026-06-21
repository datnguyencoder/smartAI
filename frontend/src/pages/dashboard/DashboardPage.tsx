import * as React from 'react';
import { Button, Progress, Tag } from 'antd';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileInput,
  LineChart,
  PackageOpen,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui';
import SmartTooltip from '@/components/ai/SmartTooltip';
import { formatMoney as money } from '@/lib/itemMapper';
import type { Product } from '@/lib/itemMapper';
import { canAccessPage, normalizeRole } from '@/lib/permissions';
import {
  fetchDashboardForecastSummary,
  fetchDashboardRevenue,
  fetchDashboardSummary,
  fetchInventoryAlerts,
  fetchInventorySummary,
  fetchSalesReport,
} from '@/services/wmsApi';
import type { DashboardSummaryDto, InventoryAlertDto, SalesReportDto, UserDto } from '@/types/api';
import type { PageKey } from '@/types/pages';
import { cn } from '@/lib/utils';

const VI_WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

type DashboardProps = {
  authUser: UserDto;
  openProduct: (product: Product) => void;
  setPage: (page: PageKey) => void;
  productsList: Product[];
  invoicesList: any[];
};

type InventorySummary = {
  inventoryRows: number;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  lowStockRows: number;
  outOfStockRows: number;
  nearExpiryRows: number;
};

type StatTone = 'emerald' | 'blue' | 'amber' | 'red' | 'purple';

type StatItem = {
  label: string;
  value: string;
  helper: string;
  tone: StatTone;
  icon: React.ReactNode;
  progress?: number;
};

const toneClasses: Record<StatTone, { shell: string; icon: string; text: string; bar: string }> = {
  emerald: { shell: 'border-emerald-100 bg-emerald-50', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700', bar: '#10b981' },
  blue: { shell: 'border-blue-100 bg-blue-50', icon: 'bg-blue-600 text-white', text: 'text-blue-700', bar: '#2563eb' },
  amber: { shell: 'border-amber-100 bg-amber-50', icon: 'bg-amber-500 text-white', text: 'text-amber-700', bar: '#f59e0b' },
  red: { shell: 'border-red-100 bg-red-50', icon: 'bg-red-600 text-white', text: 'text-red-700', bar: '#ef4444' },
  purple: { shell: 'border-purple-100 bg-purple-50', icon: 'bg-purple-600 text-white', text: 'text-purple-700', bar: '#8b5cf6' },
};

function formatWeekdayLabel(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return VI_WEEKDAY_LABELS[d.getDay()] ?? day.slice(5);
}

function numberFrom(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatQty(value: unknown) {
  return Math.round(numberFrom(value)).toLocaleString('vi-VN');
}

function StatTile({ item }: { item: StatItem }) {
  const tone = toneClasses[item.tone];
  return (
    <div className={cn('min-h-[148px] min-w-0 overflow-hidden rounded-xl border p-4', tone.shell)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', tone.icon)}>{item.icon}</div>
        <span className={cn('max-w-[45%] shrink-0 truncate text-right text-xs font-bold', tone.text)}>{item.helper}</span>
      </div>
      <div className="mt-4 min-w-0">
        <div className="truncate text-sm font-semibold text-slate-500">{item.label}</div>
        <div className="mt-1 break-all text-base font-black tabular-nums leading-snug tracking-tight text-slate-950 sm:text-lg lg:text-xl [overflow-wrap:anywhere]">
          {item.value}
        </div>
      </div>
      {item.progress != null && (
        <Progress className="mt-3" percent={item.progress} showInfo={false} strokeColor={tone.bar} trailColor="rgba(148,163,184,0.2)" />
      )}
    </div>
  );
}

function DashboardHeader({
  canImport,
  setPage,
  onRefresh,
  totalAlerts,
  forecastRisk,
}: {
  canImport: boolean;
  setPage: (page: PageKey) => void;
  onRefresh: () => void;
  totalAlerts: number;
  forecastRisk: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100 ring-1 ring-white/15">
              <BarChart3 size={14} /> SmartMart Command Center
            </span>
            <span className="rounded-lg bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/20">Realtime</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-[30px] font-black leading-tight tracking-normal md:text-[38px]">
            Bảng điều khiển vận hành
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Theo dõi doanh thu, tồn kho, cảnh báo và rủi ro AI trong một màn hình để quyết định nhanh trước mỗi ca bán.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="primary" size="large" icon={<ShoppingCart size={16} />} onClick={() => setPage('pos')}>
              Tạo hóa đơn POS
            </Button>
            {canImport && (
              <Button size="large" className="border-white/25 bg-white text-slate-950 hover:!border-white hover:!bg-slate-100" icon={<FileInput size={16} />} onClick={() => setPage('import-create')}>
                Tạo phiếu nhập
              </Button>
            )}
            <Button size="large" className="border-white/25 bg-transparent text-white hover:!border-white hover:!bg-white/10 hover:!text-white" icon={<RefreshCw size={16} />} onClick={onRefresh}>
              Làm mới
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4">
          <div className="rounded-xl bg-white p-4 text-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Cảnh báo cần xử lý</div>
                <div className="mt-2 text-3xl font-black">{totalAlerts}</div>
              </div>
              <AlertTriangle className={totalAlerts > 0 ? 'text-red-500' : 'text-emerald-500'} size={34} />
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 text-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Rủi ro AI</div>
                <div className="mt-2 text-3xl font-black">{forecastRisk}</div>
              </div>
              <Sparkles className="text-purple-600" size={34} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RevenuePanel({ chartData, salesRows }: { chartData: Array<{ day: string; revenue: number }>; salesRows: SalesReportDto[] }) {
  const totalRevenue = salesRows.reduce((sum, row) => sum + numberFrom(row.totalRevenue), 0);
  const totalProfit = salesRows.reduce((sum, row) => sum + numberFrom(row.grossProfit), 0);
  const totalOrders = salesRows.reduce((sum, row) => sum + numberFrom(row.totalOrders), 0);
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Hiệu suất doanh thu"
        description="7 ngày gần nhất, tính trên đơn đã hoàn tất"
        action={<Tag color="green">Biên LN {margin}%</Tag>}
      />
      <div className="grid gap-4 px-5 pb-5 lg:grid-cols-[1fr_180px]">
        <div className="h-[320px]">
          {chartData.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-slate-400">Chưa có dữ liệu doanh thu</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="dashboardRevenueArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={92}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(value) => money(Number(value))}
                />
                <ChartTooltip content={<SmartTooltip />} />
                <Area dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={3} fill="url(#dashboardRevenueArea)" type="monotone" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid gap-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase text-slate-400">Tổng 7 ngày</div>
            <div className="mt-2 break-words text-xl font-black text-slate-950">{money(totalRevenue)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase text-slate-400">Lợi nhuận</div>
            <div className="mt-2 break-words text-xl font-black text-emerald-700">{money(totalProfit)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase text-slate-400">Số đơn</div>
            <div className="mt-2 text-xl font-black text-slate-950">{formatQty(totalOrders)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RiskPanel({
  alerts,
  inventorySummary,
  forecastRisk,
}: {
  alerts: InventoryAlertDto[];
  inventorySummary: InventorySummary | null;
  forecastRisk: number;
}) {
  const low = inventorySummary?.lowStockRows ?? alerts.filter((a) => a.alertType?.includes('LOW')).length;
  const out = inventorySummary?.outOfStockRows ?? alerts.filter((a) => a.alertType?.includes('OUT')).length;
  const expiry = inventorySummary?.nearExpiryRows ?? alerts.filter((a) => a.alertType?.includes('EXPIRY')).length;
  const data = [
    { name: 'Hết hàng', value: out, color: '#ef4444' },
    { name: 'Tồn thấp', value: low, color: '#f59e0b' },
    { name: 'Cận date', value: expiry, color: '#8b5cf6' },
    { name: 'AI risk', value: forecastRisk, color: '#2563eb' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Trung tâm rủi ro" description="Ưu tiên xử lý tồn kho và forecast" />
      <div className="h-[230px] px-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 12 }}>
            <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={76} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
            <ChartTooltip formatter={(value: number) => [`${value} mục`, 'Số lượng']} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 px-5 pb-5">
        <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">Hết hàng: {out}</div>
        <div className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700">Tồn thấp: {low}</div>
        <div className="rounded-xl bg-purple-50 p-3 text-sm font-bold text-purple-700">Cận date: {expiry}</div>
        <div className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">AI risk: {forecastRisk}</div>
      </div>
    </Card>
  );
}

function TopProductsPanel({ products, openProduct }: { products: Product[]; openProduct: (product: Product) => void }) {
  return (
    <Card>
      <CardHeader title="Sản phẩm bán chạy" description="Top SKU trong 7 ngày gần nhất" />
      <div className="space-y-2 px-5 pb-5">
        {products.length === 0 ? (
          <div className="rounded-xl border border-line py-8 text-center text-sm text-slate-400">Chưa có dữ liệu sản phẩm</div>
        ) : (
          products.slice(0, 6).map((product, index) => (
            <button
              key={product.key}
              type="button"
              onClick={() => openProduct(product)}
              className="grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{product.name}</span>
                <span className="text-xs text-slate-400">{product.sku}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-black text-slate-900">{formatQty(product.sold || product.stock)}</span>
                <span className="text-xs text-slate-400">đã bán/tồn</span>
              </span>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

function AlertsPanel({ alerts, setPage }: { alerts: InventoryAlertDto[]; setPage: (page: PageKey) => void }) {
  const visible = alerts.slice(0, 5);
  return (
    <Card>
      <CardHeader
        title="Việc cần xử lý"
        description="Cảnh báo chưa giải quyết"
        action={<Button size="small" onClick={() => setPage('inventory-alerts')}>Mở kho</Button>}
      />
      <div className="space-y-2 px-5 pb-5">
        {visible.length === 0 ? (
          <div className="grid min-h-[190px] place-items-center rounded-xl bg-emerald-50 text-center text-sm text-emerald-700">
            <div>
              <CheckCircle2 className="mx-auto mb-2" />
              Không có cảnh báo tồn kho chưa xử lý
            </div>
          </div>
        ) : (
          visible.map((alert) => (
            <div key={alert.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">{alert.itemName}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{alert.message}</div>
                </div>
                <Tag color={alert.severity === 'CRITICAL' ? 'red' : 'orange'}>{alert.severity}</Tag>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function OperationsPanel({ setPage, canImport }: { setPage: (page: PageKey) => void; canImport: boolean }) {
  const actions = [
    { label: 'Bán hàng POS', helper: 'Tạo hóa đơn mới', icon: <ReceiptText size={18} />, page: 'pos' as PageKey, enabled: true },
    { label: 'Nhập hàng', helper: 'Tạo phiếu nhập', icon: <FileInput size={18} />, page: 'import-create' as PageKey, enabled: canImport },
    { label: 'Dự báo AI', helper: 'Xem rủi ro 30 ngày', icon: <LineChart size={18} />, page: 'ai-forecast' as PageKey, enabled: true },
    { label: 'Gợi ý nhập', helper: 'SKU cần đặt hàng', icon: <PackageOpen size={18} />, page: 'purchase-suggestions' as PageKey, enabled: true },
  ];
  return (
    <Card>
      <CardHeader title="Hành động nhanh" description="Đi tới nghiệp vụ đang dùng nhiều nhất" />
      <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={!action.enabled}
            onClick={() => setPage(action.page)}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">{action.icon}</span>
              <span>
                <span className="block text-sm font-bold text-slate-900">{action.label}</span>
                <span className="text-xs text-slate-400">{action.helper}</span>
              </span>
            </span>
            <ArrowUpRight size={16} className="text-slate-400" />
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage({
  authUser,
  openProduct,
  setPage,
  productsList,
  invoicesList,
}: DashboardProps) {
  const [summary, setSummary] = React.useState<DashboardSummaryDto | null>(null);
  const [inventorySummary, setInventorySummary] = React.useState<InventorySummary | null>(null);
  const [alerts, setAlerts] = React.useState<InventoryAlertDto[]>([]);
  const [forecastSummary, setForecastSummary] = React.useState<{ itemsWithForecast?: number; highRiskCount?: number } | null>(null);
  const [chartData, setChartData] = React.useState<Array<{ day: string; revenue: number }>>([]);
  const [salesRows, setSalesRows] = React.useState<SalesReportDto[]>([]);
  const [bestsellers, setBestsellers] = React.useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const role = normalizeRole(authUser.role);
  const isManagerOrAdmin = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  const canImport = canAccessPage(authUser.role, 'import-create');

  React.useEffect(() => {
    if (!isManagerOrAdmin) return;
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    Promise.allSettled([
      fetchDashboardSummary(),
      fetchInventorySummary(),
      fetchInventoryAlerts(),
      fetchDashboardForecastSummary(),
      fetchDashboardRevenue(),
      fetchSalesReport(from, to, 'DAY'),
    ]).then(([summaryRes, inventoryRes, alertsRes, forecastRes, revenueRes, salesRes]) => {
      setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value : null);
      setInventorySummary(inventoryRes.status === 'fulfilled' ? inventoryRes.value : null);
      setAlerts(alertsRes.status === 'fulfilled' ? alertsRes.value.filter((a) => !a.resolved) : []);
      setForecastSummary(forecastRes.status === 'fulfilled' ? forecastRes.value : null);
      setChartData(
        revenueRes.status === 'fulfilled'
          ? revenueRes.value.map((row) => ({ day: formatWeekdayLabel(row.day), revenue: Number(row.revenue) }))
          : []
      );
      const sales = salesRes.status === 'fulfilled' ? salesRes.value : [];
      setSalesRows(sales);
      const top = sales.flatMap((row) => row.topProducts ?? []);
      const mapped = top.slice(0, 8).map((t) => {
        const existing = productsList.find((p) => String(p.key) === String(t.itemId));
        return (
          existing ??
          ({
            key: String(t.itemId),
            name: t.itemName,
            sku: t.itemCode,
            price: Number(t.revenue),
            stock: Number(t.quantitySold),
            sold: Number(t.quantitySold),
            category: '',
            categoryId: 0,
            cost: 0,
            supplier: '-',
            status: 'Còn hàng',
            expiry: '-',
            purchaseRatio: 1,
            minimumStock: 0,
          } as Product)
        );
      });
      setBestsellers(mapped.length > 0 ? mapped : productsList.slice(0, 6));
    });
  }, [isManagerOrAdmin, productsList, refreshKey]);

  const todayRevenue =
    typeof summary?.todayRevenue === 'number'
      ? summary.todayRevenue
      : invoicesList.reduce((sum, inv) => sum + numberFrom(inv.amount), 0);
  const todayOrders = typeof summary?.todayOrders === 'number' ? summary.todayOrders : invoicesList.length;
  const grossProfit = numberFrom(summary?.todayGrossProfit);
  const totalAvailable = inventorySummary?.totalAvailable ?? productsList.reduce((sum, p) => sum + numberFrom(p.stock), 0);
  const lowStock = inventorySummary?.lowStockRows ?? productsList.filter((p) => p.stock > 0 && p.stock <= p.minimumStock).length;
  const outOfStock = inventorySummary?.outOfStockRows ?? productsList.filter((p) => p.stock === 0).length;
  const nearExpiry = inventorySummary?.nearExpiryRows ?? numberFrom(summary?.nearExpiryCount);
  const unresolvedAlerts = alerts.length;
  const forecastRisk = numberFrom(forecastSummary?.highRiskCount);
  const inventoryHealth = Math.max(0, Math.min(100, 100 - Math.round(((lowStock + outOfStock + nearExpiry) / Math.max(productsList.length, 1)) * 100)));

  const stats: StatItem[] = [
    { label: 'Doanh thu hôm nay', value: money(todayRevenue), helper: `${formatQty(todayOrders)} đơn`, tone: 'emerald', icon: <TrendingUp size={19} />, progress: Math.min(100, Math.round(todayRevenue / 1_000_000)) },
    { label: 'Lợi nhuận gộp', value: grossProfit > 0 ? money(grossProfit) : 'Đang tính', helper: 'Hôm nay', tone: 'blue', icon: <BarChart3 size={19} />, progress: grossProfit > 0 && todayRevenue > 0 ? Math.round((grossProfit / todayRevenue) * 100) : 0 },
    { label: 'Tồn khả dụng', value: formatQty(totalAvailable), helper: `${inventorySummary?.inventoryRows ?? productsList.length} dòng tồn`, tone: 'purple', icon: <Warehouse size={19} />, progress: inventoryHealth },
    { label: 'Cảnh báo tồn', value: formatQty(unresolvedAlerts), helper: 'Chưa xử lý', tone: unresolvedAlerts > 0 ? 'red' : 'emerald', icon: <AlertTriangle size={19} />, progress: Math.min(100, unresolvedAlerts * 12) },
    { label: 'SKU thiếu hàng', value: formatQty(lowStock + outOfStock), helper: `${outOfStock} hết hàng`, tone: 'amber', icon: <Boxes size={19} />, progress: Math.min(100, (lowStock + outOfStock) * 10) },
    { label: 'Cận hạn', value: formatQty(nearExpiry), helper: 'Cần xả/hủy', tone: nearExpiry > 0 ? 'red' : 'emerald', icon: <CalendarClock size={19} />, progress: Math.min(100, nearExpiry * 12) },
  ];

  if (!isManagerOrAdmin) {
    return (
      <div className="space-y-4 rounded-2xl bg-slate-50/70 p-3">
        <DashboardHeader canImport={canImport} setPage={setPage} onRefresh={() => setRefreshKey((x) => x + 1)} totalAlerts={0} forecastRisk={0} />
        <OperationsPanel setPage={setPage} canImport={canImport} />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-slate-50/70 p-3">
      <DashboardHeader
        canImport={canImport}
        setPage={setPage}
        onRefresh={() => setRefreshKey((x) => x + 1)}
        totalAlerts={unresolvedAlerts}
        forecastRisk={forecastRisk}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => <StatTile key={item.label} item={item} />)}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.85fr]">
        <RevenuePanel chartData={chartData} salesRows={salesRows} />
        <RiskPanel alerts={alerts} inventorySummary={inventorySummary} forecastRisk={forecastRisk} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TopProductsPanel products={bestsellers.length > 0 ? bestsellers : productsList.slice(0, 6)} openProduct={openProduct} />
        <AlertsPanel alerts={alerts} setPage={setPage} />
      </div>

      <OperationsPanel setPage={setPage} canImport={canImport} />

      <Card className="overflow-hidden">
        <div className="grid gap-3 p-5 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 size={16} /> Sức khỏe kho</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{inventoryHealth}%</div>
            <div className="mt-1 text-xs text-slate-500">Tính từ thiếu hàng, hết hàng và cận date</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700"><Sparkles size={16} /> SKU có forecast</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{formatQty(forecastSummary?.itemsWithForecast)}</div>
            <div className="mt-1 text-xs text-slate-500">Dữ liệu hỗ trợ gợi ý nhập hàng</div>
          </div>
          <div className="rounded-xl bg-slate-100 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Clock3 size={16} /> Cập nhật</div>
            <div className="mt-2 text-2xl font-black text-slate-950">Realtime</div>
            <div className="mt-1 text-xs text-slate-500">Làm mới để kéo dữ liệu mới nhất</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
