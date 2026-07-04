import React from 'react';
import { Button, Form, Input, InputNumber, ModalSwitch, Table, Tag, message as antdMessage } from 'antd';
import { Plus, WandSparkles } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import { createPromotion, deletePromotion, fetchPromotions, updatePromotion } from '@/services/wmsApi';
import type { PromotionDto } from '@/types/api';

export default function PromotionsManagePage() {
  const [promotions, setPromotions] = React.useState<PromotionDto[]>([]);
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

  React.useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'PERCENTAGE', active: true, minOrder: 0 });
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
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await updatePromotion(editing.id, values);
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
                title: 'Trạng thái',
                dataIndex: 'active',
                key: 'active',
                render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Đang áp dụng' : 'Tắt'}</Tag>,
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
          <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
