import type { PurchaseOrderDto } from '@/types/api';

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ nhận',
  COMPLETED: 'Đã nhận',
  CANCELLED: 'Đã hủy',
  PARTIALLY_RECEIVED: 'Nhận thiếu',
};

export type ImportSlipRow = {
  key: string;
  id: number;
  supplier: string;
  amount: number;
  status: string;
  statusRaw: string;
  time: string;
  locationName: string;
  items: PurchaseOrderDto['items'];
  canReceive: boolean;
  completedAt?: string;
  shortShipped?: boolean;
  shortReason?: string;
};

export function purchaseToSlip(po: PurchaseOrderDto): ImportSlipRow {
  const d = po.purchaseDate ? new Date(po.purchaseDate) : new Date();
  const canReceive = po.status === 'PENDING' || po.status === 'PARTIALLY_RECEIVED';
  return {
    key: `PN-${po.id}`,
    id: po.id,
    supplier: po.supplierName,
    amount: Math.round(Number(po.totalAmount)),
    status: statusLabel[po.status] ?? po.status,
    statusRaw: po.status,
    time: d.toLocaleDateString('vi-VN'),
    locationName: po.locationName,
    items: po.items ?? [],
    canReceive,
    completedAt: po.completedAt,
    shortShipped: po.shortShipped,
    shortReason: po.shortReason,
  };
}
