import React from 'react';
import { Button, Form, Input, InputNumber, Modal, Progress, Statistic, Switch, Table, Tag, Tooltip, message as antdMessage } from 'antd';
import { Plus, WandSparkles } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import { createPromotion, deletePromotion, fetchPromotionAnalytics, fetchPromotions, updatePromotion } from '@/services/wmsApi';
import type { PromotionAnalyticsDto, PromotionDto } from '@/types/api';

export default function PromotionsManagePage() {
  const [promotions, setPromotions] = React.useState<PromotionDto[]>([]);
  const [analytics, setAnalytics] = React.useState<PromotionAnalyticsDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PromotionDto | null>(null);
  const [form] = Form.useForm();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setPromotions(await fetchPromotions());
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được khuyến mãi');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = React.useCallback(async () => {
    try {
      setAnalytics(await fetchPromotionAnalytics());
    } catch {
      setAnalytics([]);
    }
  }, []);

  React.useEffect(() => { load(); loadAnalytics(); }, [load, loadAnalytics]);

  const totalDiscountGiven = analytics.reduce((sum, a) => sum + a.totalDiscountGiven, 0);
  const totalUsage = analytics.reduce((sum, a) => sum + a.usageCount, 0);
  const topPromotion = [...analytics].sort((a, b) => b.totalDiscountGiven - a.totalDiscountGiven)[0];

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'PERCENTAGE', active: true, minOrder: 0, stackable: true });
    setModalOpen(true);
  };

  const openEdit = (p: PromotionDto) => {
    setEditing(p);
    form.setFieldsValue({
      name: p.name,
      code: p.code,
      type: p.type,
      value: p.value,
      minOrder: p.minOrder,
      startDate: p.startDate,
      endDate: p.endDate,
      active: p.active,
      maxUsage: p.maxUsage ?? undefined,
      maxPerCustomer: p.maxPerCustomer ?? undefined,
      stackable: p.stackable ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        // -1 báo cho backend biết "xoá giới hạn" (undefined nghĩa là giữ nguyên)
        await updatePromotion(editing.id, {
          ...values,
          maxUsage: values.maxUsage === undefined || values.maxUsage === null ? -1 : values.maxUsage,
          maxPerCustomer:
            values.maxPerCustomer === undefined || values.maxPerCustomer === null ? -1 : values.maxPerCustomer,
        });
        antdMessage.success('Cập nhật khuyến mãi thành công');
      } else {
        await createPromotion(values);
        antdMessage.success('Tạo khuyến mãi thành công');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xóa khuyến mãi?',
      onOk: async () => {
        await deletePromotion(id);
        antdMessage.success('Đã xóa');
        load();
      },
    });
  };

  return (
    <div className="space-y-4">
      {analytics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <div className="p-4">
              <Statistic
                title="Tổng tiền đã giảm qua mã KM"
                value={totalDiscountGiven}
                precision={0}
                suffix="đ"
                valueStyle={{ color: '#059669' }}
              />
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <Statistic title="Tổng lượt dùng mã KM" value={totalUsage} />
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <Statistic
                title="Mã hiệu quả nhất"
                value={topPromotion?.code ?? '—'}
                valueStyle={{ fontSize: 20 }}
              />
              {topPromotion && (
                <div className="mt-1 text-xs text-slate-500">
                  {topPromotion.totalDiscountGiven.toLocaleString('vi-VN')}đ · {topPromotion.usageCount} lượt dùng
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      <Card>
        <CardHeader
          title="Quản lý khuyến mãi"
          action={
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Tạo mã KM
            </Button>
          }
        />
        <div className="px-5 pb-5">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={promotions}
            columns={[
              { title: 'Tên', dataIndex: 'name', key: 'name' },
              { title: 'Mã', dataIndex: 'code', key: 'code', render: (v: string) => <Tag icon={<WandSparkles size={12} />}>{v}</Tag> },
              { title: 'Loại', dataIndex: 'type', key: 'type' },
              { title: 'Giá trị', dataIndex: 'value', key: 'value' },
              { title: 'Đơn tối thiểu', dataIndex: 'minOrder', key: 'minOrder' },
              {
                title: 'Lượt dùng',
                key: 'usage',
                render: (_: unknown, record: PromotionDto) => {
                  const used = record.usageCount ?? 0;
                  if (!record.maxUsage) {
                    return <span className="text-slate-500">{used} / Không giới hạn</span>;
                  }
                  const percent = Math.min(100, Math.round((used / record.maxUsage) * 100));
                  const exhausted = used >= record.maxUsage;
                  return (
                    <Tooltip title={`Đã dùng ${used} / ${record.maxUsage} lượt`}>
                      <div style={{ minWidth: 110 }}>
                        <Progress
                          percent={percent}
                          size="small"
                          status={exhausted ? 'exception' : 'active'}
                          format={() => `${used}/${record.maxUsage}`}
                        />
                      </div>
                    </Tooltip>
                  );
                },
              },
              {
                title: 'Cộng dồn',
                dataIndex: 'stackable',
                key: 'stackable',
                render: (v: boolean | undefined) => (
                  <Tooltip title={v === false ? 'Không dùng chung được với khuyến mãi tự động khác' : 'Có thể cộng dồn với khuyến mãi tự động'}>
                    <Tag color={v === false ? 'volcano' : 'default'}>{v === false ? 'Không' : 'Có'}</Tag>
                  </Tooltip>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'active',
                key: 'active',
                render: (v: boolean, record: PromotionDto) => {
                  const exhausted = !!record.maxUsage && (record.usageCount ?? 0) >= record.maxUsage;
                  if (exhausted) return <Tag color="orange">Hết lượt</Tag>;
                  return <Tag color={v ? 'green' : 'red'}>{v ? 'Đang áp dụng' : 'Tắt'}</Tag>;
                },
              },
              {
                title: '',
                key: 'actions',
                render: (_: unknown, record: PromotionDto) => (
                  <div className="flex gap-2">
                    <Button type="link" onClick={() => openEdit(record)}>Sửa</Button>
                    <Button type="link" danger onClick={() => handleDelete(record.id)}>Xóa</Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        title={editing ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi'}
        okText="Lưu"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên chương trình" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Mã KM" rules={[{ required: true }]}>
            <Input placeholder="WEEKEND10" />
          </Form.Item>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select options={[
              { value: 'PERCENTAGE', label: 'Phần trăm (%)' },
              { value: 'FIXED_AMOUNT', label: 'Số tiền cố định (VND)' },
            ]} />
          </Form.Item>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="minOrder" label="Đơn tối thiểu (VND)">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="startDate" label="Ngày bắt đầu">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="endDate" label="Ngày kết thúc">
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="maxUsage"
            label="Giới hạn tổng lượt dùng"
            tooltip="Để trống = không giới hạn số lần mã này được sử dụng"
          >
            <InputNumber className="w-full" min={1} placeholder="Không giới hạn" />
          </Form.Item>
          <Form.Item
            name="maxPerCustomer"
            label="Giới hạn lượt dùng / khách"
            tooltip="Để trống = mỗi khách được dùng không giới hạn số lần"
          >
            <InputNumber className="w-full" min={1} placeholder="Không giới hạn" />
          </Form.Item>
          <Form.Item
            name="stackable"
            label="Cho phép cộng dồn với khuyến mãi tự động"
            valuePropName="checked"
            tooltip="Tắt nếu mã này không được dùng chung với chiến dịch khuyến mãi (BOGO/giảm %) đang áp dụng sẵn cho sản phẩm"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
