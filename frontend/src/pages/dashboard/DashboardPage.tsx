import * as React from 'react';
import { Button, Tag } from 'antd';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BrainCircuit,
  Building2,
  ChartNoAxesCombined,
  CheckCircle2,
  FileInput,
  Gauge,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { AiSummary } from '@/components/ai/AiSummary';
import SmartTooltip from '@/components/ai/SmartTooltip';
import { ProductsTable } from '@/components/catalog/ProductsTable';
import { Card, CardHeader, StatusChip } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { Product } from '@/lib/itemMapper';
import { canAccessPage, normalizeRole } from '@/lib/permissions';
import {
  fetchDashboardRevenue,
  fetchDashboardSummary,
  fetchInventoryAlerts,
  fetchSalesReport,
} from '@/services/wmsApi';
import type { DashboardSummaryDto, InventoryAlertDto, UserDto } from '@/types/api';
import type { PageKey } from '@/types/pages';
import { cn } from '@/lib/utils';

const VI_WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatWeekdayLabel(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return VI_WEEKDAY_LABELS[d.getDay()] ?? day.slice(5);
}

type DashboardProps = {
  authUser: UserDto;
  openProduct: (product: Product) => void;
  setPage: (page: PageKey) => void;
  productsList: Product[];
  invoicesList: any[];
};

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
  const [unresolvedAlertCount, setUnresolvedAlertCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!useApiSummary) return;
    fetchDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
    fetchInventoryAlerts()
      .then((list) => setUnresolvedAlertCount(list.filter((a) => !a.resolved).length))
      .catch(() => setUnresolvedAlertCount(null));
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
  const grossProfit = typeof summary?.todayGrossProfit === 'number' ? summary.todayGrossProfit : 0;
  const expiryRatio = typeof summary?.expiryRiskRatio === 'number' ? summary.expiryRiskRatio : 0;

  const items = [
    { label: 'Doanh thu thực tế', value: money(todayRevenue), delta: 'Hôm nay', icon: ChartNoAxesCombined, tone: 'emerald' },
    { label: 'Lợi nhuận gộp', value: money(grossProfit), delta: 'Hôm nay', icon: Gauge, tone: 'emerald' },
    { label: 'Đơn hàng hôm nay', value: todayOrders.toString(), delta: 'Hôm nay', icon: ShoppingCart, tone: 'indigo' },
    { label: 'Sắp hết hàng', value: lowStockCount.toString(), delta: 'Cần nhập', icon: AlertTriangle, tone: 'amber' },
    { label: 'Tỷ lệ HSD rủi ro', value: `${(expiryRatio * 100).toFixed(1)}%`, delta: 'Near expiry', icon: AlertTriangle, tone: 'red' },
    {
      label: 'Cảnh báo tồn',
      value: String(unresolvedAlertCount ?? lowStockCount + outOfStockCount),
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
            <Card
              className={cn(
                'interactive-card p-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-slate-300',
                item.tone === 'ai' &&
                  'border-indigo/40 shadow-[0_12px_36px_rgba(70,72,212,0.12)] bg-gradient-to-tr from-white to-indigo-50/20'
              )}
            >
              <div className="flex items-start justify-between relative z-10">
                <div
                  className={cn(
                    'grid h-11 w-11 place-items-center rounded-xl transition-all duration-300',
                    item.tone === 'emerald' && 'bg-emerald-50 text-primary shadow-[0_2px_10px_rgba(16,185,129,0.1)]',
                    item.tone === 'indigo' && 'bg-indigo-50 text-indigo shadow-[0_2px_10px_rgba(70,72,212,0.1)]',
                    item.tone === 'amber' && 'bg-amber-50 text-amber-600 shadow-[0_2px_10px_rgba(245,158,11,0.1)]',
                    item.tone === 'red' && 'bg-red-50 text-red-600 shadow-[0_2px_10px_rgba(186,26,26,0.1)]',
                    item.tone === 'ai' &&
                      'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_4px_14px_rgba(70,72,212,0.35)]'
                  )}
                >
                  <Icon size={20} className="transition-transform duration-300" />
                </div>
                <span
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-semibold',
                    item.delta.startsWith('+') || item.tone === 'emerald'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {item.delta}
                </span>
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
  const [chartData, setChartData] = React.useState<Array<{ day: string; revenue: number }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    fetchDashboardRevenue()
      .then((rows) => {
        setChartData(
          rows.map((r) => ({
            day: formatWeekdayLabel(r.day),
            revenue: Number(r.revenue) / 1_000_000,
          }))
        );
        setLoadError(false);
      })
      .catch(() => {
        setChartData([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="chart-card overflow-hidden hover:shadow-xl transition-all duration-300">
      <CardHeader
        title="Doanh thu 7 ngày gần nhất"
        description="Doanh thu thực tế từ đơn hàng đã hoàn tất."
        action={
          <Button type="text" className="hover:bg-slate-100 rounded-lg">
            ...
          </Button>
        }
      />
      <div className="h-[310px] px-3 pb-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Đang tải doanh thu…</div>
        ) : loadError ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">Không tải được dữ liệu doanh thu.</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Chưa có doanh thu trong 7 ngày.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 14, right: 18, bottom: 6, left: 0 }}>
              <defs>
                <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4648d4" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#4648d4" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
              <ChartTooltip content={<SmartTooltip />} cursor={{ fill: 'rgba(70, 72, 212, 0.04)', radius: 8 }} />
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
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function UrgentAlerts({ productsList: _productsList }: { productsList: Product[] }) {
  const [alerts, setAlerts] = React.useState<InventoryAlertDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchInventoryAlerts()
      .then((list) => {
        const unresolved = list
          .filter((a) => !a.resolved)
          .sort((a, b) => {
            if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
            if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;
            return 0;
          });
        setAlerts(unresolved.slice(0, 3));
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="Cảnh báo khẩn" description="Các vấn đề cần xử lý trước ca tối." />
      <div className="space-y-3 px-5 pb-5">
        {loading ? (
          <p className="text-sm text-muted py-4 text-center">Đang tải cảnh báo…</p>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4" key={alert.id}>
              <div className="flex items-center justify-between">
                <strong className="text-red-800">{alert.itemName}</strong>
                <Tag color={alert.severity === 'CRITICAL' ? 'red' : 'orange'}>{alert.alertType}</Tag>
              </div>
              <p className="mt-2 text-sm text-red-700">{alert.message}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <CheckCircle2 size={36} className="text-emerald text-center mb-2" />
            <span className="text-sm">Không có cảnh báo chưa xử lý.</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function IntegrationsStrip() {
  return (
    <Card>
      <CardHeader title="Tích hợp" description="Các kết nối bên thứ ba đang trong kế hoạch phát triển." />
      <div className="grid gap-3 px-5 pb-5 md:grid-cols-4">
        {['Momo Pay', 'Zalo OA', 'KiotViet', 'Google Sheets'].map((name) => (
          <div className="flex items-center justify-between rounded-xl border border-line bg-slate-50 px-4 py-3" key={name}>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-primary shadow-sm">
                <Building2 size={17} />
              </div>
              <strong className="text-sm font-semibold">{name}</strong>
            </div>
            <StatusChip tone="neutral">Sắp ra mắt</StatusChip>
          </div>
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
  const [bestsellers, setBestsellers] = React.useState<Product[]>([]);
  const role = normalizeRole(authUser.role);
  const isManagerOrAdmin = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  React.useEffect(() => {
    if (!isManagerOrAdmin) return;
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    fetchSalesReport(from, to, 'DAY')
      .then((rows) => {
        const top = rows[0]?.topProducts ?? [];
        const mapped = top.map((t) => {
          const existing = productsList.find((p) => String(p.key) === String(t.itemId));
          return (
            existing ??
            ({
              key: String(t.itemId),
              name: t.itemName,
              sku: t.itemCode,
              price: 0,
              stock: Number(t.quantitySold),
              category: '',
            } as Product)
          );
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
      <KpiGrid
        productsList={productsList}
        invoicesList={invoicesList}
        useApiSummary={isManagerOrAdmin}
      />
      {isManagerOrAdmin && (
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
