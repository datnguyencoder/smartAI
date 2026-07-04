import * as React from 'react';
import { Button, Checkbox, Drawer, Form, Input, InputNumber, ModalTable, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Plus, RotateCcw } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import {
  createReturnOrder,
  fetchOrderById,
  fetchOrdersPaged,
  fetchReturnOrders,
} from '@/services/wmsApi';
import type { OrderDto, OrderItemDto, ReturnOrderDto } from '@/types/api';

const statusColor: Record<string, string> = {
  COMPLETED: 'green',
  PENDING: 'gold',
  CANCELLED: 'red',
};

type ReturnLine = { itemId: number; itemName: string; lotId?: number; maxQty: number; checked: boolean; qty: number };

export default function ReturnOrdersPage() {
  const [orders, setOrders] = React.useState<ReturnOrderDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<ReturnOrderDto | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [sourceOrders, setSourceOrders] = React.useState<OrderDto[]>([]);
  const [sourceOrderId, setSourceOrderId] = React.useState<number | null>(null);
  const [returnLines, setReturnLines] = React.useState<ReturnLine[]>([]);
  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [form] = Form.useForm();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReturnOrders();
      setOrders(data ?? []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải được phiếu trả hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreate = async () => {
    setCreateOpen(true);
    setSourceOrderId(null);
    setReturnLines([]);
    setReason('');
    form.resetFields();
    try {
      const res = await fetchOrdersPaged(0, 50, undefined, 'COMPLETED');
      setSourceOrders(res.content ?? []);
    } catch {
      message.error('Không tải được hóa đơn');
    }
  };

  const selectSourceOrder = async (orderId: number) => {
    setSourceOrderId(orderId);
    try {
      const order = await fetchOrderById(orderId);
      const lines: ReturnLine[] = (order.items ?? []).map((it: OrderItemDto) => ({
        itemId: it.itemId ?? 0,
        itemName: it.itemName,
        lotId: it.lotId,
        maxQty: it.quantity,
        checked: false,
        qty: it.quantity,
      })).filter((l) => l.itemId > 0);
      setReturnLines(lines);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải chi tiết hóa đơn');
    }
  };

  const handleCreate = async () => {
    if (!sourceOrderId) {
      message.warning('Chọn hóa đơn gốc');
      return;
    }
    const items = returnLines
      .filter((l) => l.checked && l.qty > 0)
      .map((l) => ({ itemId: l.itemId, lotId: l.lotId, quantity: l.qty }));
    if (items.length === 0) {
      message.warning('Chọn ít nhất 1 sản phẩm để trả');
      return;
    }
    setSubmitting(true);
    try {
      await createReturnOrder({ originalOrderId: sourceOrderId, reason, items });
      message.success('Tạo phiếu trả hàng thành công');
      setCreateOpen(false);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Tạo phiếu trả thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'id', key: 'id', render: (id: number) => `#${id}` },
    { title: 'Hóa đơn gốc', dataIndex: 'originalOrderCode', key: 'originalOrderCode' },
    {
      title: 'Ngày trả',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hoàn tiền',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColor[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, row: ReturnOrderDto) => (
        <Button type="link" onClick={() => setSelected(row)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Phiếu trả hàng"
        description="Danh sách phiếu trả hàng từ quầy POS và hóa đơn."
        action={
          <div className="flex gap-2">
            <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>
              Tạo phiếu trả
            </Button>
            <Button icon={<RotateCcw size={14} />} onClick={load} loading={loading}>
              Làm mới
            </Button>
          </div>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
        pagination={{ pageSize: 15 }}
      />
      <Drawer
        title={`Phiếu trả #${selected?.id}`}
        open={!!selected}
        onClose={() => setSelected(null)}
        width={560}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <p><strong>Hóa đơn gốc:</strong> {selected.originalOrderCode}</p>
            <p><strong>Lý do:</strong> {selected.reason || '—'}</p>
            <p><strong>Hoàn tiền:</strong> {Number(selected.refundAmount).toLocaleString('vi-VN')} đ</p>
            <Table
              size="small"
              pagination={false}
              rowKey="itemId"
              dataSource={selected.items}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'itemName' },
                { title: 'SL', dataIndex: 'quantity', width: 60 },
                {
                  title: 'Thành tiền',
                  dataIndex: 'subtotal',
                  render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
                },
              ]}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title="Tạo phiếu trả hàng"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Hóa đơn gốc" required>
            <Select
              showSearch
              placeholder="Chọn hóa đơn đã hoàn thành"
              value={sourceOrderId ?? undefined}
              onChange={selectSourceOrder}
              options={sourceOrders.map((o) => ({
                value: o.id,
                label: `${o.orderCode} · ${o.customerName} · ${Number(o.totalAmount).toLocaleString('vi-VN')}đ`,
              }))}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Lý do trả hàng">
            <Input.TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Form.Item>
        </Form>
        {returnLines.length > 0 && (
          <Table
            size="small"
            pagination={false}
            rowKey={(r) => `${r.itemId}-${r.lotId ?? 0}`}
            dataSource={returnLines}
            columns={[
              {
                title: 'Chọn',
                width: 60,
                render: (_: unknown, row: ReturnLine, idx: number) => (
                  <Checkbox
                    checked={row.checked}
                    onChange={(e) => {
                      const next = [...returnLines];
                      next[idx] = { ...row, checked: e.target.checked };
                      setReturnLines(next);
                    }}
                  />
                ),
              },
              { title: 'Sản phẩm', dataIndex: 'itemName' },
              {
                title: 'SL trả',
                width: 100,
                render: (_: unknown, row: ReturnLine, idx: number) => (
                  <InputNumber
                    min={1}
                    max={row.maxQty}
                    value={row.qty}
                    disabled={!row.checked}
                    onChange={(v) => {
                      const next = [...returnLines];
                      next[idx] = { ...row, qty: Number(v) || 1 };
                      setReturnLines(next);
                    }}
                  />
                ),
              },
              { title: 'Tối đa', dataIndex: 'maxQty', width: 70 },
            ]}
          />
        )}
      </Modal>
    </Card>
  );
}
