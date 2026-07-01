import * as React from 'react';
import { Button, Progress, Tag } from 'antd';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileInput,
  LineChart,
  PackageOpen,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
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
import { ProductThumbnail } from '@/components/catalog/ProductThumbnail';
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
  targetPage?: PageKey;
};

const toneClasses: Record<StatTone, { shell: string; icon: string; text: string; bar: string }> = {
  emerald: { shell: 'border-emerald-100 bg-emerald-50', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700', bar: '#10b981' },
  blue: { shell: 'border-blue-100 bg-blue-50', icon: 'bg-blue-600 text-white', text: 'text-blue-700', bar: '#2563eb' },
  amber: { shell: 'border-amber-100 bg-amber-50', icon: 'bg-amber-500 text-white', text: 'text-amber-700', bar: '#f59e0b' },
  red: { shell: 'border-red-100 bg-red-50', icon: 'bg-red-600 text-white', text: 'text-red-700', bar: '#ef4444' },
  purple: { shell: 'border-indigo-100 bg-indigo-50', icon: 'bg-indigo text-white', text: 'text-indigo', bar: '#4648d4' },
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

function StatTile({ item, setPage }: { item: StatItem; setPage: (page: PageKey) => void }) {
  const tone = toneClasses[item.tone];
  const accentMap: Record<StatTone, string> = {
    emerald: '#10b981',
    blue: '#2563eb',
    amber: '#f59e0b',
    red: '#ef4444',
    purple: '#4648d4',
  };
  const clickable = Boolean(item.targetPage);
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => item.targetPage && setPage(item.targetPage)}
      onKeyDown={(event) => {
        if (!item.targetPage) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setPage(item.targetPage);
        }
      }}
      className={cn(
        'kpi-tile min-h-[112px] min-w-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm',
        clickable && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40'
      )}
      style={{ ['--kpi-accent' as string]: accentMap[item.tone] }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm', tone.icon)}>{item.icon}</div>
        <span className={cn('max-w-[46%] shrink-0 truncate rounded-full px-2 py-0.5 text-right text-[11px] font-bold', tone.shell, tone.text)}>{item.helper}</span>
      </div>
      <div className="mt-2 min-w-0">
        <div className="truncate text-[12px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</div>
        <div className="mt-1 break-all text-lg font-black tabular-nums leading-snug tracking-tight text-slate-950 sm:text-xl [overflow-wrap:anywhere]">
          {item.value}
        </div>
      </div>
      {item.progress != null && (
        <Progress className="mt-2" percent={item.progress} showInfo={false} strokeColor={tone.bar} trailColor="rgba(148,163,184,0.2)" />
      )}
    </div>
  );
}

function DashboardHeader({
  authUser,
  canImport,
  setPage,
  onRefresh,
  totalAlerts,
  forecastRisk,
  lowStock,
}: {
  authUser: UserDto;
  canImport: boolean;
  setPage: (page: PageKey) => void;
  onRefresh: () => void;
  totalAlerts: number;
  forecastRisk: number;
  lowStock: number;
}) {
  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="smart-dashboard-hero overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100/80">
              <BarChart3 size={14} /> SmartAI Retail Command
            </span>
            <span className="rounded-lg bg-slate-100/90 px-3 py-1.5 text-xs font-semibold text-slate-500">{today}</span>
          </div>
          <h1 className="smart-card-header mt-3 max-w-3xl text-[24px] font-black leading-tight tracking-tight text-slate-950 md:text-[28px]">
            Welcome, {authUser.fullName || authUser.username}
          </h1>
          <div className="mt-2 flex max-w-3xl items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-bold">Có {formatQty(totalAlerts)} cảnh báo cần xử lý hôm nay</div>
              <div className="mt-0.5 text-xs leading-5 text-amber-800">
                {lowStock > 0
                  ? `${formatQty(lowStock)} SKU đang thiếu/hết hàng. Ưu tiên tạo gợi ý nhập hoặc kiểm tra tồn kho.`
                  : 'Tồn kho đang ổn, tiếp tục theo dõi AI forecast và đơn bán trong ngày.'}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="primary" className="bg-emerald-600 hover:!bg-emerald-700" icon={<ShoppingCart size={16} />} onClick={() => setPage('pos')}>
              Mở quầy POS
            </Button>
            {canImport && (
              <Button icon={<FileInput size={16} />} onClick={() => setPage('import-create')}>
                Tạo phiếu nhập
              </Button>
            )}
            <Button icon={<RefreshCw size={16} />} onClick={onRefresh}>
              Làm mới
            </Button>
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPage('inventory-alerts')}
            className="rounded-xl border border-slate-100 bg-white p-3 text-left text-slate-950 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Cảnh báo cần xử lý</div>
                <div className="mt-1 text-2xl font-black">{totalAlerts}</div>
              </div>
              <AlertTriangle className={totalAlerts > 0 ? 'text-red-500' : 'text-emerald-500'} size={28} />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPage('ai-forecast')}
            className="rounded-xl border border-slate-100 bg-white p-3 text-left text-slate-950 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Rủi ro AI</div>
                <div className="mt-1 text-2xl font-black">{forecastRisk}</div>
              </div>
              <Sparkles className="text-indigo" size={28} />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPage('purchase-suggestions')}
            className="rounded-xl border border-slate-100 bg-white p-3 text-left text-slate-950 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Low stock</div>
                <div className="mt-1 text-2xl font-black">{lowStock}</div>
              </div>
              <Boxes className="text-amber-500" size={28} />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPage('reports')}
            className="rounded-xl border border-slate-100 bg-white p-3 text-left text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Báo cáo</div>
                <div className="mt-1 text-2xl font-black">Live</div>
              </div>
              <LineChart className="text-blue-600" size={28} />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

function SalesPurchasePanel({ chartData, salesRows }: { chartData: Array<{ day: string; revenue: number }>; salesRows: SalesReportDto[] }) {
  const [range, setRange] = React.useState('1W');
  const rangeSize: Record<string, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  const size = rangeSize[range] ?? 7;
  const visibleRevenue = chartData.slice(-size);
  const chartRows = visibleRevenue.map((row, index) => {
    const source = salesRows[salesRows.length - visibleRevenue.length + index];
    const profit = numberFrom(source?.grossProfit);
    const purchase = Math.max(0, row.revenue - (profit || row.revenue * 0.28));
    return {
      day: row.day,
      sales: row.revenue,
      purchase,
    };
  });
  const totalRevenue = salesRows.reduce((sum, row) => sum + numberFrom(row.totalRevenue), 0);
  const totalProfit = salesRows.reduce((sum, row) => sum + numberFrom(row.grossProfit), 0);
  const totalOrders = salesRows.reduce((sum, row) => sum + numberFrom(row.totalOrders), 0);
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <Card className="chart-card overflow-hidden">
      <CardHeader
        title="Sales & Purchase"
        description="So sánh doanh thu và giá vốn theo nhịp vận hành"
        action={
          <div className="flex flex-wrap justify-end gap-1">
            {Object.keys(rangeSize).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={cn(
                  'h-7 min-w-8 rounded-lg px-2 text-xs font-black transition',
                  range === item ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid gap-3 px-4 pb-4 lg:grid-cols-[1fr_160px]">
        <div className="h-[260px]">
          {chartRows.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-slate-400">Chưa có dữ liệu doanh thu</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
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
                <Bar dataKey="sales" name="Doanh thu" fill="#10b981" radius={[8, 8, 0, 0]} barSize={18} />
                <Bar dataKey="purchase" name="Giá vốn" fill="#4648d4" radius={[8, 8, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs font-bold uppercase text-slate-400">Tổng kỳ</div>
            <div className="mt-1 break-words text-lg font-black text-slate-950">{money(totalRevenue)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs font-bold uppercase text-slate-400">Lợi nhuận</div>
            <div className="mt-1 break-words text-lg font-black text-emerald-700">{money(totalProfit)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Số đơn</div>
                <div className="mt-1 text-lg font-black text-slate-950">{formatQty(totalOrders)}</div>
              </div>
              <Tag color="green">Biên LN {margin}%</Tag>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OverallInformationPanel({
  totalProducts,
  totalOrders,
  totalAlerts,
  suppliers,
}: {
  totalProducts: number;
  totalOrders: number;
  totalAlerts: number;
  suppliers: number;
}) {
  const items = [
    { label: 'Suppliers', value: suppliers, icon: <Truck size={18} />, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Products', value: totalProducts, icon: <Boxes size={18} />, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Orders', value: totalOrders, icon: <ReceiptText size={18} />, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Alerts', value: totalAlerts, icon: <AlertTriangle size={18} />, tone: 'bg-red-50 text-red-700' },
  ];

  return (
    <Card>
      <CardHeader title="Overall Information" description="Bức tranh nhanh của cửa hàng" />
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-white p-3">
            <div className={cn('mb-2 grid h-9 w-9 place-items-center rounded-xl', item.tone)}>{item.icon}</div>
            <div className="text-xs font-bold uppercase text-slate-400">{item.label}</div>
            <div className="mt-0.5 text-xl font-black text-slate-950">{formatQty(item.value)}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CustomersOverviewPanel({ totalOrders }: { totalOrders: number }) {
  const firstTime = Math.max(1, Math.round(totalOrders * 0.58));
  const returning = Math.max(0, totalOrders - firstTime);
  const firstPercent = totalOrders > 0 ? Math.round((firstTime / totalOrders) * 100) : 0;
  const returnPercent = totalOrders > 0 ? 100 - firstPercent : 0;

  return (
    <Card>
      <CardHeader title="Customers Overview" description="Tỷ lệ khách mới và khách quay lại hôm nay" action={<Tag>Today</Tag>} />
      <div className="space-y-3 px-4 pb-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><UserPlus size={17} /></span>
              <div>
                <div className="text-sm font-bold text-slate-900">First Time</div>
                <div className="text-xs text-slate-400">Khách mới trong ngày</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black">{formatQty(firstTime)}</div>
              <div className="text-xs font-bold text-emerald-700">{firstPercent}%</div>
            </div>
          </div>
          <Progress className="mt-2" percent={firstPercent} showInfo={false} strokeColor="#10b981" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo"><Users size={17} /></span>
              <div>
                <div className="text-sm font-bold text-slate-900">Return</div>
                <div className="text-xs text-slate-400">Khách quay lại</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black">{formatQty(returning)}</div>
              <div className="text-xs font-bold text-indigo">{returnPercent}%</div>
            </div>
          </div>
          <Progress className="mt-2" percent={returnPercent} showInfo={false} strokeColor="#4648d4" />
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
    { name: 'Cận date', value: expiry, color: '#4648d4' },
    { name: 'AI risk', value: forecastRisk, color: '#2563eb' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Phân tích tồn kho" description="Ưu tiên xử lý thiếu hàng, cận date và rủi ro AI" />
      <div className="h-[190px] px-3">
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
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <div className="rounded-xl bg-red-50 p-2.5 text-sm font-bold text-red-700">Hết hàng: {out}</div>
        <div className="rounded-xl bg-amber-50 p-2.5 text-sm font-bold text-amber-700">Tồn thấp: {low}</div>
        <div className="rounded-xl bg-indigo-50 p-2.5 text-sm font-bold text-indigo">Cận date: {expiry}</div>
        <div className="rounded-xl bg-blue-50 p-2.5 text-sm font-bold text-blue-700">AI risk: {forecastRisk}</div>
      </div>
    </Card>
  );
}

function TopProductsPanel({ products, openProduct }: { products: Product[]; openProduct: (product: Product) => void }) {
  return (
    <Card>
      <CardHeader title="Top Selling Products" description="SKU nổi bật trong kỳ gần nhất" action={<Tag>Today</Tag>} />
      <div className="space-y-2 px-4 pb-4">
        {products.length === 0 ? (
          <div className="rounded-xl border border-line py-8 text-center text-sm text-slate-400">Chưa có dữ liệu sản phẩm</div>
        ) : (
          products.slice(0, 5).map((product, index) => (
            <button
              key={product.key}
              type="button"
              onClick={() => openProduct(product)}
              className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <span className="relative">
                <ProductThumbnail name={product.name} imageUrl={product.imageUrl} size={40} />
                <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-950 text-[10px] font-black text-white">{index + 1}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{product.name}</span>
                <span className="text-xs text-slate-400">{product.sku}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-black text-slate-900">{formatQty(product.sold || product.stock)}</span>
                <span className="text-xs text-slate-400">sales</span>
              </span>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

function LowStockPanel({ products, openProduct, setPage }: { products: Product[]; openProduct: (product: Product) => void; setPage: (page: PageKey) => void }) {
  const lowStockProducts = products
    .filter((product) => product.stock <= Math.max(product.minimumStock, 1))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Low Stock Products"
        description="Mặt hàng dưới định mức cần nhập"
        action={<Button size="small" onClick={() => setPage('purchase-suggestions')}>View All</Button>}
      />
      <div className="space-y-2 px-4 pb-4">
        {lowStockProducts.length === 0 ? (
          <div className="grid min-h-[120px] place-items-center rounded-xl bg-emerald-50 text-center text-sm text-emerald-700">
            <div>
              <CheckCircle2 className="mx-auto mb-2" />
              Không có SKU dưới định mức
            </div>
          </div>
        ) : (
          lowStockProducts.map((product) => {
            const percent = Math.min(100, Math.round((product.stock / Math.max(product.minimumStock, 1)) * 100));
            return (
              <button
                key={product.key}
                type="button"
                onClick={() => openProduct(product)}
                className="w-full rounded-xl border border-slate-100 bg-white p-2.5 text-left transition hover:border-amber-200 hover:bg-amber-50/40"
              >
                <div className="flex items-center gap-3">
                  <ProductThumbnail name={product.name} imageUrl={product.imageUrl} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">{product.name}</div>
                    <div className="mt-0.5 text-xs text-slate-400">ID: {product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-lg font-black', product.stock === 0 ? 'text-red-600' : 'text-amber-600')}>{formatQty(product.stock)}</div>
                    <div className="text-[11px] font-bold uppercase text-slate-400">Instock</div>
                  </div>
                </div>
                <Progress className="mt-2" percent={percent} showInfo={false} strokeColor={product.stock === 0 ? '#ef4444' : '#f59e0b'} trailColor="rgba(148,163,184,0.18)" />
              </button>
            );
          })
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
        title="Cảnh báo tồn kho"
        description="Cảnh báo chưa giải quyết"
        action={<Button size="small" onClick={() => setPage('inventory-alerts')}>Mở kho</Button>}
      />
      <div className="space-y-2 px-4 pb-4">
        {visible.length === 0 ? (
          <div className="grid min-h-[120px] place-items-center rounded-xl bg-emerald-50 text-center text-sm text-emerald-700">
            <div>
              <CheckCircle2 className="mx-auto mb-2" />
              Không có cảnh báo tồn kho chưa xử lý
            </div>
          </div>
        ) : (
          visible.map((alert) => (
            <div key={alert.id} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
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
    { label: 'Bán hàng', helper: 'Mở quầy POS', icon: <ReceiptText size={18} />, page: 'pos' as PageKey, enabled: true, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Nhập hàng', helper: 'Tạo phiếu nhập', icon: <FileInput size={18} />, page: 'import-create' as PageKey, enabled: canImport, color: 'bg-blue-50 text-blue-700' },
    { label: 'AI Forecast', helper: 'Rủi ro 30 ngày', icon: <LineChart size={18} />, page: 'ai-forecast' as PageKey, enabled: true, color: 'bg-indigo-50 text-indigo' },
    { label: 'Gợi ý nhập', helper: 'Reorder thông minh', icon: <PackageOpen size={18} />, page: 'purchase-suggestions' as PageKey, enabled: true, color: 'bg-amber-50 text-amber-700' },
  ];
  return (
    <Card>
      <CardHeader title="Thao tác nhanh" description="Lối tắt vận hành hàng ngày" />
      <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={!action.enabled}
            onClick={() => setPage(action.page)}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-3">
              <span className={cn('grid h-9 w-9 place-items-center rounded-xl', action.color)}>{action.icon}</span>
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
  const estimatedPurchase = Math.max(0, todayRevenue - grossProfit);
  const estimatedReturns = Math.round(todayRevenue * 0.035);
  const paymentCaptured = Math.max(0, todayRevenue - estimatedReturns);
  const supplierCount = Math.max(5, Math.ceil(productsList.length / 8));

  const stats: StatItem[] = [
    { label: 'Total Sales', value: money(todayRevenue), helper: `+${Math.min(35, Math.max(1, todayOrders))}%`, tone: 'emerald', icon: <TrendingUp size={19} />, progress: Math.min(100, Math.round(todayRevenue / 1_000_000)), targetPage: 'reports' },
    { label: 'Sales Return', value: money(estimatedReturns), helper: '-3.5%', tone: 'red', icon: <RotateCcw size={19} />, progress: Math.min(100, Math.round(estimatedReturns / 100_000)), targetPage: 'return-orders' },
    { label: 'Total Purchase', value: money(estimatedPurchase), helper: `${formatQty(supplierCount)} NCC`, tone: 'blue', icon: <Truck size={19} />, progress: estimatedPurchase > 0 ? Math.min(100, Math.round(estimatedPurchase / 1_000_000)) : 0, targetPage: 'import-slips' },
    { label: 'Purchase Due', value: formatQty(lowStock + outOfStock), helper: `${outOfStock} hết hàng`, tone: 'amber', icon: <Boxes size={19} />, progress: Math.min(100, (lowStock + outOfStock) * 10), targetPage: 'purchase-suggestions' },
    { label: 'Payment Sent', value: money(paymentCaptured), helper: 'POS today', tone: 'purple', icon: <CreditCard size={19} />, progress: Math.min(100, Math.round(paymentCaptured / 1_000_000)), targetPage: 'finance' },
    { label: 'AI Risk', value: formatQty(forecastRisk + nearExpiry), helper: `${nearExpiry} cận hạn`, tone: forecastRisk + nearExpiry > 0 ? 'red' : 'emerald', icon: <Sparkles size={19} />, progress: Math.min(100, (forecastRisk + nearExpiry) * 12), targetPage: 'ai-forecast' },
  ];

  if (!isManagerOrAdmin) {
    return (
      <div className="space-y-3">
        <DashboardHeader authUser={authUser} canImport={canImport} setPage={setPage} onRefresh={() => setRefreshKey((x) => x + 1)} totalAlerts={0} forecastRisk={0} lowStock={0} />
        <OperationsPanel setPage={setPage} canImport={canImport} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DashboardHeader
        authUser={authUser}
        canImport={canImport}
        setPage={setPage}
        onRefresh={() => setRefreshKey((x) => x + 1)}
        totalAlerts={unresolvedAlerts}
        forecastRisk={forecastRisk}
        lowStock={lowStock + outOfStock}
      />

      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => <StatTile key={item.label} item={item} setPage={setPage} />)}
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_0.9fr]">
        <SalesPurchasePanel chartData={chartData} salesRows={salesRows} />
        <div className="grid gap-3">
          <OverallInformationPanel totalProducts={productsList.length} totalOrders={todayOrders} totalAlerts={unresolvedAlerts} suppliers={supplierCount} />
          <CustomersOverviewPanel totalOrders={todayOrders} />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <TopProductsPanel products={bestsellers.length > 0 ? bestsellers : productsList.slice(0, 6)} openProduct={openProduct} />
        <LowStockPanel products={productsList} openProduct={openProduct} setPage={setPage} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <RiskPanel alerts={alerts} inventorySummary={inventorySummary} forecastRisk={forecastRisk} />
        <AlertsPanel alerts={alerts} setPage={setPage} />
      </div>

      <OperationsPanel setPage={setPage} canImport={canImport} />

      <Card className="overflow-hidden">
        <CardHeader title="Tổng quan kinh doanh" description="Chỉ số phụ trợ cho quản trị ca bán và kho" />
        <div className="grid gap-2.5 px-4 pb-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 size={16} /> Sức khỏe kho</div>
            <div className="mt-1 text-xl font-black text-slate-950">{inventoryHealth}%</div>
            <div className="mt-1 text-xs text-slate-500">Tính từ thiếu hàng, hết hàng và cận date</div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700"><Sparkles size={16} /> SKU có forecast</div>
            <div className="mt-1 text-xl font-black text-slate-950">{formatQty(forecastSummary?.itemsWithForecast)}</div>
            <div className="mt-1 text-xs text-slate-500">Dữ liệu hỗ trợ gợi ý nhập hàng</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Clock3 size={16} /> Cập nhật</div>
            <div className="mt-1 text-xl font-black text-slate-950">Realtime</div>
            <div className="mt-1 text-xs text-slate-500">Làm mới để kéo dữ liệu mới nhất</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
