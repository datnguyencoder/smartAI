import * as React from 'react';
import { Alert, Button, Progress, Steps, Table, Tag, Typography, message as antdMessage } from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  ExclamationCircleOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
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
import { Card, CardHeader } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/permissions';
import {
  fetchAiStatus,
  fetchForecastItemDetail,
  fetchForecastResults,
  fetchSalesReport,
  runForecast,
  trainForecast,
} from '@/services/wmsApi';
import type { AiStatusDto, ForecastResultDto } from '@/types/api';
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

type KpiCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  sub?: string;
};

function KpiCard({ icon, label, value, color, bg, sub }: KpiCardProps) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${bg}`}>
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-tight text-slate-800">{value}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400">{sub}</div>}
      </div>
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
  const [results, setResults] = React.useState<ForecastResultDto[]>([]);
  const [aiStatus, setAiStatus] = React.useState<AiStatusDto | null>(null);
  const [revenueChart, setRevenueChart] = React.useState<Array<{ day: string; revenue: number; orders: number }>>([]);
  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null);
  const [selectedItemName, setSelectedItemName] = React.useState<string>('');
  const [dailyChart, setDailyChart] = React.useState<Array<{ date: string; qty: number; confLow?: number; confHigh?: number }>>([]);
  const [lastForecastAt, setLastForecastAt] = React.useState<Date | undefined>();
  const [workflowStep, setWorkflowStep] = React.useState(0);

  const refreshStatus = React.useCallback(async () => {
    try {
      const status = await fetchAiStatus();
      setAiStatus(status);
      if (status.modelLoaded) setWorkflowStep((s) => Math.max(s, 1));
      if ((status.totalForecasts ?? 0) > 0) setWorkflowStep(2);
    } catch {
      setAiStatus(null);
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
              date: p.date.slice(5),
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
            day: r.period.slice(5),
            revenue: Number(r.totalRevenue),
            orders: Number(r.totalOrders),
          }))
        )
      )
      .catch(() => setRevenueChart([]));
  }, [refreshResults, refreshStatus]);

  const handleTrain = async () => {
    setLoading(true);
    try {
      await trainForecast();
      await refreshResults();
      await refreshStatus();
      setWorkflowStep(1);
      antdMessage.success('Huấn luyện mô hình thành công — sẵn sàng chạy dự báo');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Huấn luyện thất bại');
    } finally {
      setLoading(false);
    }
  };

  const loadItemChart = async (itemId: number, itemName?: string) => {
    setSelectedItemId(itemId);
    setSelectedItemName(itemName ?? '');
    try {
      const detail = await fetchForecastItemDetail(itemId);
      setDailyChart(
        (detail.dailySeries || []).map((p) => ({
          date: p.date.slice(5),
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

  // KPI aggregations
  const critical = results.filter((r) => r.riskLevel === 'CRITICAL');
  const warning = results.filter((r) => r.riskLevel === 'WARNING');
  const overstock = results.filter((r) => r.riskLevel === 'OVERSTOCK');
  const ok = results.filter((r) => !r.riskLevel || r.riskLevel === 'OK');

  // Risk pie data
  const pieData = [
    { name: 'Thiếu gấp', value: critical.length, color: RISK_COLOR.CRITICAL },
    { name: 'Sắp thiếu', value: warning.length, color: RISK_COLOR.WARNING },
    { name: 'Tồn dư', value: overstock.length, color: RISK_COLOR.OVERSTOCK },
    { name: 'Đủ tồn', value: ok.length, color: RISK_COLOR.OK },
  ].filter((d) => d.value > 0);

  // Top-10 shortage items for bar chart
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

  const selectedStock = results.find((r) => Number(r.itemId) === selectedItemId)?.stockOnHand;

  return (
    <div className="space-y-4">
      {/* Control Card */}
      <Card>
        <CardHeader
          title="Dự báo nhu cầu bán hàng — AI Forecast"
          description="Huấn luyện mô hình ML từ lịch sử bán, sau đó dự báo số lượng cần cho từng SKU trong 30 ngày tới."
        />
        <div className="px-5 pb-5">
          <Steps
            current={workflowStep}
            size="small"
            className="mb-5 max-w-2xl"
            items={[
              { title: 'Huấn luyện', description: 'Học từ dữ liệu bán', icon: <CloudSyncOutlined /> },
              { title: 'Chạy dự báo', description: 'Tính nhu cầu SKU', icon: <PlayCircleOutlined /> },
              { title: 'Xem kết quả', description: 'Đọc bảng & biểu đồ', icon: <LineChartOutlined /> },
            ]}
          />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Tag color={aiStatus?.aiOnline ? 'success' : 'error'} className="px-3 py-0.5 text-sm">
              {aiStatus?.aiOnline ? '🟢 AI Online' : '🔴 AI Offline'}
            </Tag>
            <Tag color={aiStatus?.modelLoaded ? 'processing' : 'default'}>
              {aiStatus?.modelLoaded ? '✅ Đã có model' : '⬜ Chưa có model'}
            </Tag>
            {modelTag(aiStatus?.modelType)}
            <Tag>v{aiStatus?.aiVersion ?? '—'}</Tag>
            <span className="ml-auto text-sm text-slate-500">
              Huấn luyện lần cuối: <strong>{formatTrainedAt(aiStatus?.lastTrainedAt)}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {canOperateForecast && (
              <>
                <Button type="primary" icon={<CloudSyncOutlined />} loading={loading} onClick={handleTrain}>
                  Bước 1 — Huấn luyện
                </Button>
                <Button
                  icon={<PlayCircleOutlined />}
                  loading={loading}
                  onClick={handleRun}
                  disabled={!aiStatus?.modelLoaded}
                >
                  Bước 2 — Chạy dự báo
                </Button>
              </>
            )}
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => { refreshResults(); refreshStatus(); }}
            >
              Làm mới
            </Button>
          </div>

          {!canOperateForecast && (
            <Alert
              className="mt-4"
              type="info"
              showIcon
              message="Chế độ xem phân tích"
              description="Vai trò Analyst: xem kết quả dự báo, biểu đồ và báo cáo. Huấn luyện/chạy dự báo dành cho Admin hoặc Manager."
            />
          )}
          {canOperateForecast && !aiStatus?.modelLoaded && (
            <Alert
              className="mt-4"
              type="warning"
              showIcon
              message="Chưa huấn luyện model"
              description="Nhấn «Bước 1 — Huấn luyện» trước khi chạy dự báo."
            />
          )}
        </div>
      </Card>

      {/* KPI Summary Cards */}
      {results.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<AlertOutlined />}
            label="Thiếu hàng gấp"
            value={critical.length}
            color="bg-red-100 text-red-600"
            bg="bg-red-50 border-red-100"
            sub="Cần nhập ngay hôm nay"
          />
          <KpiCard
            icon={<WarningOutlined />}
            label="Sắp thiếu hàng"
            value={warning.length}
            color="bg-amber-100 text-amber-600"
            bg="bg-amber-50 border-amber-100"
            sub="Nên đặt hàng trong tuần"
          />
          <KpiCard
            icon={<ExclamationCircleOutlined />}
            label="Tồn kho dư thừa"
            value={overstock.length}
            color="bg-purple-100 text-purple-600"
            bg="bg-purple-50 border-purple-100"
            sub="Cân nhắc khuyến mãi xả hàng"
          />
          <KpiCard
            icon={<CheckCircleOutlined />}
            label="Tồn kho ổn định"
            value={ok.length}
            color="bg-emerald-100 text-emerald-600"
            bg="bg-emerald-50 border-emerald-100"
            sub={`Tổng ${results.length} SKU đã dự báo`}
          />
        </div>
      )}

      {/* Forecast Explanation */}
      {results.length > 0 && (
        <ForecastExplanation results={results} aiStatus={aiStatus} ranAt={lastForecastAt} />
      )}

      {/* Risk Distribution + Bar Chart */}
      {results.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          {/* Pie */}
          <Card>
            <CardHeader
              title="Phân bố rủi ro"
              description={`${results.length} SKU đã phân loại`}
            />
            <div className="h-[280px] px-3 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="48%"
                    outerRadius={90}
                    innerRadius={44}
                    dataKey="value"
                    labelLine={false}
                    label={CustomPieLabel}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(value: number, name: string) => [`${value} SKU`, name]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Shortage Bar Chart */}
          <Card>
            <CardHeader
              title="Tồn kho vs Nhu cầu 30 ngày"
              description="Top SKU ưu tiên nhập hàng — cột xanh là tồn hiện tại, cột cam là nhu cầu dự báo"
            />
            <div className="h-[280px] px-2 pb-4">
              {barData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-400">
                  Không có SKU rủi ro nào
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      formatter={(val: number, name: string) => [val.toLocaleString('vi-VN'), name]}
                    />
                    <Legend iconType="square" iconSize={10} />
                    <Bar dataKey="stock" name="Tồn hiện tại" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={14} />
                    <Bar dataKey="need" name="Cần 30 ngày" radius={[0, 4, 4, 0]} maxBarSize={14}>
                      {barData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.risk === 'CRITICAL' ? '#ef4444' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Product Table */}
      {results.length > 0 ? (
        <Card>
          <CardHeader
            title="Kết quả theo sản phẩm"
            description="Nhấn vào một dòng để xem biểu đồ chi tiết theo ngày — ưu tiên các dòng «Thiếu gấp»"
          />
          <Table
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowKey="itemId"
            dataSource={results}
            onRow={(row) => ({
              onClick: () => loadItemChart(row.itemId, row.itemName),
              className: `cursor-pointer transition-colors ${row.itemId === selectedItemId ? 'bg-emerald-50' : 'hover:bg-slate-50'}`,
            })}
            columns={[
              {
                title: 'Sản phẩm',
                dataIndex: 'itemName',
                ellipsis: true,
                render: (name, r) => (
                  <div>
                    <div className="font-semibold text-slate-800">{name}</div>
                    {r.itemCode && <div className="text-xs text-slate-400">{r.itemCode}</div>}
                  </div>
                ),
              },
              {
                title: 'Tồn kho',
                dataIndex: 'stockOnHand',
                align: 'right' as const,
                render: (v, r) => {
                  const stock = Math.round(Number(v) || 0);
                  const need = Math.round(Number(r.pred30d) || 0);
                  const pct = need > 0 ? Math.min((stock / need) * 100, 100) : 100;
                  return (
                    <div className="min-w-[80px]">
                      <div className="mb-1 text-right text-sm font-medium">{stock.toLocaleString('vi-VN')}</div>
                      <Progress
                        percent={Math.round(pct)}
                        size="small"
                        showInfo={false}
                        strokeColor={pct < 40 ? '#ef4444' : pct < 80 ? '#f59e0b' : '#10b981'}
                        trailColor="#e2e8f0"
                      />
                    </div>
                  );
                },
              },
              {
                title: 'Cần 30 ngày',
                dataIndex: 'pred30d',
                align: 'right' as const,
                render: (v) => (
                  <strong className="tabular-nums">{Math.round(Number(v) || 0).toLocaleString('vi-VN')}</strong>
                ),
              },
              {
                title: '7 ngày',
                dataIndex: 'pred7d',
                align: 'right' as const,
                responsive: ['lg' as const],
                render: (v) => (
                  <span className="text-sm tabular-nums text-slate-500">
                    {Math.round(Number(v) || 0).toLocaleString('vi-VN')}
                  </span>
                ),
              },
              {
                title: 'Thiếu',
                dataIndex: 'shortageQty',
                align: 'right' as const,
                render: (v) => {
                  const n = Math.round(Number(v) || 0);
                  return n > 0 ? (
                    <Text type="danger" className="font-bold tabular-nums">
                      -{n.toLocaleString('vi-VN')}
                    </Text>
                  ) : (
                    <Text type="success">—</Text>
                  );
                },
              },
              {
                title: 'Trạng thái',
                dataIndex: 'riskLevel',
                render: (v) => riskTag(v as ForecastResultDto['riskLevel']),
              },
              {
                title: 'Gợi ý nhập',
                dataIndex: 'recommendation',
                ellipsis: true,
                responsive: ['xl' as const],
                width: 200,
                render: (v) => <span className="text-xs text-slate-500">{v}</span>,
              },
            ]}
          />
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          icon={<RiseOutlined />}
          message="Chưa có kết quả dự báo"
          description="Thực hiện Bước 1 (huấn luyện) rồi Bước 2 (chạy dự báo). Sau khi xong, hệ thống hiển thị bảng và biểu đồ phân tích đầy đủ."
        />
      )}

      {/* Daily Forecast Chart */}
      <Card>
        <CardHeader
          title="Biểu đồ dự báo theo ngày — 30 ngày tới"
          description={
            selectedItemId
              ? `${selectedItemName || `SKU #${selectedItemId}`} — đường xanh là số lượng dự kiến, vùng mờ là khoảng tin cậy 95%`
              : 'Chọn một sản phẩm trong bảng phía trên để xem chi tiết'
          }
        />
        <div className="h-[340px] px-3 pb-5">
          {dailyChart.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-slate-400">
              <div className="text-center">
                <LineChartOutlined className="mb-2 text-3xl text-slate-300" />
                <p>Chưa có dữ liệu — chạy dự báo và chọn một SKU trong bảng</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyChart} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006c49" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#006c49" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <ChartTooltip
                  formatter={(val: number, name: string) => [val?.toFixed(1), name]}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={8} />
                {selectedStock != null && (
                  <ReferenceLine
                    y={Number(selectedStock)}
                    stroke="#f59e0b"
                    strokeDasharray="5 3"
                    label={{ value: `Tồn: ${Math.round(Number(selectedStock))}`, position: 'right', fontSize: 10, fill: '#f59e0b' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="confHigh"
                  name="Giới hạn trên"
                  stroke="none"
                  fill="url(#confBand)"
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="confLow"
                  name="Giới hạn dưới"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="qty"
                  name="SL dự báo"
                  stroke="#006c49"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#006c49' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

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
                  <Area dataKey="orders" name="Đơn hàng" stroke="#4648d4" strokeWidth={2.5} fill="url(#forecastOrders)" type="monotone" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <AiSummary setPage={setPage} />
      </div>
    </div>
  );
}
