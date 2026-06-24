import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Select, Modal, Input, InputNumber, message, Form, Space } from 'antd';
import {
  cancelTransferOrder,
  completeTransferOrder,
  createTransferOrder,
  fetchInventory,
  fetchLocations,
  fetchTransferOrders,
  fetchItems,
} from '@/services/wmsApi';
import type { ItemDto, LocationDto, TransferOrderDto } from '@/types/api';
import dayjs from 'dayjs';
import { Card, CardHeader } from '@/components/ui';
import { Trash2 } from 'lucide-react';

type LineForm = { itemId: number; lotId?: number; quantity: number };

export default function TransferOrdersPage() {
  const [orders, setOrders] = useState<TransferOrderDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [items, setItems] = useState<ItemDto[]>([]);
  const [inventory, setInventory] = useState<Awaited<ReturnType<typeof fetchInventory>>>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [lines, setLines] = useState<LineForm[]>([{ itemId: 0, quantity: 1 }]);
  const [fromLoc, setFromLoc] = useState<number>();
  const [toLoc, setToLoc] = useState<number>();
  const [note, setNote] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<TransferOrderDto | null>(null);

  const selectClass =
    "h-8 px-2 bg-white border border-slate-200 rounded text-sm text-slate-700 transition-all hover:border-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100";

  const load = async () => {
    setLoading(true);
    try {
      const [o, loc, it, inv] = await Promise.all([
        fetchTransferOrders(statusFilter !== 'ALL' ? statusFilter : undefined),
        fetchLocations(),
        fetchItems(),
        fetchInventory(),
      ]);
      setOrders(o);
      setLocations(loc);
      setItems(it);
      setInventory(inv);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCreate = async () => {
    if (!fromLoc || !toLoc) {
      message.warning('Chọn kho nguồn và kho đích');
      return;
    }
    const validLines = lines.filter((l) => l.itemId > 0 && l.quantity > 0);
    if (validLines.length === 0) {
      message.warning('Thêm ít nhất 1 dòng hàng');
      return;
    }
    try {
      await createTransferOrder({ fromLocationId: fromLoc, toLocationId: toLoc, note, items: validLines });
      message.success('Tạo phiếu chuyển kho thành công');
      setCreateOpen(false);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Tạo phiếu thất bại');
    }
  };

  const columns = [
    { title: 'Mã', dataIndex: 'id', render: (id: number) => `TR-${String(id).padStart(4, '0')}` },
    { title: 'Từ kho', dataIndex: 'fromLocationName' },
    { title: 'Đến kho', dataIndex: 'toLocationName' },
    { title: 'Ngày', dataIndex: 'transferDate', render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = { PENDING: 'processing', COMPLETED: 'success', CANCELLED: 'error' };
        const labels: Record<string, string> = { PENDING: 'Chờ xử lý', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy' };
        return <Tag color={colors[s]}>{labels[s] || s}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      render: (_: unknown, r: TransferOrderDto) => (
        <Space>
          <Button size="small" onClick={() => setSelectedOrder(r)}>Chi tiết</Button>
          {r.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" onClick={async () => {
                try {
                  await completeTransferOrder(r.id);
                  message.success('Chuyển kho thành công');
                  load();
                } catch (e: unknown) {
                  message.error(e instanceof Error ? e.message : 'Hoàn thành phiếu thất bại');
                }
              }}>Hoàn thành</Button>
              <Button size="small" danger onClick={async () => {
                try {
                  await cancelTransferOrder(r.id);
                  message.success('Đã hủy phiếu chuyển kho');
                  load();
                } catch (e: unknown) {
                  message.error(e instanceof Error ? e.message : 'Hủy phiếu thất bại');
                }
              }}>Hủy</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader title="Chuyển kho" description="Chuyển hàng giữa các vị trí kho (TRANSFER_OUT / TRANSFER_IN)"
        action={<Button type="primary" onClick={() => setCreateOpen(true)}>Tạo phiếu chuyển</Button>} />
      <div className="px-5 pb-5">
        <select className={`${selectClass} mb-4 w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Tất cả</option>
          <option value="PENDING">Chờ</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>
        <Table rowKey="id" loading={loading} dataSource={orders} columns={columns} />
      </div>

      <Modal 
        title={`Chi tiết chuyển kho TR-${String(selectedOrder?.id || 0).padStart(4, '0')}`} 
        open={!!selectedOrder} 
        onCancel={() => setSelectedOrder(null)} 
        footer={null} 
        width={700}
      >
        {selectedOrder && (
          <Table size="small" pagination={{ pageSize: 5 }} dataSource={selectedOrder.items} rowKey={(i) => `${i.itemId}-${i.lotId}`}
            columns={[
              { title: 'Sản phẩm', dataIndex: 'itemName' },
              { title: 'Lô', dataIndex: 'lotNumber', render: (v?: string) => v || '—' },
              { title: 'Số lượng', dataIndex: 'quantity' },
            ]} 
          />
        )}
      </Modal>
      <Modal title="Tạo phiếu chuyển kho" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreate} width={800}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold">Kho nguồn</label>
            <select className={`${selectClass} w-full mt-1`} value={fromLoc || ''} onChange={(e) => setFromLoc(Number(e.target.value) || undefined)}>
              <option value="" disabled>-- Chọn kho --</option>
              {locations.map((l) => (<option key={l.id} value={l.id}>{l.locationName}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Kho đích</label>
            <select className={`${selectClass} w-full mt-1`} value={toLoc || ''} onChange={(e) => setToLoc(Number(e.target.value) || undefined)}>
              <option value="" disabled>-- Chọn kho --</option>
              {locations.map((l) => (<option key={l.id} value={l.id}>{l.locationName}</option>))}
            </select>
          </div>
        </div>
        <Input.TextArea placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} className="mb-4" />
        {lines.map((line, idx) => {
          const availableItems = items.filter(i => inventory.some(inv => inv.locationId === fromLoc && inv.itemId === i.id && Number(inv.quantity) > 0));
          return (
          <div key={idx} className="flex gap-2 mb-2">
            <select className={`${selectClass} flex-1`} value={line.itemId || ''}
              onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, itemId: Number(e.target.value) || 0, lotId: undefined } : l))}>
              <option value="" disabled>-- Sản phẩm --</option>
              {availableItems.map((i) => (<option key={i.id} value={i.id}>{i.itemName}</option>))}
            </select>
            <select className={`${selectClass} w-48`} value={line.lotId || ''}
              onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, lotId: e.target.value ? Number(e.target.value) : undefined } : l))}>
              <option value="">-- Lô (nếu có) --</option>
              {inventory.filter((inv) => inv.itemId === line.itemId && inv.locationId === fromLoc && Number(inv.quantity) > 0)
                .map((inv) => (<option key={inv.lotId} value={inv.lotId || ''}>{inv.lotNumber || '—'} (Còn: {inv.quantity})</option>))}
            </select>
            <input type="number" min="1" className={`${selectClass} w-24`} value={line.quantity || ''}
              onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) || 1 } : l))} />
            <button type="button" className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center transition-colors rounded hover:bg-red-50" onClick={() => setLines(lines.filter((_, i) => i !== idx))}>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )})}
        <Button type="dashed" block onClick={() => setLines([...lines, { itemId: 0, quantity: 1 }])}>+ Thêm dòng</Button>
      </Modal>
    </Card>
  );
}
