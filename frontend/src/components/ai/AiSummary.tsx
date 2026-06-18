import * as React from 'react';
import {
  CalendarOutlined,
  InboxOutlined,
  LineChartOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, CardHeader, StatusChip, UiButton } from '@/components/ui';
import {
  fetchDashboardSummary,
  fetchInventoryAlerts,
  fetchReorderRecommendations,
} from '@/services/wmsApi';
import type { InventoryAlertDto, ReorderRecommendationDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

type InsightRow = {
  label: string;
  hint: string;
  value: string;
  tone: 'warning' | 'danger' | 'neutral' | 'success';
  page: PageKey;
  icon: React.ReactNode;
};

export function AiSummary({ setPage }: { setPage: (page: PageKey) => void }) {
  const [loading, setLoading] = React.useState(true);
  const [counts, setCounts] = React.useState({
    reorder: 0,
    stockRisk: 0,
    overstock: 0,
    expiry: 0,
  });
  const [topReorders, setTopReorders] = React.useState<ReorderRecommendationDto[]>([]);
  const [topAlerts, setTopAlerts] = React.useState<InventoryAlertDto[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchReorderRecommendations().catch(() => []),
      fetchInventoryAlerts().catch(() => []),
      fetchDashboardSummary().catch(() => null),
    ])
      .then(([recs, alerts, summary]) => {
        if (cancelled) return;
        const unresolved = alerts.filter((a) => !a.resolved);
        const stockRisk = unresolved.filter(
          (a) => a.alertType === 'OUT_OF_STOCK' || a.alertType === 'LOW_STOCK'
        ).length;
        const overstock = unresolved.filter((a) => a.alertType === 'OVERSTOCK').length;
        const expiryFromAlerts = unresolved.filter((a) => a.alertType === 'EXPIRY_RISK' || a.alertType === 'NEAR_EXPIRY').length;
        const nearExpiry =
          typeof summary?.nearExpiryCount === 'number' ? summary.nearExpiryCount : expiryFromAlerts;
        setCounts({
          reorder: Array.isArray(recs) ? recs.length : 0,
          stockRisk,
          overstock,
          expiry: nearExpiry,
        });
        setTopReorders(Array.isArray(recs) ? recs.slice(0, 3) : []);
        setTopAlerts(
          unresolved
            .filter((a) =>
              ['OUT_OF_STOCK', 'LOW_STOCK', 'OVERSTOCK', 'EXPIRY_RISK', 'NEAR_EXPIRY'].includes(a.alertType)
            )
            .slice(0, 3)
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const insights: InsightRow[] = [
    {
      label: 'Cần nhập hàng',
      hint: 'SKU dưới mức tối thiểu',
      value: String(counts.reorder),
      tone: counts.reorder > 0 ? 'warning' : 'success',
      page: 'purchase-suggestions',
      icon: <ShoppingCartOutlined />,
    },
    {
      label: 'Nguy cơ hết hàng',
      hint: 'Cảnh báo tồn thấp / hết',
      value: String(counts.stockRisk),
      tone: counts.stockRisk > 0 ? 'danger' : 'success',
      page: 'inventory-alerts',
      icon: <WarningOutlined />,
    },
    {
      label: 'Tồn kho dư thừa',
      hint: 'Vượt ngưỡng tồn an toàn',
      value: String(counts.overstock),
      tone: counts.overstock > 0 ? 'warning' : 'neutral',
      page: 'inventory-alerts',
      icon: <InboxOutlined />,
    },
    {
      label: 'Sắp hết hạn',
      hint: 'Lô hàng gần HSD',
      value: String(counts.expiry),
      tone: counts.expiry > 0 ? 'warning' : 'success',
      page: 'expiry-risk',
      icon: <CalendarOutlined />,
    },
  ];

  const hasIssues = counts.reorder + counts.stockRisk + counts.overstock + counts.expiry > 0;
  const priorityLabel = (risk?: string) => {
    if (risk === 'HIGH') return 'Cao';
    if (risk === 'MEDIUM') return 'Vừa';
    return 'Theo dõi';
  };

  return (
    <Card>
      <CardHeader
        title="Gợi ý vận hành"
        description="Tổng hợp ưu tiên xử lý trong ngày từ dữ liệu tồn kho và dự báo."
        action={<LineChartOutlined className="text-lg text-indigo" />}
      />
      <div className="space-y-3 px-5 pb-5">
        {loading ? (
          <p className="py-4 text-center text-sm text-muted">Đang tải gợi ý…</p>
        ) : (
          <>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
              {hasIssues
                ? 'Có hạng mục cần chú ý — nhấn từng dòng để mở trang chi tiết và xử lý.'
                : 'Tồn kho ổn định, không có cảnh báo nghiêm trọng. Tiếp tục theo dõi dự báo định kỳ.'}
            </p>
            {insights.map(({ label, hint, value, tone, page, icon }) => (
              <button
                type="button"
                key={label}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-slate-50 px-3 py-3 text-left transition hover:border-indigo/20 hover:bg-indigo-50/50"
                onClick={() => setPage(page)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-indigo shadow-sm">
                    {icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-700">{label}</span>
                    <span className="block truncate text-xs text-slate-500">{hint}</span>
                  </span>
                </span>
                <StatusChip tone={tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'neutral'}>
                  {value}
                </StatusChip>
              </button>
            ))}
            {(topReorders.length > 0 || topAlerts.length > 0) && (
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ưu tiên hôm nay
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo hover:underline"
                    onClick={() => setPage('purchase-suggestions')}
                  >
                    Mở chi tiết
                  </button>
                </div>
                <div className="space-y-2">
                  {topReorders.map((rec) => (
                    <button
                      key={rec.itemId}
                      type="button"
                      className="block w-full rounded-md bg-slate-50 px-3 py-2 text-left transition hover:bg-indigo-50"
                      onClick={() => setPage('purchase-suggestions')}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-700">{rec.itemName}</span>
                        <StatusChip tone={rec.riskLevel === 'HIGH' ? 'danger' : rec.riskLevel === 'MEDIUM' ? 'warning' : 'neutral'}>
                          {priorityLabel(rec.riskLevel)}
                        </StatusChip>
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Đề xuất nhập {Math.ceil(Number(rec.suggestedQty) || 0).toLocaleString('vi-VN')} sp · {rec.source}
                      </span>
                      {rec.reason && <span className="mt-0.5 block truncate text-xs text-slate-400">{rec.reason}</span>}
                    </button>
                  ))}
                  {topAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      className="block w-full rounded-md bg-slate-50 px-3 py-2 text-left transition hover:bg-indigo-50"
                      onClick={() => setPage(alert.alertType === 'EXPIRY_RISK' || alert.alertType === 'NEAR_EXPIRY' ? 'expiry-risk' : 'inventory-alerts')}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-700">{alert.itemName}</span>
                        <StatusChip tone={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                          {alert.alertType}
                        </StatusChip>
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">{alert.message}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <UiButton variant="secondary" className="w-full" onClick={() => setPage('purchase-suggestions')}>
          Xem gợi ý nhập hàng
        </UiButton>
      </div>
    </Card>
  );
}
