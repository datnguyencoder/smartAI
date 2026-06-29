import * as React from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { createOnlineOrder, fetchOnlineOrders, updateOnlineOrderStatus } from '@/services/wmsApi';
import type { OnlineOrderRequestDto } from '@/types/api';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

export default function OnlineOrdersPage() {
  const [rows, setRows] = React.useState<OnlineOrderRequestDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form] = Form.useForm();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchOnlineOrders());
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải đơn online');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      await createOnlineOrder({
        ...values,
        totalAmount: values.totalAmount ? Number(values.totalAmount) : undefined,
      });
      message.success('Tạo yêu cầu đặt hàng thành công');
      setCreateOpen(false);
      form.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Tạo yêu cầu thất bại');
    }
  };

  const handleStatus = async (id: number, status: string) => {
    try {
      await updateOnlineOrderStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Đơn hàng online"
        description="Yêu cầu đặt hàng online từ khách (stub)."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Tạo yêu cầu</Button>}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'requestCode' },
          { title: 'Khách', dataIndex: 'customerName', render: (v) => v || '—' },
          { title: 'SĐT', dataIndex: 'customerPhone', render: (v) => v || '—' },
          { title: 'Địa chỉ giao', dataIndex: 'deliveryAddress', ellipsis: true, render: (v) => v || '—' },
          {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            align: 'right',
            render: (v: number) => `${Number(v || 0).toLocaleString('vi-VN')} đ`,
          },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
          {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
          },
          {
            title: '',
            render: (_: unknown, r: OnlineOrderRequestDto) => (
              <Select
                size="small"
                value={r.status}
                style={{ width: 130 }}
                onChange={(v) => handleStatus(r.id, v)}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              />
            ),
          },
        ]}
      />

      <Modal open={createOpen} title="Tạo yêu cầu đặt hàng online" onCancel={() => setCreateOpen(false)} onOk={handleCreate}>
        <Form form={form} layout="vertical">
          <Form.Item name="customerName" label="Tên khách"><Input /></Form.Item>
          <Form.Item name="customerPhone" label="SĐT"><Input /></Form.Item>
          <Form.Item name="deliveryAddress" label="Địa chỉ giao"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="totalAmount" label="Tổng tiền dự kiến"><InputNumber className="w-full" min={0} /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
