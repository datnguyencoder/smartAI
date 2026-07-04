import * as React from 'react';
import { Button, Form, Input, InputNumber, Modal, Switch, Table, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import { createBrand, fetchBrands, updateBrand } from '@/services/wmsApi';
import type { BrandDto } from '@/types/api';

export default function BrandsPage() {
  const [rows, setRows] = React.useState<BrandDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BrandDto | null>(null);
  const [form] = Form.useForm();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchBrands());
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải thương hiệu');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalOpen(true);
  };

  const openEdit = (row: BrandDto) => {
    setEditing(row);
    form.setFieldsValue({ brandName: row.brandName, description: row.description, active: row.active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await updateBrand(editing.id, values);
        message.success('Cập nhật thành công');
      } else {
        await createBrand(values);
        message.success('Tạo thương hiệu thành công');
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
        title="Thương hiệu"
        description="Quản lý thương hiệu sản phẩm."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Thêm thương hiệu</Button>}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Tên', dataIndex: 'brandName' },
          { title: 'Mô tả', dataIndex: 'description', render: (v) => v || '—' },
          { title: 'Trạng thái', dataIndex: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Ngưng'}</Tag> },
          { title: '', render: (_: unknown, r: BrandDto) => <Button type="link" onClick={() => openEdit(r)}>Sửa</Button> },
        ]}
      />
      <Modal open={modalOpen} title={editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'} onCancel={() => setModalOpen(false)} onOk={handleSave}>
        <Form form={form} layout="vertical">
          <Form.Item name="brandName" label="Tên thương hiệu" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>
          {editing && <Form.Item name="active" label="Hoạt động" valuePropName="checked"><Switch /></Form.Item>}
        </Form>
      </Modal>
    </Card>
  );
}
