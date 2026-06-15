import * as React from 'react';
import { Alert, Button, Table, Tag, message as antdMessage } from 'antd';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AiSummary } from '@/components/ai/AiSummary';
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

type Props = {
  productsList: Product[];
  invoicesList: any[];
};

export default function AiForecastPage({ productsList: _productsList }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<ForecastResultDto[]>([]);
  const [aiStatus, setAiStatus] = React.useState<AiStatusDto | null>(null);
  const [revenueChart, setRevenueChart] = React.useState<Array<{ day: string; revenue: number; orders: number }>>([]);
  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null);
  const [dailyChart, setDailyChart] = React.useState<Array<{ date: string; qty: number; confLow?: number; confHigh?: number }>>([]);

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
    return d.toLocaleString('vi-VN', {
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
        <CardHeader title="Trạng thái AI" description="FastAPI ML service + backend orchestration" />
        <div className="px-5 pb-5 flex flex-wrap gap-4 items-center">
          <Tag color={aiStatus?.aiOnline ? 'success' : 'error'}>{aiStatus?.aiOnline ? 'AI Online' : 'AI Offline'}</Tag>
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
        <Button type="primary" loading={loading} onClick={handleTrain}>
          Huấn luyện AI
        </Button>
        <Button loading={loading} onClick={handleRun}>
          Chạy dự báo
        </Button>
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
              <ComposedChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Area type="monotone" dataKey="confHigh" name="CI trên (±σ)" stroke="none" fill="#006c49" fillOpacity={0.15} />
                <Area type="monotone" dataKey="confLow" name="CI dưới" stroke="none" fill="#ffffff" fillOpacity={1} />
                <Line type="monotone" dataKey="qty" name="SL dự báo" stroke="#006c49" strokeWidth={2} dot={false} />
              </ComposedChart>
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
                  <Area
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#forecastRevenue)"
                    type="monotone"
                    dot={false}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }}
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Area
                    dataKey="orders"
                    name="Đơn hàng"
                    stroke="#4648d4"
                    strokeWidth={3}
                    fill="url(#forecastOrders)"
                    type="monotone"
                    dot={false}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }}
                    isAnimationActive
                    animationDuration={1050}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <AiSummary setPage={() => {}} />
      </div>
    </div>
  );
}
