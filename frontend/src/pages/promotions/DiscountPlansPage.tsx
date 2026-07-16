import * as React from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Switch, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import { createDiscountPlan, fetchCategories, fetchDiscountPlans, updateDiscountPlan } from '@/services/wmsApi';
import type { DiscountPlanDto, CategoryDto } from '@/types/api';
import type { Product } from '@/lib/itemMapper';

type Props = { productsList?: Product[] };

export default function DiscountPlansPage({ productsList = [] }: Props) {
  const [rows, setRows] = React.useState<DiscountPlanDto[]>([]);
  const [categories, setCategories] = React.useState<CategoryDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DiscountPlanDto | null>(null);
  const [form] = Form.useForm();
  const planType = Form.useWatch('planType', form);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [plans, cats] = await Promise.all([fetchDiscountPlans(), fetchCategories()]);
      setRows(plans ?? []);
      setCategories(cats ?? []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải kế hoạch giảm giá');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ planType: 'CATEGORY', discountPercent: 5 });
    setModalOpen(true);
  };

  const openEdit = (row: DiscountPlanDto) => {
    setEditing(row);
    form.setFieldsValue({
      planName: row.planName,
      planType: row.planType,
      categoryId: row.categoryId,
      itemId: row.itemId,
      discountPercent: row.discountPercent,
      startDate: row.startDate ? dayjs(row.startDate) : undefined,
      endDate: row.endDate ? dayjs(row.endDate) : undefined,
      active: row.active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      planName: values.planName,
      planType: values.planType,
      categoryId: values.categoryId,
      itemId: values.itemId,
      discountPercent: Number(values.discountPercent),
      startDate: values.startDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
      active: values.active,
    };
    try {
      if (editing) {
        await updateDiscountPlan(editing.id, payload);
        message.success('Cập nhật thành công');
      } else {
        await createDiscountPlan(payload);
        message.success('Tạo kế hoạch thành công');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Kế hoạch giảm giá"
        description="Quy tắc giảm giá theo danh mục, sản phẩm hoặc toàn cửa hàng."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tạo kế hoạch</Button>}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Tên', dataIndex: 'planName' },
          { title: 'Loại', dataIndex: 'planType' },
          { title: 'Đối tượng', render: (_: unknown, r: DiscountPlanDto) => r.itemName || r.categoryName || 'Toàn cửa hàng' },
          { title: 'Giảm %', dataIndex: 'discountPercent', render: (v: number) => `${v}%` },
          {
            title: 'Hiệu lực',
            render: (_: unknown, r: DiscountPlanDto) =>
              `${r.startDate ? dayjs(r.startDate).format('DD/MM/YY') : '—'} → ${r.endDate ? dayjs(r.endDate).format('DD/MM/YY') : '—'}`,
          },
          { title: 'Trạng thái', dataIndex: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Bật' : 'Tắt'}</Tag> },
          { title: '', render: (_: unknown, r: DiscountPlanDto) => <Button type="link" onClick={() => openEdit(r)}>Sửa</Button> },
        ]}
      />
      <Modal open={modalOpen} title={editing ? 'Sửa kế hoạch' : 'Tạo kế hoạch giảm giá'} onCancel={() => setModalOpen(false)} onOk={handleSave} width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="planName" label="Tên kế hoạch" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="planType" label="Loại" rules={[{ required: true }]}>
            <Select options={[
              { value: 'CATEGORY', label: 'Theo danh mục' },
              { value: 'SKU', label: 'Theo sản phẩm' },
            ]} />
          </Form.Item>
          {planType === 'CATEGORY' && (
            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
              <Select options={categories.map((c) => ({ value: c.id, label: c.categoryName }))} />
            </Form.Item>
          )}
          {planType === 'SKU' && (
            <Form.Item name="itemId" label="Sản phẩm" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={productsList.map((p) => ({ value: Number(p.key), label: `${p.sku} · ${p.name}` }))}
              />
            </Form.Item>
          )}
          <Form.Item name="discountPercent" label="Giảm (%)" rules={[{ required: true }]}><InputNumber className="w-full" min={0.01} max={100} /></Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="startDate" label="Từ ngày"><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="endDate" label="Đến ngày"><DatePicker className="w-full" /></Form.Item>
          </div>
          {editing && <Form.Item name="active" label="Kích hoạt" valuePropName="checked"><Switch /></Form.Item>}
        </Form>
      </Modal>
    </Card>
  );
}
