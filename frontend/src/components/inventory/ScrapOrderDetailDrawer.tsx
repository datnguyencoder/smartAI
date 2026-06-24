import * as React from 'react';
import { Modal, Button, Table, Typography } from 'antd';
import { StatusChip } from '@/components/ui';
import type { ScrapOrderDto } from '@/types/api';
import dayjs from 'dayjs';

const { Text } = Typography;

export type Props = {
  open: boolean;
  order: ScrapOrderDto | null;
  onClose: () => void;
};

export default function ScrapOrderDetailDrawer({ open, order, onClose }: Props) {
  if (!order) return null;

  const slipCode = `SCRAP-${order.id.toString().padStart(4, '0')}`;
  
  const statusLabelMap: Record<string, string> = {
    'PENDING': 'Chờ duyệt',
    'COMPLETED': 'Đã duyệt',
    'CANCELLED': 'Đã từ chối',
  };
  
  const displayStatus = statusLabelMap[order.status] || order.status;

  const itemColumns = [
    { title: 'Sản phẩm', dataIndex: 'itemName', key: 'itemName', className: 'text-xs', width: '40%' },
    { title: 'Lô hàng', dataIndex: 'lotNumber', key: 'lotNumber', render: (val: string) => val ? val : '—', className: 'text-xs' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', className: 'text-xs font-semibold' },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason', className: 'text-xs text-slate-500' },
  ];

  let totalItems = 0;
  let totalQuantity = 0;
  (order.items || []).forEach(item => {
    totalItems++;
    totalQuantity += item.quantity || 0;
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center justify-between mr-8 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-800">
              Chi tiết phiếu hủy: {slipCode}
            </span>
            <StatusChip tone={
              order.status === 'PENDING' ? 'warning' 
                : order.status === 'CANCELLED' ? 'danger' 
                  : 'success'
            }>
              {displayStatus}
            </StatusChip>
          </div>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={1100}
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 pt-3">
        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin chung</h4>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Kho xuất hủy:</span> 
              <span className="font-semibold text-slate-800">{order.locationName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Người tạo:</span> 
              <span className="font-medium text-slate-800">{order.createdByUsername || `ID: ${order.createdBy}`}</span>
            </div>
          </div>

          {/* Cột 2: Thời gian */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian</h4>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Ngày tạo:</span> 
              <span className="font-medium text-slate-800">{dayjs(order.scrapDate).format('DD/MM/YYYY HH:mm')}</span>
            </div>
          </div>

          {/* Cột 3: Ghi chú */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Ghi chú</h4>
            <div className="flex gap-2 flex-col">
              <span className="text-slate-500 w-24">Nội dung:</span> 
              <span className="text-slate-800 line-clamp-2">{order.note || '—'}</span>
            </div>
          </div>
        </div>

        {/* Thống kê nhanh phía trên bảng */}
        <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium">
          <div>Danh mục: <strong className="text-slate-800">{totalItems} mặt hàng</strong></div>
          <div>Tổng số lượng hủy: <strong className="text-slate-800">{totalQuantity} SP</strong></div>
        </div>

        {/* Bảng danh sách hàng hóa */}
        <div className="rounded-lg border border-slate-100 overflow-hidden">
          <Table
            dataSource={order.items || []}
            columns={itemColumns}
            rowKey="itemId"
            pagination={false}
            size="middle"
          />
        </div>
      </div>
    </Modal>
  );
}
