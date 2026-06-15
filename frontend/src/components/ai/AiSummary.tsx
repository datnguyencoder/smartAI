import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, StatusChip, UiButton } from '@/components/ui';
import {
  fetchDashboardSummary,
  fetchInventoryAlerts,
  fetchReorderRecommendations,
} from '@/services/wmsApi';
import type { PageKey } from '@/types/pages';

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

  const insights: Array<{
    label: string;
    value: string;
    tone: 'warning' | 'danger' | 'ai' | 'neutral';
    page: PageKey;
  }> = [
    { label: 'Cần nhập hàng', value: String(counts.reorder), tone: 'warning', page: 'purchase-suggestions' },
    { label: 'Nguy cơ hết hàng', value: String(counts.stockRisk), tone: 'danger', page: 'inventory-alerts' },
    { label: 'Tồn kho dư thừa', value: String(counts.overstock), tone: 'ai', page: 'inventory-alerts' },
    { label: 'Sắp hết hạn', value: String(counts.expiry), tone: 'neutral', page: 'expiry-risk' },
  ];

  return (
    <Card className="border-t-4 border-t-indigo">
      <CardHeader title="Tóm tắt AI Forecast" description="Nhận diện ưu tiên vận hành trong ngày." action={<Sparkles className="text-indigo animate-pulse" size={22} />} />
      <div className="space-y-3 px-5 pb-5">
        {loading ? (
          <p className="text-sm text-muted py-4 text-center">Đang tải tóm tắt…</p>
        ) : (
          insights.map(({ label, value, tone, page }) => (
            <motion.div
              whileHover={{ x: 3 }}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 transition hover:bg-indigo-50/70 cursor-pointer"
              key={label}
              onClick={() => setPage(page)}
            >
              <span className="text-sm text-slate-600">{label}</span>
              <StatusChip tone={tone}>{value}</StatusChip>
            </motion.div>
          ))
        )}
        <UiButton variant="secondary" className="w-full" onClick={() => setPage('purchase-suggestions')}>
          Xem gợi ý nhập hàng
        </UiButton>
      </div>
    </Card>
  );
}
