import { Button } from 'antd';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { Card, StatusChip } from '@/components/ui';
import { fetchInventoryAlerts } from '@/services/wmsApi';
import type { InventoryAlertDto } from '@/types/api';
import type { Product } from '@/lib/itemMapper';
import type { PageKey } from '@/types/pages';

export default function InventoryAlertsPage({ setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const [alerts, setAlerts] = React.useState<InventoryAlertDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetchInventoryAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-muted">Đang tải cảnh báo…</p>;
  if (!alerts.length) return <p className="text-sm text-muted">Không có cảnh báo chưa xử lý.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {alerts.map((alert) => (
        <Card className="p-5 flex flex-col justify-between min-h-[210px] relative overflow-hidden" key={alert.id}>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <AlertTriangle className={alert.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-500'} />
              <StatusChip tone={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>{alert.alertType}</StatusChip>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{alert.itemName}</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">{alert.message}</p>
          </div>
          <Button className="w-full mt-3" type="primary" onClick={() => setPage('import-create')}>
            Tạo phiếu nhập đối tác
          </Button>
        </Card>
      ))}
    </div>
  );
}
