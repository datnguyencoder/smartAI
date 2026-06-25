import React from 'react';
import { Button, Form, Input, Modal, Table, Tag, message as antdMessage } from 'antd';
import { Plus, Search, Users } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import { createCustomer, fetchCustomers, fetchOrders, fetchSettings, updateCustomer } from '@/services/wmsApi';
import type { CustomerDto, OrderDto } from '@/types/api';

const tierColors: Record<string, string> = {
  REGULAR: 'default',
  SILVER: 'blue',
  GOLD: 'gold',
};

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<CustomerDto[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<CustomerDto | null>(null);
  const [orders, setOrders] = React.useState<OrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [tierThresholds, setTierThresholds] = React.useState({ silver: 500, gold: 2000 });

  React.useEffect(() => {
    fetchSettings()
      .then((settings) => {
        const get = (key: string, def: number) => {
          const s = settings.find((x) => x.key === key);
          return s ? parseInt(s.value, 10) || def : def;
        };
        setTierThresholds({
          silver: get('LOYALTY_SILVER_THRESHOLD', 500),
          gold: get('LOYALTY_GOLD_THRESHOLD', 2000),
        });
      })
      .catch(() => {});
  }, []);

  const tierProgress = (tier: string, points: number) => {
    if (tier === 'REGULAR') return { next: 'SILVER', need: Math.max(0, tierThresholds.silver - points) };
    if (tier === 'SILVER') return { next: 'GOLD', need: Math.max(0, tierThresholds.gold - points) };
    return null;
  };

  const loadCustomers = React.useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await fetchCustomers(undefined, q?.trim() || undefined);
      setCustomers(data);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được danh sách khách');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => loadCustomers(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadCustomers]);

  const openDetail = async (customer: CustomerDto) => {
    setSelected(customer);
    setOrdersLoading(true);
    try {
      setOrders(await fetchOrders(customer.phone));
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      await createCustomer({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
      });
      antdMessage.success('Đã thêm khách hàng');
      setCreateOpen(false);
      form.resetFields();
      loadCustomers(search);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tạo được khách hàng');
    }
  };

  const openEdit = (customer: CustomerDto) => {
    setSelected(customer);
    editForm.setFieldsValue({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selected) return;
    const values = await editForm.validateFields();
    try {
      await updateCustomer(selected.id, values);
      antdMessage.success('Đã cập nhật khách hàng');
      setEditOpen(false);
      loadCustomers(search);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  };

  const columns = [
    { title: 'Tên khách', dataIndex: 'fullName', key: 'fullName' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Điểm',
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: 'Hạng',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => <Tag color={tierColors[tier] || 'default'}>{tier}</Tag>,
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, record: CustomerDto) => (
        <div className="flex gap-1">
          <Button type="link" onClick={() => openDetail(record)}>Lịch sử</Button>
          <Button type="link" onClick={() => openEdit(record)}>Sửa</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Quản lý khách hàng"
          action={
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Thêm khách
            </Button>
          }
        />
        <div className="px-5 pb-5">
          <Input
            className="max-w-md mb-4"
            prefix={<Search size={16} />}
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Table
            rowKey="id"
            loading={loading}
            dataSource={customers}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </Card>

      <Modal
        open={createOpen}
        title="Thêm khách hàng"
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Lưu"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={editOpen}
        title="Sửa khách hàng"
        onCancel={() => setEditOpen(false)}
        onOk={handleEdit}
        okText="Lưu"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        width={720}
        title={selected ? `${selected.fullName} · ${selected.phone}` : ''}
      >
        {selected && (() => {
          const progress = tierProgress(selected.tier, selected.loyaltyPoints);
          return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Users size={24} className="text-primary" />
              <div>
                <Tag color={tierColors[selected.tier] || 'default'}>{selected.tier}</Tag>
                <span className="ml-2 text-sm">{selected.loyaltyPoints} điểm tích lũy</span>
                {progress && (
                  <p className="text-xs text-slate-500 mt-1">
                    Còn {progress.need} điểm để lên {progress.next}
                  </p>
                )}
              </div>
            </div>
            <Table
              rowKey="id"
              loading={ordersLoading}
              dataSource={orders}
              pagination={{ pageSize: 5 }}
              columns={[
                { title: 'Mã HĐ', dataIndex: 'orderCode', key: 'orderCode' },
                {
                  title: 'Ngày',
                  dataIndex: 'orderDate',
                  key: 'orderDate',
                  render: (v: string) => new Date(v).toLocaleString('vi-VN'),
                },
                {
                  title: 'Tổng tiền',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  render: (v: number) => money(v),
                },
                { title: 'KM', dataIndex: 'promotionCode', key: 'promotionCode', render: (v?: string) => v || '—' },
              ]}
            />
          </div>
          );
        })()}
      </Modal>
    </div>
  );
}
