import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Select, Modal, Input, InputNumber, message, Form, Space } from 'antd';
import {
  cancelStocktake,
  confirmStocktake,
  createStocktake,
  fetchInventory,
  fetchLocations,
  fetchStocktakes,
} from '@/services/wmsApi';
import type { InventoryItemDto, LocationDto, StocktakeDto } from '@/types/api';
import dayjs from 'dayjs';
import { Card, CardHeader } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/permissions';

type DraftLine = { itemId: number; lotId?: number; itemName: string; lotNumber?: string; systemQty: number; actualQty: number };

export default function StocktakePage() {
  const { authUser } = useAuth();
  const canConfirm = ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(normalizeRole(authUser?.role));
  const [stocktakes, setStocktakes] = useState<StocktakeDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [inventory, setInventory] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [editCounts, setEditCounts] = useState<Record<string, number>>({});
  const [form] = Form.useForm();

  const lineKey = (itemId: number, lotId?: number) => `${itemId}-${lotId ?? 'null'}`;

  const load = async () => {
    setLoading(true);
    try {
      const [st, loc, inv] = await Promise.all([
        fetchStocktakes(statusFilter !== 'ALL' ? statusFilter : undefined),
        fetchLocations(),
        fetchInventory(),
      ]);
      setStocktakes(st);
      setLocations(loc);
      setInventory(inv);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const buildDraftLines = (locId: number): DraftLine[] =>
    inventory
      .filter((i) => i.locationId === locId)
      .map((i) => ({
        itemId: i.itemId,
        lotId: i.lotId,
        itemName: i.itemName,
        lotNumber: i.lotNumber,
        systemQty: Number(i.quantity),
        actualQty: Number(i.quantity),
      }));

  const handleLocationChange = (locId: number) => {
    setDraftLines(buildDraftLines(locId));
  };

  const handleCreate = async (values: { locationId: number; note?: string }) => {
    const items = draftLines.map((line) => ({
      itemId: line.itemId,
      lotId: line.lotId,
      actualQuantity: line.actualQty,
    }));
    if (items.length === 0) {
      message.warning('Kho này không có tồn kho để kiểm kê');
      return;
    }
    try {
      await createStocktake({ locationId: values.locationId, note: values.note, items });
      message.success('Tạo phiếu kiểm kê thành công');
      setCreateOpen(false);
      form.resetFields();
      setDraftLines([]);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Tạo phiếu thất bại');
    }
  };

  const handleConfirm = async (r: StocktakeDto) => {
    const prefix = `${r.id}-`;
    const items = r.items.map((line) => {
      const key = prefix + lineKey(line.itemId, line.lotId);
      const actualQuantity = editCounts[key] ?? Number(line.actualQuantity);
      return { itemId: line.itemId, lotId: line.lotId, actualQuantity };
    });
    try {
      await confirmStocktake(r.id, items);
      message.success('Đã xác nhận kiểm kê');
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Xác nhận thất bại');
    }
  };

  const columns = [
    { title: 'Mã', dataIndex: 'id', render: (id: number) => `ST-${String(id).padStart(4, '0')}` },
    { title: 'Kho', dataIndex: 'locationName' },
    { title: 'Ngày', dataIndex: 'stocktakeDate', render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = { DRAFT: 'processing', CONFIRMED: 'success', CANCELLED: 'error' };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: 'Chênh lệch',
      render: (_: unknown, r: StocktakeDto) => {
        const total = r.items.reduce((sum, i) => sum + Math.abs(Number(i.variance || 0)), 0);
        return total > 0 ? <Tag color="orange">{total} đv</Tag> : '—';
      },
    },
    {
      title: 'Thao tác',
      render: (_: unknown, r: StocktakeDto) => (
        <Space>
          {r.status === 'DRAFT' && (
            <>
              {canConfirm ? (
                <Button size="small" type="primary" onClick={() => handleConfirm(r)}>Xác nhận</Button>
              ) : (
                <Tag color="orange">Chờ quản lý xác nhận</Tag>
              )}
              {canConfirm && (
              <Button size="small" danger onClick={async () => {
                try {
                  await cancelStocktake(r.id);
                  message.success('Đã hủy');
                  load();
                } catch (e: unknown) {
                  message.error(e instanceof Error ? e.message : 'Hủy thất bại');
                }
              }}>Hủy</Button>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Kiểm kê kho"
        description="Nhập số đếm thực tế trước khi xác nhận — hệ thống tự tính chênh lệch tại thời điểm confirm"
        action={<Button type="primary" onClick={() => setCreateOpen(true)}>Tạo phiếu kiểm kê</Button>}
      />
      <div className="px-5 pb-5">
        <Select className="mb-4 w-40" value={statusFilter} onChange={setStatusFilter}
          options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'DRAFT', label: 'Nháp' }, { value: 'CONFIRMED', label: 'Đã xác nhận' }]} />
        <Table rowKey="id" loading={loading} dataSource={stocktakes} columns={columns}
          expandable={{
            expandedRowRender: (r) => (
              <Table size="small" pagination={false} dataSource={r.items} rowKey={(i) => `${i.itemId}-${i.lotId}`}
                columns={[
                  { title: 'Sản phẩm', dataIndex: 'itemName' },
                  { title: 'Lô', dataIndex: 'lotNumber', render: (v?: string) => v || '—' },
                  { title: 'Hệ thống', dataIndex: 'systemQuantity' },
                  {
                    title: 'Thực tế',
                    render: (_: unknown, line) => {
                      const key = `${r.id}-${lineKey(line.itemId, line.lotId)}`;
                      const value = editCounts[key] ?? Number(line.actualQuantity);
                      if (r.status !== 'DRAFT') return value;
                      return (
                        <InputNumber
                          min={0}
                          value={value}
                          onChange={(v) => setEditCounts((prev) => ({ ...prev, [key]: Number(v) || 0 }))}
                        />
                      );
                    },
                  },
                  {
                    title: 'Chênh lệch',
                    render: (_: unknown, line) => {
                      const key = `${r.id}-${lineKey(line.itemId, line.lotId)}`;
                      const actual = editCounts[key] ?? Number(line.actualQuantity);
                      const n = actual - Number(line.systemQuantity);
                      return <span className={n > 0 ? 'text-green-600' : n < 0 ? 'text-red-600' : ''}>{n}</span>;
                    },
                  },
                ]} />
            ),
          }} />
      </div>
      <Modal title="Tạo phiếu kiểm kê" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={720}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="locationId" label="Kho" rules={[{ required: true }]}>
            <Select
              options={locations.map((l) => ({ value: l.id, label: l.locationName }))}
              onChange={handleLocationChange}
            />
          </Form.Item>
          {draftLines.length > 0 && (
            <Table
              size="small"
              pagination={false}
              rowKey={(row) => lineKey(row.itemId, row.lotId)}
              dataSource={draftLines}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'itemName' },
                { title: 'Lô', dataIndex: 'lotNumber', render: (v?: string) => v || '—' },
                { title: 'Hệ thống', dataIndex: 'systemQty' },
                {
                  title: 'Thực tế',
                  render: (_: unknown, row: DraftLine) => (
                    <InputNumber
                      min={0}
                      value={row.actualQty}
                      onChange={(v) => setDraftLines((prev) =>
                        prev.map((line) => lineKey(line.itemId, line.lotId) === lineKey(row.itemId, row.lotId)
                          ? { ...line, actualQty: Number(v) || 0 }
                          : line))}
                    />
                  ),
                },
                {
                  title: 'Chênh lệch',
                  render: (_: unknown, row: DraftLine) => row.actualQty - row.systemQty,
                },
              ]}
            />
          )}
          <Form.Item name="note" label="Ghi chú" className="mt-4"><Input.TextArea rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" block disabled={draftLines.length === 0}>Tạo phiếu kiểm kê</Button>
        </Form>
      </Modal>
    </Card>
  );
}
