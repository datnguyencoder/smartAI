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
        const expiryFromAlerts = unresolved.filter((a) => a.alertType === 'EXPIRY_RISK').length;
        const nearExpiry =
          typeof summary?.nearExpiryCount === 'number' ? summary.nearExpiryCount : expiryFromAlerts;
        setCounts({
          reorder: Array.isArray(recs) ? recs.length : 0,
          stockRisk,
          overstock,
          expiry: nearExpiry,
        });
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
          </>
        )}
        <UiButton variant="secondary" className="w-full" onClick={() => setPage('purchase-suggestions')}>
          Xem gợi ý nhập hàng
        </UiButton>
      </div>
    </Card>
  );
}
