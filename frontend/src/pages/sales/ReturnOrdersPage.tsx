import * as React from 'react';
import { Button, Checkbox, Drawer, Form, Input, InputNumber, Modal, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Plus, RotateCcw } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import {
  createReturnOrder,
  fetchOrdersPaged,
  fetchReturnableOrderItems,
  fetchReturnOrders,
} from '@/services/wmsApi';
import type {
  OrderDto,
  ReturnHandlingAction,
  ReturnableOrderItemDto,
  ReturnOrderDto,
} from '@/types/api';

const statusColor: Record<string, string> = {
  COMPLETED: 'green',
  PENDING: 'gold',
  CANCELLED: 'red',
};

const handlingLabel: Record<ReturnHandlingAction, string> = {
  RESTOCK: 'Nhập lại kho',
  DISCARD: 'Hủy hàng',
};

type ReturnLine = {
  itemId: number;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  soldQuantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  estimatedRefund: number;
  checked: boolean;
  qty: number;
  handlingAction: ReturnHandlingAction;
};

function money(value?: number) {
  return `${Number(value ?? 0).toLocaleString('vi-VN')} đ`;
}

function estimatedLineRefund(row: ReturnLine) {
  const perUnitRefund = row.remainingQuantity > 0
    ? row.estimatedRefund / row.remainingQuantity
    : row.unitPrice;
  return perUnitRefund * row.qty;
}

export default function ReturnOrdersPage() {
  const [orders, setOrders] = React.useState<ReturnOrderDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<ReturnOrderDto | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [sourceOrders, setSourceOrders] = React.useState<OrderDto[]>([]);
  const [sourceOrderId, setSourceOrderId] = React.useState<number | null>(null);
  const [returnLines, setReturnLines] = React.useState<ReturnLine[]>([]);
  const [reason, setReason] = React.useState('');
  const [note, setNote] = React.useState('');
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
    setNote('');
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
    setReturnLines([]);
    try {
      const items = await fetchReturnableOrderItems(orderId);
      const lines: ReturnLine[] = (items ?? [])
        .filter((it: ReturnableOrderItemDto) => Number(it.remainingQuantity) > 0)
        .map((it: ReturnableOrderItemDto) => ({
          itemId: it.itemId,
          itemName: it.itemName,
          lotId: it.lotId,
          lotNumber: it.lotNumber,
          soldQuantity: Number(it.soldQuantity),
          returnedQuantity: Number(it.returnedQuantity),
          remainingQuantity: Number(it.remainingQuantity),
          unitPrice: Number(it.unitPrice),
          estimatedRefund: Number(it.estimatedRefund),
          checked: false,
          qty: Number(it.remainingQuantity),
          handlingAction: 'RESTOCK',
        }));
      setReturnLines(lines);
      if (lines.length === 0) {
        message.info('Hóa đơn này không còn sản phẩm có thể trả');
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải được sản phẩm có thể trả');
    }
  };

  const handleCreate = async () => {
    if (!sourceOrderId) {
      message.warning('Chọn hóa đơn gốc');
      return;
    }
    const items = returnLines
      .filter((l) => l.checked && l.qty > 0)
      .map((l) => ({
        itemId: l.itemId,
        lotId: l.lotId,
        quantity: l.qty,
        handlingAction: l.handlingAction,
      }));
    if (items.length === 0) {
      message.warning('Chọn ít nhất 1 sản phẩm để trả');
      return;
    }
    setSubmitting(true);
    try {
      await createReturnOrder({ originalOrderId: sourceOrderId, reason, note, items });
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
      render: (v: number) => money(v),
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
      <Table rowKey="id" loading={loading} dataSource={orders} columns={columns} pagination={{ pageSize: 15 }} />

      <Drawer title={`Phiếu trả #${selected?.id}`} open={!!selected} onClose={() => setSelected(null)} width={640}>
        {selected && (
          <div className="space-y-4 text-sm">
            <p><strong>Hóa đơn gốc:</strong> {selected.originalOrderCode}</p>
            <p><strong>Lý do:</strong> {selected.reason || '-'}</p>
            <p><strong>Ghi chú:</strong> {selected.note || '-'}</p>
            <p><strong>Hoàn tiền:</strong> {money(selected.refundAmount)}</p>
            <Table
              size="small"
              pagination={false}
              rowKey={(row) => `${row.itemId}-${row.lotId ?? 0}`}
              dataSource={selected.items}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'itemName' },
                { title: 'Lô', dataIndex: 'lotNumber', width: 120, render: (v?: string) => v || '-' },
                { title: 'SL', dataIndex: 'quantity', width: 70 },
                {
                  title: 'Xử lý',
                  dataIndex: 'handlingAction',
                  width: 120,
                  render: (v?: ReturnHandlingAction) => v ? handlingLabel[v] : '-',
                },
                {
                  title: 'Thành tiền',
                  dataIndex: 'subtotal',
                  width: 120,
                  render: (v: number) => money(v),
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
        width={980}
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
                label: `${o.orderCode} - ${o.customerName} - ${money(o.totalAmount)}`,
              }))}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Lý do trả hàng">
            <Input.TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Form.Item>
          <Form.Item label="Ghi chú">
            <Input.TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
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
              {
                title: 'Sản phẩm',
                dataIndex: 'itemName',
                render: (_: unknown, row: ReturnLine) => (
                  <div>
                    <div className="font-medium">{row.itemName}</div>
                    <div className="text-xs text-slate-500">Lô: {row.lotNumber || '-'}</div>
                  </div>
                ),
              },
              { title: 'Đã mua', dataIndex: 'soldQuantity', width: 90 },
              { title: 'Đã trả', dataIndex: 'returnedQuantity', width: 90 },
              { title: 'Còn trả', dataIndex: 'remainingQuantity', width: 90 },
              {
                title: 'SL trả',
                width: 110,
                render: (_: unknown, row: ReturnLine, idx: number) => (
                  <InputNumber
                    min={1}
                    max={row.remainingQuantity}
                    value={row.qty}
                    disabled={!row.checked}
                    onChange={(v) => {
                      const qty = Math.min(Number(v) || 1, row.remainingQuantity);
                      const next = [...returnLines];
                      next[idx] = { ...row, qty };
                      setReturnLines(next);
                    }}
                  />
                ),
              },
              {
                title: 'Xử lý',
                width: 150,
                render: (_: unknown, row: ReturnLine, idx: number) => (
                  <Select
                    value={row.handlingAction}
                    disabled={!row.checked}
                    style={{ width: 130 }}
                    options={[
                      { value: 'RESTOCK', label: 'Nhập lại kho' },
                      { value: 'DISCARD', label: 'Hủy hàng' },
                    ]}
                    onChange={(value: ReturnHandlingAction) => {
                      const next = [...returnLines];
                      next[idx] = { ...row, handlingAction: value };
                      setReturnLines(next);
                    }}
                  />
                ),
              },
              {
                title: 'Hoàn dự kiến',
                width: 130,
                render: (_: unknown, row: ReturnLine) => money(estimatedLineRefund(row)),
              },
            ]}
          />
        )}
      </Modal>
    </Card>
  );
}
