import * as React from 'react';
import { Alert, Button, Steps, Table, Tag, Typography, message as antdMessage } from 'antd';
import {
  CloudSyncOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AiSummary } from '@/components/ai/AiSummary';
import { ForecastExplanation } from '@/components/ai/ForecastExplanation';
import SmartTooltip from '@/components/ai/SmartTooltip';
import { Card, CardHeader } from '@/components/ui';
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

function modelTag(type?: string) {
  if (type === 'random_forest') return <Tag color="blue">RF</Tag>;
  if (type === 'xgboost') return <Tag color="purple">XGB</Tag>;
  return <Tag>MA</Tag>;
}

function riskTag(level?: ForecastResultDto['riskLevel']) {
  switch (level) {
    case 'CRITICAL':
      return <Tag color="error">Thiếu gấp</Tag>;
    case 'WARNING':
      return <Tag color="warning">Sắp thiếu</Tag>;
    case 'OVERSTOCK':
      return <Tag color="purple">Tồn dư</Tag>;
    default:
      return <Tag color="success">Đủ tồn</Tag>;
  }
}

export default function AiForecastPage({ productsList: _productsList, setPage }: Props) {
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
        const firstId = Number(r[0].itemId);
        if (!Number.isNaN(firstId)) {
          setSelectedItemId(firstId);
          setSelectedItemName(r[0].itemName ?? '');
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
      antdMessage.success('Dự báo hoàn tất — xem giải thích kết quả bên dưới');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Dự báo thất bại — kiểm tra ai-service');
    } finally {
      setLoading(false);
    }
  };

  const formatTrainedAt = (iso?: string) => {
    if (!iso) return 'Chưa huấn luyện';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Dự báo nhu cầu bán hàng"
          description="Huấn luyện mô hình ML từ lịch sử bán, sau đó dự báo số lượng cần cho từng SKU."
        />
        <div className="px-5 pb-5">
          <Steps
            current={workflowStep}
            size="small"
            className="mb-5 max-w-2xl"
            items={[
              { title: 'Huấn luyện', description: 'Học từ dữ liệu bán' },
              { title: 'Chạy dự báo', description: 'Tính nhu cầu SKU' },
              { title: 'Xem kết quả', description: 'Đọc bảng & biểu đồ' },
            ]}
          />

          <div className="mb-4 flex flex-wrap gap-2">
            <Tag color={aiStatus?.aiOnline ? 'success' : 'error'}>
              {aiStatus?.aiOnline ? 'Dịch vụ AI: Online' : 'Dịch vụ AI: Offline'}
            </Tag>
            <Tag color={aiStatus?.modelLoaded ? 'processing' : 'default'}>
              {aiStatus?.modelLoaded ? 'Đã có model' : 'Chưa có model'}
            </Tag>
            <Tag icon={<LineChartOutlined />}>Phiên bản {aiStatus?.aiVersion ?? '—'}</Tag>
            <Tag>{modelTag(aiStatus?.modelType)}</Tag>
          </div>

          <div className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span>
              Huấn luyện lần cuối: <strong>{formatTrainedAt(aiStatus?.lastTrainedAt)}</strong>
            </span>
            <span>
              SKU đã dự báo: <strong>{aiStatus?.totalForecasts ?? 0}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="primary" icon={<CloudSyncOutlined />} loading={loading} onClick={handleTrain}>
              Bước 1 — Huấn luyện
            </Button>
            <Button icon={<PlayCircleOutlined />} loading={loading} onClick={handleRun} disabled={!aiStatus?.modelLoaded}>
              Bước 2 — Chạy dự báo
            </Button>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={() => { refreshResults(); refreshStatus(); }}>
              Làm mới
            </Button>
          </div>

          {!aiStatus?.modelLoaded && (
            <Alert
              className="mt-4"
              type="warning"
              showIcon
              message="Chưa huấn luyện model"
              description="Nhấn «Bước 1 — Huấn luyện» trước khi chạy dự báo. Cần đủ lịch sử đơn bán trong hệ thống."
            />
          )}
        </div>
      </Card>

      {results.length > 0 && (
        <ForecastExplanation results={results} aiStatus={aiStatus} ranAt={lastForecastAt} />
      )}

      {results.length > 0 ? (
        <Card>
          <CardHeader title="Kết quả theo sản phẩm" description="So sánh tồn kho với nhu cầu 30 ngày — ưu tiên các dòng «Thiếu gấp»" />
          <Table
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowKey="itemId"
            dataSource={results}
            onRow={(row) => ({
              onClick: () => loadItemChart(row.itemId, row.itemName),
              className: row.itemId === selectedItemId ? 'bg-emerald-50 cursor-pointer' : 'cursor-pointer',
            })}
            columns={[
              {
                title: 'Sản phẩm',
                dataIndex: 'itemName',
                ellipsis: true,
                render: (name, r) => (
                  <div>
                    <div className="font-medium">{name}</div>
                    {r.itemCode && <div className="text-xs text-slate-400">{r.itemCode}</div>}
                  </div>
                ),
              },
              {
                title: 'Tồn hiện tại',
                dataIndex: 'stockOnHand',
                render: (v) => Math.round(Number(v) || 0).toLocaleString('vi-VN'),
              },
              {
                title: 'Cần 30 ngày',
                dataIndex: 'pred30d',
                render: (v) => <strong>{Math.round(Number(v) || 0).toLocaleString('vi-VN')}</strong>,
              },
              {
                title: 'Thiếu',
                dataIndex: 'shortageQty',
                render: (v) => {
                  const n = Math.round(Number(v) || 0);
                  return n > 0 ? <Text type="danger">{n.toLocaleString('vi-VN')}</Text> : '—';
                },
              },
              {
                title: 'Trạng thái',
                dataIndex: 'riskLevel',
                render: (v) => riskTag(v as ForecastResultDto['riskLevel']),
              },
              {
                title: 'Gợi ý',
                dataIndex: 'recommendation',
                ellipsis: true,
                width: 220,
              },
              {
                title: '7 ngày',
                dataIndex: 'pred7d',
                render: (v) => Math.round(Number(v) || 0).toLocaleString('vi-VN'),
              },
            ]}
          />
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Chưa có kết quả dự báo"
          description="Thực hiện Bước 1 (huấn luyện) rồi Bước 2 (chạy dự báo). Sau khi xong, hệ thống sẽ hiển thị bảng kết quả và phần giải thích chi tiết."
        />
      )}

      <Card>
        <CardHeader
          title="Biểu đồ dự báo 30 ngày"
          description={
            selectedItemId
              ? `${selectedItemName || `SKU #${selectedItemId}`} — đường xanh là số lượng dự kiến, vùng mờ là khoảng tin cậy`
              : 'Chọn một sản phẩm trong bảng phía trên'
          }
        />
        <div className="h-[320px] px-3 pb-5">
          {dailyChart.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted">
              Chưa có dữ liệu — chạy dự báo và chọn một SKU trong bảng
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Area type="monotone" dataKey="confHigh" name="Giới hạn trên" stroke="none" fill="#006c49" fillOpacity={0.12} />
                <Area type="monotone" dataKey="confLow" name="Giới hạn dưới" stroke="none" fill="#ffffff" fillOpacity={1} />
                <Line type="monotone" dataKey="qty" name="SL dự báo" stroke="#006c49" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader title="Doanh thu & đơn hàng thực tế" description="30 ngày gần nhất — dữ liệu đầu vào cho mô hình dự báo." />
          <div className="h-[360px] px-3 pb-5">
            {revenueChart.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted">Chưa có dữ liệu doanh thu</div>
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
                  <Area dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={3} fill="url(#forecastRevenue)" type="monotone" dot={false} />
                  <Area dataKey="orders" name="Đơn hàng" stroke="#4648d4" strokeWidth={3} fill="url(#forecastOrders)" type="monotone" dot={false} />
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
