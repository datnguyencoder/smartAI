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
        return <Tag color={colors[s]}>{s}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      render: (_: unknown, r: TransferOrderDto) => (
        <Space>
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
        <Select className="mb-4 w-40" value={statusFilter} onChange={setStatusFilter}
          options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'PENDING', label: 'Chờ' }, { value: 'COMPLETED', label: 'Hoàn thành' }]} />
        <Table rowKey="id" loading={loading} dataSource={orders} columns={columns}
          expandable={{
            expandedRowRender: (r) => (
              <Table size="small" pagination={false} dataSource={r.items} rowKey={(i) => `${i.itemId}-${i.lotId}`}
                columns={[
                  { title: 'Sản phẩm', dataIndex: 'itemName' },
                  { title: 'Lô', dataIndex: 'lotNumber', render: (v?: string) => v || '—' },
                  { title: 'SL', dataIndex: 'quantity' },
                ]} />
            ),
          }} />
      </div>
      <Modal title="Tạo phiếu chuyển kho" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreate} width={640}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold">Kho nguồn</label>
            <Select className="w-full mt-1" value={fromLoc} onChange={setFromLoc}
              options={locations.map((l) => ({ value: l.id, label: l.locationName }))} />
          </div>
          <div>
            <label className="text-xs font-semibold">Kho đích</label>
            <Select className="w-full mt-1" value={toLoc} onChange={setToLoc}
              options={locations.map((l) => ({ value: l.id, label: l.locationName }))} />
          </div>
        </div>
        <Input.TextArea placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} className="mb-4" />
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <Select className="flex-1" placeholder="Sản phẩm" value={line.itemId || undefined}
              onChange={(v) => setLines(lines.map((l, i) => i === idx ? { ...l, itemId: v } : l))}
              options={items.map((i) => ({ value: i.id, label: i.itemName }))} />
            <Select className="w-32" placeholder="Lô" allowClear value={line.lotId}
              onChange={(v) => setLines(lines.map((l, i) => i === idx ? { ...l, lotId: v } : l))}
              options={inventory.filter((inv) => inv.itemId === line.itemId && inv.locationId === fromLoc)
                .map((inv) => ({ value: inv.lotId, label: inv.lotNumber || '—' }))} />
            <InputNumber min={1} value={line.quantity}
              onChange={(v) => setLines(lines.map((l, i) => i === idx ? { ...l, quantity: Number(v) || 1 } : l))} />
          </div>
        ))}
        <Button type="dashed" block onClick={() => setLines([...lines, { itemId: 0, quantity: 1 }])}>+ Thêm dòng</Button>
      </Modal>
    </Card>
  );
}
