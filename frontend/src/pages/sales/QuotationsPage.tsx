import * as React from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Plus, ShoppingCart } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import { convertQuotationToOrder, createQuotation, fetchQuotations } from '@/services/wmsApi';
import type { QuotationDto } from '@/types/api';
import type { Product } from '@/lib/itemMapper';

type Props = { productsList: Product[] };

type LineDraft = { itemId: number; itemName: string; quantity: number; unitPrice: number };

export default function QuotationsPage({ productsList }: Props) {
  const [rows, setRows] = React.useState<QuotationDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [lines, setLines] = React.useState<LineDraft[]>([]);
  const [form] = Form.useForm();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchQuotations());
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải báo giá');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const addLine = (itemId: number) => {
    const product = productsList.find((p) => Number(p.key) === itemId);
    if (!product) return;
    if (lines.some((l) => l.itemId === itemId)) {
      message.info('Sản phẩm đã có trong báo giá');
      return;
    }
    setLines([...lines, { itemId, itemName: product.name, quantity: 1, unitPrice: product.price }]);
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    if (lines.length === 0) {
      message.warning('Thêm ít nhất 1 sản phẩm');
      return;
    }
    try {
      await createQuotation({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        validUntil: values.validUntil?.format('YYYY-MM-DD'),
        note: values.note,
        items: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      message.success('Tạo báo giá thành công');
      setCreateOpen(false);
      setLines([]);
      form.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Tạo báo giá thất bại');
    }
  };

  const handleConvert = async (id: number) => {
    try {
      const order = await convertQuotationToOrder(id);
      message.success(`Đã chuyển thành đơn ${order.orderCode}`);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Chuyển đổi thất bại');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Báo giá"
        description="Tạo báo giá cho khách và chuyển thành đơn bán hàng."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Tạo báo giá</Button>}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'quoteCode' },
          { title: 'Khách hàng', dataIndex: 'customerName', render: (v) => v || '—' },
          { title: 'SĐT', dataIndex: 'customerPhone', render: (v) => v || '—' },
          {
            title: 'Tổng tiền',
            dataIndex: 'subtotalAmount',
            align: 'right',
            render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
          },
          { title: 'HSD báo giá', dataIndex: 'validUntil', render: (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
          {
            title: '',
            render: (_: unknown, r: QuotationDto) =>
              r.status === 'DRAFT' || r.status === 'SENT' ? (
                <Button size="small" icon={<ShoppingCart size={14} />} onClick={() => handleConvert(r.id)}>
                  Chuyển đơn
                </Button>
              ) : r.convertedOrderId ? (
                <span className="text-xs text-slate-500">Đơn #{r.convertedOrderId}</span>
              ) : null,
          },
        ]}
      />

      <Modal open={createOpen} title="Tạo báo giá" onCancel={() => setCreateOpen(false)} onOk={handleCreate} width={720}>
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="customerName" label="Tên khách"><Input /></Form.Item>
            <Form.Item name="customerPhone" label="SĐT"><Input /></Form.Item>
          </div>
          <Form.Item name="validUntil" label="Hiệu lực đến"><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="Thêm sản phẩm">
            <Select
              showSearch
              placeholder="Chọn sản phẩm"
              optionFilterProp="label"
              onChange={addLine}
              value={null}
              options={productsList.map((p) => ({ value: Number(p.key), label: `${p.sku} · ${p.name}` }))}
            />
          </Form.Item>
        </Form>
        <Table
          size="small"
          pagination={false}
          rowKey="itemId"
          dataSource={lines}
          columns={[
            { title: 'Sản phẩm', dataIndex: 'itemName' },
            {
              title: 'SL',
              dataIndex: 'quantity',
              width: 90,
              render: (v: number, _r: LineDraft, idx: number) => (
                <InputNumber min={1} value={v} onChange={(n) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], quantity: Number(n) || 1 };
                  setLines(next);
                }} />
              ),
            },
            {
              title: 'Đơn giá',
              dataIndex: 'unitPrice',
              width: 120,
              render: (v: number, _r: LineDraft, idx: number) => (
                <InputNumber min={0} value={v} onChange={(n) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], unitPrice: Number(n) || 0 };
                  setLines(next);
                }} />
              ),
            },
            {
              title: '',
              width: 60,
              render: (_: unknown, _r: LineDraft, idx: number) => (
                <Button type="link" danger onClick={() => setLines(lines.filter((_, i) => i !== idx))}>Xóa</Button>
              ),
            },
          ]}
        />
      </Modal>
    </Card>
  );
}
