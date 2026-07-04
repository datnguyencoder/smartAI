import * as React from 'react';
import { Alert, Button, Input, Progress, Steps, Table, Tag, Typography, message as antdMessage } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  FireOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  StockOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AiSummary } from '@/components/ai/AiSummary';
import { ForecastExplanation } from '@/components/ai/ForecastExplanation';
import SmartTooltip from '@/components/ai/SmartTooltip';
import { Card, CardHeader , Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/permissions';
import {
  fetchAiStatus,
  fetchForecastItemDetail,
  fetchForecastModelMetrics,
  fetchForecastResults,
  fetchSalesReport,
  fetchTrainJobStatus,
  runForecast,
  trainForecast,
} from '@/services/wmsApi';
import type { AiStatusDto, ForecastResultDto, TrainJobDto } from '@/types/api';
import type { Product } from '@/lib/itemMapper';
import type { PageKey } from '@/types/pages';

const { Text } = Typography;

type Props = {
  productsList: Product[];
  invoicesList: any[];
  setPage: (page: PageKey) => void;
};

const RISK_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  WARNING: '#f59e0b',
  OVERSTOCK: '#8b5cf6',
  OK: '#10b981',
};

const RISK_LABEL: Record<string, string> = {
  CRITICAL: 'Thiếu gấp',
  WARNING: 'Sắp thiếu',
  OVERSTOCK: 'Tồn dư',
  OK: 'Đủ tồn',
};

function modelTag(type?: string) {
  if (type === 'random_forest') return <Tag color="blue">Random Forest</Tag>;
  if (type === 'xgboost') return <Tag color="purple">XGBoost</Tag>;
  return <Tag>Moving Average</Tag>;
}

function riskTag(level?: ForecastResultDto['riskLevel']) {
  const color = RISK_COLOR[level ?? 'OK'];
  const label = RISK_LABEL[level ?? 'OK'];
  return <Tag color={level === 'CRITICAL' ? 'error' : level === 'WARNING' ? 'warning' : level === 'OVERSTOCK' ? 'purple' : 'success'}>{label}</Tag>;
}

type RiskFilter = 'ALL' | NonNullable<ForecastResultDto['riskLevel']>;

function formatQty(value?: number) {
  return Math.round(Number(value) || 0).toLocaleString('vi-VN');
}

function riskWeight(level?: ForecastResultDto['riskLevel']) {
  if (level === 'CRITICAL') return 4;
  if (level === 'WARNING') return 3;
  if (level === 'OVERSTOCK') return 2;
  return 1;
}

function calcCoverage(row?: ForecastResultDto) {
  const stock = Number(row?.stockOnHand) || 0;
  const need30 = Number(row?.pred30d) || 0;
  if (need30 <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((stock / need30) * 100)));
}

function getActionText(row?: ForecastResultDto) {
  if (!row) return 'Chọn một SKU trong bảng để xem đề xuất thao tác.';
  if (row.riskLevel === 'CRITICAL') return `Nhập bù khoảng ${formatQty(row.shortageQty)} đơn vị, ưu tiên trong hôm nay.`;
  if (row.riskLevel === 'WARNING') return `Lên kế hoạch nhập trong tuần, thiếu dự kiến ${formatQty(row.shortageQty)} đơn vị.`;
  if (row.riskLevel === 'OVERSTOCK') return `Tồn dư khoảng ${formatQty(row.surplusQty)} đơn vị, cân nhắc khuyến mãi/xả hàng.`;
  return 'Tồn kho đang ổn định, tiếp tục theo dõi biến động bán.';
}

function OperationalHint({ row }: { row?: ForecastResultDto }) {
  const color =
    row?.riskLevel === 'CRITICAL'
      ? 'border-red-200 bg-red-50 text-red-700'
      : row?.riskLevel === 'WARNING'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : row?.riskLevel === 'OVERSTOCK'
      ? 'border-purple-200 bg-purple-50 text-purple-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div className={`rounded-xl border px-4 py-3 ${color}`}>
      <div className="mb-1 flex items-center gap-2 text-sm font-bold">
        <DashboardOutlined />
        Hành động đề xuất
      </div>
      <p className="text-sm leading-5">{getActionText(row)}</p>
    </div>
  );
}

type RiskLaneProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  detail: string;
  tone: 'red' | 'amber' | 'purple' | 'emerald';
};

function RiskLane({ icon, label, value, total, detail, tone }: RiskLaneProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const toneClass = {
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[tone];
  const barClass = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold">
            {icon}
            {label}
          </div>
          <div className="mt-2 text-3xl font-black leading-none">{value}</div>
        </div>
        <div className="rounded-lg bg-white/70 px-2 py-1 text-xs font-bold">{pct}%</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/75">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(3, pct)}%` }} />
      </div>
      <div className="mt-2 text-xs font-medium opacity-80">{detail}</div>
    </div>
  );
}

function EmptyForecastPreview() {
  const rows = [
    { label: 'Dữ liệu bán hàng', value: '30 ngày', icon: <BarChartOutlined /> },
    { label: 'Tồn kho hiện tại', value: 'Realtime', icon: <DatabaseOutlined /> },
    { label: 'Dự báo SKU', value: '7/14/30 ngày', icon: <StockOutlined /> },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-extrabold text-slate-900">Luồng dữ liệu forecast</div>
          <div className="text-xs text-slate-500">Dữ liệu sẽ đi qua 3 lớp trước khi ra quyết định</div>
        </div>
        <ThunderboltOutlined className="text-lg text-emerald-600" />
      </div>
      <div className="grid gap-3">
        {rows.map((row, index) => (
          <div key={row.label} className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{row.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-800">{row.label}</div>
              <div className="text-xs text-slate-400">{row.value}</div>
            </div>
            <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500">{index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastKpiCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: 'emerald' | 'red' | 'amber' | 'purple' | 'blue';
}) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${toneClass}`}>
          {icon}
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">{helper}</span>
      </div>
      <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 break-words text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AiForecastPage({ productsList: _productsList, setPage }: Props) {
  const { authUser } = useAuth();
  const canOperateForecast = ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(normalizeRole(authUser?.role));
  const [loading, setLoading] = React.useState(false);
  const [trainJob, setTrainJob] = React.useState<TrainJobDto | null>(null);
  const trainPollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [results, setResults] = React.useState<ForecastResultDto[]>([]);
  const [aiStatus, setAiStatus] = React.useState<AiStatusDto | null>(null);
  const [modelMetrics, setModelMetrics] = React.useState<Record<string, unknown> | null>(null);
  const [revenueChart, setRevenueChart] = React.useState<Array<{ day: string; revenue: number; profit: number; orders: number }>>([]);
  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null);
  const [selectedItemName, setSelectedItemName] = React.useState<string>('');
  const [dailyChart, setDailyChart] = React.useState<Array<{ date: string; qty: number; confLow?: number; confHigh?: number }>>([]);
  const [lastForecastAt, setLastForecastAt] = React.useState<Date | undefined>();
  const [workflowStep, setWorkflowStep] = React.useState(0);
  const [forecastSearch, setForecastSearch] = React.useState('');
  const [riskFilter, setRiskFilter] = React.useState<RiskFilter>('ALL');

  const refreshStatus = React.useCallback(async () => {
    try {
      const [status, metrics] = await Promise.all([fetchAiStatus(), fetchForecastModelMetrics().catch(() => null)]);
      setAiStatus(status);
      setModelMetrics(metrics);
      if (status.modelLoaded) setWorkflowStep((s) => Math.max(s, 1));
      if ((status.totalForecasts ?? 0) > 0) setWorkflowStep(2);
    } catch {
      setAiStatus(null);
      setModelMetrics(null);
    }
  }, []);

  const refreshResults = React.useCallback(async () => {
    try {
      const r = await fetchForecastResults();
      setResults(r);
      if (r.length > 0) {
        const firstCritical = r.find((x) => x.riskLevel === 'CRITICAL') ?? r[0];
        const firstId = Number(firstCritical.itemId);
        if (!Number.isNaN(firstId)) {
          setSelectedItemId(firstId);
          setSelectedItemName(firstCritical.itemName ?? '');
          const detail = await fetchForecastItemDetail(firstId);
          setDailyChart(
            (detail.dailySeries || []).map((p) => ({
              date: new Date(p.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
              qty: Number(p.predictedQty),
              confLow: p.confidenceLow != null ? Number(p.confidenceLow) : undefined,
              confHigh: p.confidenceHigh != null ? Number(p.confidenceHigh) : undefined,
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
      .then((rows) =>
        setRevenueChart(
          rows.map((r) => ({
            day: new Date(r.period).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            revenue: Number(r.totalRevenue),
            profit: Number(r.grossProfit),
            orders: Number(r.totalOrders),
          }))
        )
      )
      .catch(() => setRevenueChart([]));
  }, [refreshResults, refreshStatus]);

  // Cleanup poll on unmount
  React.useEffect(() => {
    return () => {
      if (trainPollRef.current) clearInterval(trainPollRef.current);
    };
  }, []);

  const handleTrain = async () => {
    setLoading(true);
    setTrainJob(null);
    try {
      const { jobId } = await trainForecast();
      setTrainJob({ jobId, status: 'QUEUED', startedAt: new Date().toISOString() });

      trainPollRef.current = setInterval(async () => {
        try {
          const job = await fetchTrainJobStatus(jobId);
          setTrainJob(job);
          if (job.status === 'DONE') {
            clearInterval(trainPollRef.current!);
            trainPollRef.current = null;
            setLoading(false);
            setWorkflowStep(1);
            await refreshResults();
            await refreshStatus();
            antdMessage.success('Huấn luyện mô hình thành công — sẵn sàng chạy dự báo');
          } else if (job.status === 'FAILED') {
            clearInterval(trainPollRef.current!);
            trainPollRef.current = null;
            setLoading(false);
            antdMessage.error('Huấn luyện thất bại: ' + (job.errorMessage ?? 'lỗi không xác định'));
          }
        } catch {
          // keep polling on transient errors
        }
      }, 3000);
    } catch (e) {
      setLoading(false);
      antdMessage.error(e instanceof Error ? e.message : 'Không thể gửi yêu cầu huấn luyện');
    }
  };

  const loadItemChart = async (itemId: number, itemName?: string) => {
    setSelectedItemId(itemId);
    setSelectedItemName(itemName ?? '');
    try {
      const detail = await fetchForecastItemDetail(itemId);
      setDailyChart(
        (detail.dailySeries || []).map((p) => ({
          date: new Date(p.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          qty: Number(p.predictedQty),
          confLow: p.confidenceLow != null ? Number(p.confidenceLow) : undefined,
          confHigh: p.confidenceHigh != null ? Number(p.confidenceHigh) : undefined,
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
      setLastForecastAt(new Date());
      setWorkflowStep(2);
      antdMessage.success('Dự báo hoàn tất — xem biểu đồ và bảng kết quả bên dưới');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Dự báo thất bại — kiểm tra ai-service');
    } finally {
      setLoading(false);
    }
  };

  const formatTrainedAt = (iso?: string) => {
    if (!iso) return 'Chưa huấn luyện';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const critical = results.filter((r) => r.riskLevel === 'CRITICAL');
  const warning = results.filter((r) => r.riskLevel === 'WARNING');
  const overstock = results.filter((r) => r.riskLevel === 'OVERSTOCK');
  const ok = results.filter((r) => !r.riskLevel || r.riskLevel === 'OK');
  const selectedRow = results.find((r) => Number(r.itemId) === selectedItemId);
  const totalNeed30 = results.reduce((sum, r) => sum + (Number(r.pred30d) || 0), 0);
  const totalStock = results.reduce((sum, r) => sum + (Number(r.stockOnHand) || 0), 0);
  const totalShortage = results.reduce((sum, r) => sum + Math.max(0, Number(r.shortageQty) || 0), 0);
  const totalSurplus = results.reduce((sum, r) => sum + Math.max(0, Number(r.surplusQty) || 0), 0);
  const averageCoverage = totalNeed30 > 0 ? Math.round((totalStock / totalNeed30) * 100) : 100;
  const forecastFreshness = lastForecastAt
    ? lastForecastAt.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : aiStatus?.lastTrainedAt
    ? new Date(aiStatus.lastTrainedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Chưa có';

  const pieData = [
    { name: 'Thiếu gấp', value: critical.length, color: RISK_COLOR.CRITICAL },
    { name: 'Sắp thiếu', value: warning.length, color: RISK_COLOR.WARNING },
    { name: 'Tồn dư', value: overstock.length, color: RISK_COLOR.OVERSTOCK },
    { name: 'Đủ tồn', value: ok.length, color: RISK_COLOR.OK },
  ].filter((d) => d.value > 0);

  const priorityRows = [...results]
    .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'WARNING' || r.riskLevel === 'OVERSTOCK')
    .sort((a, b) => {
      const riskDiff = riskWeight(b.riskLevel) - riskWeight(a.riskLevel);
      if (riskDiff !== 0) return riskDiff;
      return (Number(b.shortageQty) || Number(b.surplusQty) || 0) - (Number(a.shortageQty) || Number(a.surplusQty) || 0);
    })
    .slice(0, 5);

  const barData = [...results]
    .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'WARNING')
    .sort((a, b) => (Number(b.shortageQty) || 0) - (Number(a.shortageQty) || 0))
    .slice(0, 8)
    .map((r) => ({
      name: (r.itemName ?? r.itemCode ?? '').slice(0, 18),
      stock: Math.round(Number(r.stockOnHand) || 0),
      need: Math.round(Number(r.pred30d) || 0),
      risk: r.riskLevel,
    }));

  const filteredResults = results.filter((row) => {
    const q = forecastSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      row.itemName?.toLowerCase().includes(q) ||
      row.itemCode?.toLowerCase().includes(q);
    const matchesRisk = riskFilter === 'ALL' || row.riskLevel === riskFilter || (!row.riskLevel && riskFilter === 'OK');
    return matchesSearch && matchesRisk;
  });

  const selectedStock = results.find((r) => Number(r.itemId) === selectedItemId)?.stockOnHand;
  const selectedCoverage = calcCoverage(selectedRow);
  const selectedDelta = selectedRow
    ? Math.round((Number(selectedRow.surplusQty) || 0) - (Number(selectedRow.shortageQty) || 0))
    : 0;
  const selectedDeltaLabel = selectedDelta < 0 ? `Thiếu ${formatQty(Math.abs(selectedDelta))}` : selectedDelta > 0 ? `Dư ${formatQty(selectedDelta)}` : 'Cân bằng';
  const decisionRows = [
    { label: 'Nhu cầu 7 ngày', value: formatQty(selectedRow?.pred7d), tone: 'text-slate-800' },
    { label: 'Nhu cầu 30 ngày', value: formatQty(selectedRow?.pred30d), tone: 'text-slate-800' },
    { label: 'Tồn hiện tại', value: formatQty(selectedRow?.stockOnHand), tone: 'text-slate-800' },
    {
      label: 'Chênh lệch',
      value: selectedDeltaLabel,
      tone: selectedDelta < 0 ? 'text-red-600' : selectedDelta > 0 ? 'text-purple-600' : 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-4 rounded-2xl bg-slate-50/80 p-3">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1.08fr_0.92fr] xl:p-6">
          <div className="flex min-h-[250px] flex-col justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                  <DashboardOutlined /> AI Demand Cockpit
                </span>
                <span className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${aiStatus?.aiOnline ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-red-50 text-red-700 ring-red-100'}`}>
                  {aiStatus?.aiOnline ? 'Online' : 'Offline'}
                </span>
                <span className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo ring-1 ring-indigo-100">
                  {aiStatus?.modelLoaded ? 'Model sẵn sàng' : 'Chưa có model'}
                </span>
              </div>
              <h2 className="max-w-2xl text-[28px] font-black leading-tight tracking-normal text-slate-950 md:text-[34px]">
                Điều phối tồn kho theo dự báo 30 ngày
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Gom rủi ro thiếu hàng, tồn dư và nhu cầu từng SKU vào một màn hình ra quyết định cho quản lý siêu thị.
              </p>
              <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
                <ForecastKpiCard icon={<ShoppingCartOutlined />} label="Cần nhập bù" value={formatQty(totalShortage)} helper="30 ngày" tone="red" />
                <ForecastKpiCard icon={<ExclamationCircleOutlined />} label="Tồn dư" value={formatQty(totalSurplus)} helper="Xả hàng" tone="purple" />
                <ForecastKpiCard icon={<DashboardOutlined />} label="Độ phủ TB" value={`${averageCoverage}%`} helper="Stock / Need" tone={averageCoverage < 55 ? 'red' : averageCoverage < 85 ? 'amber' : 'emerald'} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {canOperateForecast && (
                <>
                  <Button type="primary" icon={<CloudSyncOutlined />} loading={loading} onClick={handleTrain}>
                    Huấn luyện model
                  </Button>
                  <Button
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:!border-emerald-300 hover:!bg-emerald-100 hover:!text-emerald-800"
                    icon={<PlayCircleOutlined />}
                    loading={loading}
                    onClick={handleRun}
                    disabled={!aiStatus?.modelLoaded}
                  >
                    Chạy dự báo
                  </Button>
                </>
              )}
              <Button
                className="border-slate-200 bg-white text-slate-700 hover:!border-slate-300 hover:!text-slate-900"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={() => { refreshResults(); refreshStatus(); }}
              >
                Làm mới
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-4 text-slate-900 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                  <AppstoreOutlined /> SKU dự báo
                </div>
                <div className="mt-3 text-3xl font-extrabold">{results.length}</div>
                <div className="text-xs text-slate-500">{filteredResults.length} đang hiển thị</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-slate-900 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                  <ShoppingCartOutlined /> Thiếu dự kiến
                </div>
                <div className="mt-3 text-3xl font-extrabold text-red-600">{formatQty(totalShortage)}</div>
                <div className="text-xs text-slate-500">Đơn vị cần nhập bù</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-slate-900 shadow-sm">
                <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                  <span>Độ phủ</span>
                  <span>{averageCoverage}%</span>
                </div>
                <Progress
                  percent={Math.min(averageCoverage, 100)}
                  showInfo={false}
                  strokeColor={averageCoverage < 55 ? '#ef4444' : averageCoverage < 85 ? '#f59e0b' : '#10b981'}
                  trailColor="#e2e8f0"
                />
                <div className="mt-2 text-xs text-slate-500">Tồn / nhu cầu 30 ngày</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-slate-900 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                  <ClockCircleOutlined /> Cập nhật
                </div>
                <div className="mt-3 text-lg font-extrabold">{forecastFreshness}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  {modelTag(aiStatus?.modelType)}
                  <span>v{aiStatus?.aiVersion ?? '—'}</span>
                  {modelMetrics && typeof modelMetrics.mape === 'number' && (
                    <span>· MAPE {(modelMetrics.mape as number).toFixed(1)}%</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <Steps
                current={workflowStep}
                size="small"
                items={[
                  { title: 'Huấn luyện', description: 'Học dữ liệu bán', icon: <CloudSyncOutlined /> },
                  { title: 'Dự báo', description: 'Tính nhu cầu', icon: <PlayCircleOutlined /> },
                  { title: 'Điều phối', description: 'Nhập / xả', icon: <LineChartOutlined /> },
                ]}
              />
            </div>
          </div>
        </div>

        {(trainJob && (trainJob.status === 'QUEUED' || trainJob.status === 'RUNNING')) || !canOperateForecast || (canOperateForecast && !aiStatus?.modelLoaded) ? (
          <div className="border-t border-white/10 bg-white px-5 py-4 text-slate-900">
            {trainJob && (trainJob.status === 'QUEUED' || trainJob.status === 'RUNNING') && (
              <Alert
                type="info"
                message={<span><strong>Đang huấn luyện mô hình...</strong> <span className="text-sm text-slate-500">{trainJob.status === 'QUEUED' ? 'Đang xếp hàng' : 'Đang xử lý dữ liệu bán hàng'}</span></span>}
                showIcon
              />
            )}
            {!canOperateForecast && (
              <Alert type="info" showIcon message="Chế độ xem phân tích" description="Analyst xem kết quả dự báo. Huấn luyện/chạy dự báo dành cho Admin hoặc Manager." />
            )}
            {canOperateForecast && !aiStatus?.modelLoaded && !trainJob && (
              <Alert type="warning" showIcon message="Chưa huấn luyện model" description="Huấn luyện model trước khi chạy dự báo." />
            )}
          </div>
        ) : null}
      </section>

      {results.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Bản đồ rủi ro tồn kho</h3>
              <p className="text-sm text-slate-500">Tỷ trọng SKU theo mức ưu tiên xử lý sau lần dự báo gần nhất.</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">
              <div className="text-xs font-bold uppercase text-slate-400">Tổng nhu cầu 30 ngày</div>
              <div className="text-lg font-black text-slate-900">{formatQty(totalNeed30)}</div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <RiskLane icon={<FireOutlined />} label="Thiếu gấp" value={critical.length} total={results.length} tone="red" detail="Nhập ngay, nguy cơ mất doanh thu" />
            <RiskLane icon={<WarningOutlined />} label="Sắp thiếu" value={warning.length} total={results.length} tone="amber" detail="Đặt hàng trong tuần này" />
            <RiskLane icon={<ExclamationCircleOutlined />} label="Tồn dư" value={overstock.length} total={results.length} tone="purple" detail="Đề xuất khuyến mãi/xả hàng" />
            <RiskLane icon={<CheckCircleOutlined />} label="Ổn định" value={ok.length} total={results.length} tone="emerald" detail="Theo dõi định kỳ" />
          </div>
        </section>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden">
            <CardHeader
              title="Đường dự báo nhu cầu SKU"
              description={
                selectedItemId
                  ? `${selectedItemName || `SKU #${selectedItemId}`} · đường xanh là nhu cầu dự kiến, đường cam là tồn hiện tại`
                  : 'Chọn một SKU trong bảng ưu tiên để xem chi tiết'
              }
              action={selectedRow ? riskTag(selectedRow.riskLevel) : null}
            />
            <div className="h-[360px] px-3 pb-5">
              {dailyChart.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-400">
                  <div className="text-center">
                    <LineChartOutlined className="mb-2 text-3xl text-slate-300" />
                    <p>Chọn một SKU để xem dự báo ngày</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyChart} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="confBandTop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <ChartTooltip formatter={(val: number, name: string) => [val?.toFixed(1), name]} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" iconSize={8} />
                    {selectedStock != null && (
                      <ReferenceLine
                        y={Number(selectedStock)}
                        stroke="#f59e0b"
                        strokeDasharray="5 3"
                        label={{ value: `Tồn: ${Math.round(Number(selectedStock))}`, position: 'right', fontSize: 10, fill: '#f59e0b' }}
                      />
                    )}
                    <Area type="monotone" dataKey="confHigh" name="Khoảng tin cậy" stroke="none" fill="url(#confBandTop)" legendType="none" />
                    <Area type="monotone" dataKey="confLow" name="Giới hạn dưới" stroke="none" fill="#ffffff" fillOpacity={1} legendType="none" />
                    <Line type="monotone" dataKey="qty" name="SL dự báo" stroke="#006c49" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#006c49' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Quyết định nhanh" description="Tóm tắt hành động cho SKU đang chọn" />
            <div className="space-y-3 px-5 pb-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase text-slate-400">SKU đang phân tích</div>
                    <div className="mt-1 truncate text-lg font-extrabold">{selectedRow?.itemName ?? 'Chưa chọn SKU'}</div>
                    <div className="text-xs text-slate-400">{selectedRow?.itemCode ?? 'Chọn một SKU trong bảng ưu tiên'}</div>
                  </div>
                  {riskTag(selectedRow?.riskLevel)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {decisionRows.map((row) => (
                    <div key={row.label} className="rounded-xl bg-white px-3 py-3">
                      <div className="text-xs font-semibold text-slate-400">{row.label}</div>
                      <div className={`mt-1 text-base font-black ${row.tone}`}>{row.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-white/10 px-3 py-3">
                  <div className="mb-2 flex justify-between text-xs font-semibold text-slate-300">
                    <span>Độ phủ tồn kho</span>
                    <span>{selectedCoverage}%</span>
                  </div>
                  <Progress
                    percent={selectedCoverage}
                    showInfo={false}
                    strokeColor={selectedCoverage < 40 ? '#ef4444' : selectedCoverage < 80 ? '#f59e0b' : '#10b981'}
                    trailColor="rgba(255,255,255,0.16)"
                  />
                </div>
              </div>
              <OperationalHint row={selectedRow} />
            </div>
          </Card>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[460px_1fr]">
          <Card className="overflow-hidden">
            <CardHeader title="SKU ưu tiên xử lý" description="Chọn SKU để cập nhật biểu đồ và quyết định nhanh phía trên" />
            <div className="space-y-3 px-5 pb-5">
              <div className="space-y-2">
                {priorityRows.length === 0 ? (
                  <div className="rounded-xl border border-line py-8 text-center text-sm text-slate-400">Không có SKU cần ưu tiên</div>
                ) : (
                  priorityRows.map((row, index) => (
                    <button
                      key={row.itemId}
                      type="button"
                      onClick={() => loadItemChart(row.itemId, row.itemName)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        row.itemId === selectedItemId ? 'border-emerald-300 bg-emerald-50' : 'border-line bg-white hover:border-emerald-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span>
                            <span className="truncate text-sm font-semibold text-slate-800">{row.itemName}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-400">{row.itemCode}</div>
                        </div>
                        {riskTag(row.riskLevel)}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 px-2 py-2"><span className="text-slate-400">Tồn</span><strong className="block text-slate-700">{formatQty(row.stockOnHand)}</strong></div>
                        <div className="rounded-lg bg-slate-50 px-2 py-2"><span className="text-slate-400">Cần 30 ngày</span><strong className="block text-slate-700">{formatQty(row.pred30d)}</strong></div>
                        <div className="rounded-lg bg-slate-50 px-2 py-2"><span className="text-slate-400">Độ phủ</span><strong className="block text-slate-700">{calcCoverage(row)}%</strong></div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Áp lực cung ứng 30 ngày" description="So sánh tồn hiện tại với nhu cầu dự báo, ưu tiên SKU thiếu nhiều nhất" />
            <div className="mx-5 mb-3 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
              <div className="rounded-xl bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase text-slate-400">SKU thiếu</div>
                <div className="mt-1 text-2xl font-black text-red-600">{critical.length + warning.length}</div>
              </div>
              <div className="rounded-xl bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase text-slate-400">Cần nhập bù</div>
                <div className="mt-1 text-2xl font-black text-slate-900">{formatQty(totalShortage)}</div>
              </div>
              <div className="rounded-xl bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase text-slate-400">Có thể xả</div>
                <div className="mt-1 text-2xl font-black text-purple-600">{formatQty(totalSurplus)}</div>
              </div>
            </div>
            <div className="h-[394px] px-2 pb-5">
              {barData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-400">Không có SKU thiếu hàng</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 10, left: 8, right: 24, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf2f7" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <ChartTooltip formatter={(val: number, name: string) => [Number(val).toLocaleString('vi-VN'), name]} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="stock" name="Tồn hiện tại" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={14} />
                    <Bar dataKey="need" name="Nhu cầu 30 ngày" radius={[0, 4, 4, 0]} maxBarSize={14}>
                      {barData.map((entry, idx) => <Cell key={idx} fill={entry.risk === 'CRITICAL' ? '#ef4444' : '#f59e0b'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <Card>
            <CardHeader title="Phân bố rủi ro" description={`${results.length} SKU đã phân loại`} />
            <div className="h-[286px] px-3 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="48%" outerRadius={92} innerRadius={52} dataKey="value" labelLine={false} label={CustomPieLabel}>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <ChartTooltip formatter={(value: number, name: string) => [`${value} SKU`, name]} />
                  <Legend iconType="circle" iconSize={10} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Bảng điều phối theo SKU"
              description={`${filteredResults.length}/${results.length} SKU đang hiển thị, chọn dòng để mở dự báo ngày`}
              action={
                <div className="flex flex-wrap gap-2">
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Tìm SKU hoặc tên hàng"
                    className="w-[220px]"
                    value={forecastSearch}
                    onChange={(e) => setForecastSearch(e.target.value)}
                  />
                  <Select
                    className="w-[160px]"
                    value={riskFilter}
                    onChange={setRiskFilter}
                    suffixIcon={<FilterOutlined />}
                    options={[
                      { value: 'ALL', label: 'Tất cả rủi ro' },
                      { value: 'CRITICAL', label: 'Thiếu gấp' },
                      { value: 'WARNING', label: 'Sắp thiếu' },
                      { value: 'OVERSTOCK', label: 'Tồn dư' },
                      { value: 'OK', label: 'Ổn định' },
                    ]}
                  />
                </div>
              }
            />
            <Table
              size="small"
              pagination={{ pageSize: 8, showSizeChanger: false }}
              rowKey="itemId"
              dataSource={filteredResults}
              onRow={(row) => ({
                onClick: () => loadItemChart(row.itemId, row.itemName),
                className: `cursor-pointer transition-colors ${row.itemId === selectedItemId ? 'bg-emerald-50' : 'hover:bg-slate-50'}`,
              })}
              columns={[
                {
                  title: 'SKU / Sản phẩm',
                  dataIndex: 'itemName',
                  ellipsis: true,
                  render: (name, r) => (
                    <div className="min-w-[180px]">
                      <div className="font-semibold text-slate-800">{name}</div>
                      {r.itemCode && <div className="text-xs text-slate-400">{r.itemCode}</div>}
                    </div>
                  ),
                },
                {
                  title: 'Độ phủ',
                  dataIndex: 'stockOnHand',
                  width: 116,
                  render: (_, r) => {
                    const pct = calcCoverage(r);
                    return (
                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-400">Tồn</span>
                          <strong>{formatQty(r.stockOnHand)}</strong>
                        </div>
                        <Progress percent={pct} size="small" showInfo={false} strokeColor={pct < 40 ? '#ef4444' : pct < 80 ? '#f59e0b' : '#10b981'} trailColor="#e2e8f0" />
                      </div>
                    );
                  },
                },
                { title: 'Cần 30 ngày', dataIndex: 'pred30d', align: 'right' as const, render: (v) => <strong className="tabular-nums">{formatQty(v)}</strong> },
                { title: '7 ngày', dataIndex: 'pred7d', align: 'right' as const, responsive: ['lg' as const], render: (v) => <span className="text-sm tabular-nums text-slate-500">{formatQty(v)}</span> },
                {
                  title: 'Chênh lệch',
                  dataIndex: 'shortageQty',
                  align: 'right' as const,
                  render: (_, r) => {
                    const shortage = Math.round(Number(r.shortageQty) || 0);
                    const surplus = Math.round(Number(r.surplusQty) || 0);
                    if (shortage > 0) return <Text type="danger" className="font-bold tabular-nums">-{shortage.toLocaleString('vi-VN')}</Text>;
                    if (surplus > 0) return <Text className="font-bold tabular-nums text-purple-600">+{surplus.toLocaleString('vi-VN')}</Text>;
                    return <Text type="success">—</Text>;
                  },
                },
                { title: 'Rủi ro', dataIndex: 'riskLevel', render: (v) => riskTag(v as ForecastResultDto['riskLevel']) },
                {
                  title: 'Hành động',
                  dataIndex: 'recommendation',
                  responsive: ['xl' as const],
                  width: 240,
                  render: (_, r) => (
                    <div className="max-w-[240px] text-xs leading-5 text-slate-500">
                      {getActionText(r)}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}

      {results.length > 0 ? (
        <ForecastExplanation results={results} aiStatus={aiStatus} ranAt={lastForecastAt} />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1fr_400px]">
          <Card className="overflow-hidden border-emerald-100 shadow-sm">
            <div className="grid gap-5 border-b border-emerald-100 bg-white p-5 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                  <LineChartOutlined />
                  Sẵn sàng tạo forecast
                </div>
                <h3 className="text-2xl font-black text-slate-900">Chưa có kết quả để điều phối hàng</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Sau khi huấn luyện và chạy dự báo, hệ thống sẽ tạo bản đồ rủi ro, danh sách SKU ưu tiên, biểu đồ nhu cầu 30 ngày và đề xuất nhập/xả hàng.
                </p>
              </div>
              <EmptyForecastPreview />
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-lg text-emerald-700">
                  <CloudSyncOutlined />
                </div>
                <div className="font-bold text-slate-900">1. Huấn luyện model</div>
                <p className="mt-1 text-sm leading-5 text-slate-500">Dùng lịch sử bán hàng, tồn kho và biến động SKU để tạo model dự báo.</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-blue-100 text-lg text-blue-700">
                  <PlayCircleOutlined />
                </div>
                <div className="font-bold text-slate-900">2. Chạy forecast</div>
                <p className="mt-1 text-sm leading-5 text-slate-500">Sinh nhu cầu 7/14/30 ngày, khoảng tin cậy và phân loại rủi ro từng SKU.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-lg text-amber-700">
                  <ShoppingCartOutlined />
                </div>
                <div className="font-bold text-slate-900">3. Điều phối hàng</div>
                <p className="mt-1 text-sm leading-5 text-slate-500">Ưu tiên nhập bù hàng thiếu, giữ SKU ổn định và đề xuất xả hàng tồn dư.</p>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200">
            <CardHeader title="Tình trạng nguồn dữ liệu" description="Kiểm tra nhanh trước khi chạy AI" />
            <div className="space-y-3 px-5 pb-5">
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="text-sm font-medium text-slate-600">AI service</span>
                <Tag color={aiStatus?.aiOnline ? 'success' : 'error'}>{aiStatus?.aiOnline ? 'Online' : 'Offline'}</Tag>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Model</span>
                <Tag color={aiStatus?.modelLoaded ? 'blue' : 'warning'}>{aiStatus?.modelLoaded ? 'Sẵn sàng' : 'Chưa huấn luyện'}</Tag>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Lần train gần nhất</span>
                <span className="text-right text-xs font-semibold text-slate-500">{formatTrainedAt(aiStatus?.lastTrainedAt)}</span>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-500">
                Nút <strong>Chạy dự báo</strong> sẽ bật sau khi model sẵn sàng. Nếu AI service offline, kiểm tra backend kết nối với ai-service trước.
              </div>
            </div>
          </Card>
        </section>
      )}

      {results.length > 0 && (
        <>
          {/* Revenue + AI Summary */}
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
            <Card>
              <CardHeader
                title="Doanh thu & đơn hàng thực tế — 30 ngày"
                description="Dữ liệu đầu vào cho mô hình dự báo — phân tích xu hướng trước khi huấn luyện."
              />
              <div className="h-[320px] px-3 pb-5">
                {revenueChart.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    Chưa có dữ liệu doanh thu
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChart} margin={{ top: 14, right: 18, bottom: 6, left: 0 }}>
                      <defs>
                        <linearGradient id="forecastRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="forecastOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4648d4" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#4648d4" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <ChartTooltip content={<SmartTooltip />} />
                      <Legend iconType="circle" iconSize={8} />
                      <Area dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={2.5} fill="url(#forecastRevenue)" type="monotone" dot={false} />
                      <Line dataKey="profit" name="Lợi nhuận gộp" stroke="#f59e0b" strokeWidth={2} type="monotone" dot={false} />
                      <Area dataKey="orders" name="Đơn hàng" stroke="#4648d4" strokeWidth={2.5} fill="url(#forecastOrders)" type="monotone" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            <AiSummary setPage={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
