import { Button } from 'antd';
import { CalendarClock } from 'lucide-react';
import * as React from 'react';
import { Card, StatusChip } from '@/components/ui';
import { formatMoney as money, type Product } from '@/lib/itemMapper';
import { fetchNearExpiry } from '@/services/wmsApi';
import type { PageKey } from '@/types/pages';

export default function ExpiryRiskPage({ productsList: _productsList, setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const [items, setItems] = React.useState<Array<Product & { riskQty?: number; daysLeft?: number }>>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetchNearExpiry()
      .then((rows) => {
        const mapped = rows.map((row) => ({
          key: String(row.itemId),
          sku: row.itemCode,
          name: row.itemName,
          category: row.locationName,
          categoryId: 0,
          price: 0,
          cost: 0,
          stock: Math.round(Number(row.availableQuantity)),
          sold: 0,
          supplier: '-',
          status: 'Nguy cơ' as const,
          expiry: row.expiryDate ?? '—',
          purchaseRatio: 1,
          riskQty: row.riskQuantity != null ? Math.round(Number(row.riskQuantity)) : undefined,
          daysLeft: row.daysUntilExpiry,
        }));
        if (active) setItems(mapped);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <Card className="p-8 text-center text-muted">Đang tải danh sách cận hạn...</Card>;
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500">
        Không có mặt hàng cận hạn sử dụng (API trả về 0). Vào <Button type="link" className="p-0 h-auto" onClick={() => setPage('promotions')}>Đề xuất KM (AI)</Button> để tạo KM thủ công.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card className="p-5 flex flex-col justify-between min-h-[220px]" key={`${item.key}-${item.expiry}`}>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo shadow-[0_2px_8px_rgba(70,72,212,0.1)]">
                <CalendarClock size={20} />
              </div>
              <StatusChip tone={item.riskQty && item.riskQty > 0 ? 'warning' : 'success'}>
                {item.riskQty && item.riskQty > 0 ? 'Rủi ro tồn' : 'Cận hạn'}
              </StatusChip>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{item.name}</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              HSD: {item.expiry}
              {item.daysLeft != null ? ` · Còn ${item.daysLeft} ngày` : ''}
              · Tồn: {item.stock}
            </p>
            {item.riskQty != null && item.riskQty > 0 && (
              <p className="mt-1 text-sm font-semibold text-orange-600">
                Rủi ro tồn dư: ~{item.riskQty} đv (có thể không bán kịp)
              </p>
            )}
          </div>
          <Button className="w-full mt-3 font-semibold" type="primary" ghost onClick={() => setPage('promotions')}>
            Đề xuất KM (AI)
          </Button>
        </Card>
      ))}
    </div>
  );
}
