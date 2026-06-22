import { Button, message } from 'antd';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { Card, StatusChip } from '@/components/ui';
import { fetchInventoryAlerts, resolveInventoryAlert } from '@/services/wmsApi';
import type { InventoryAlertDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

function alertActionPage(alertType: string): PageKey {
  switch (alertType) {
    case 'NEAR_EXPIRY':
      return 'promotions';
    case 'OVERSTOCK':
      return 'promotions';
    case 'HIGH_RISK':
    case 'LOW_STOCK':
    default:
      return 'import-create';
  }
}

function alertActionLabel(alertType: string): string {
  switch (alertType) {
    case 'NEAR_EXPIRY':
      return 'Xem đề xuất KM';
    case 'OVERSTOCK':
      return 'Xử lý tồn dư';
    case 'HIGH_RISK':
    case 'LOW_STOCK':
    default:
      return 'Tạo phiếu nhập';
  }
}

export default function InventoryAlertsPage({ setPage }: { setPage: (page: PageKey) => void }) {
  const [alerts, setAlerts] = React.useState<InventoryAlertDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resolvingId, setResolvingId] = React.useState<number | null>(null);

  const loadAlerts = React.useCallback(() => {
    setLoading(true);
    fetchInventoryAlerts()
      .then(setAlerts)
      .catch(() => {
        setAlerts([]);
        message.error('Không tải được danh sách cảnh báo');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleResolve = async (alertId: number) => {
    setResolvingId(alertId);
    try {
      await resolveInventoryAlert(alertId);
      message.success('Đã đánh dấu cảnh báo đã xử lý');
      loadAlerts();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể cập nhật cảnh báo');
    } finally {
      setResolvingId(null);
    }
  };

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
            <p className="mt-1 text-xs text-slate-400 font-mono">{alert.itemCode}</p>
            <p className="mt-2 text-sm text-slate-500 font-medium">{alert.message}</p>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Button type="primary" block onClick={() => setPage(alertActionPage(alert.alertType))}>
              {alertActionLabel(alert.alertType)}
            </Button>
            <Button
              block
              loading={resolvingId === alert.id}
              onClick={() => handleResolve(alert.id)}
            >
              Đánh dấu đã xử lý
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
