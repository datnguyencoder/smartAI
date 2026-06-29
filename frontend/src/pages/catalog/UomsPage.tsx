import * as React from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui';
import { activateUom, createUom, deactivateUom, updateUom } from '@/services/wmsApi';
import type { UomDto } from '@/types/api';

const UOM_CATEGORY_OPTIONS = [
  { value: 'COUNT', label: 'Số lượng' },
  { value: 'WEIGHT', label: 'Khối lượng' },
  { value: 'VOLUME', label: 'Dung tích' },
  { value: 'PACKAGE', label: 'Đóng gói' },
  { value: 'LENGTH', label: 'Chiều dài' },
  { value: 'OTHER', label: 'Khác' },
];

const UOM_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  UOM_CATEGORY_OPTIONS.map((item) => [item.value, item.label])
);

type Props = {
  uoms: UomDto[];
  reloadCatalog: () => Promise<void>;
};

export default function UomsPage({ uoms, reloadCatalog }: Props) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingUom, setEditingUom] = React.useState<UomDto | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string | undefined>();
  const [form] = Form.useForm();

  const filteredUoms = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return uoms.filter((uom) => {
      const matchQuery = !query || uom.uomName.toLowerCase().includes(query);
      const matchCategory = !categoryFilter || uom.category === categoryFilter;
      return matchQuery && matchCategory;
    });
  }, [categoryFilter, searchQuery, uoms]);

  const openCreate = () => {
    setEditingUom(null);
    form.resetFields();
    form.setFieldsValue({ category: 'COUNT', conversionRatio: 1, baseUnit: true, active: true });
    setModalOpen(true);
  };

  const openEdit = (uom: UomDto) => {
    setEditingUom(uom);
    form.setFieldsValue({
      uomName: uom.uomName,
      category: uom.category,
      conversionRatio: uom.conversionRatio ?? 1,
      baseUnit: uom.baseUnit ?? false,
      active: uom.active ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      uomName: values.uomName.trim(),
      category: values.category,
      conversionRatio: values.conversionRatio ?? 1,
      baseUnit: Boolean(values.baseUnit),
      active: Boolean(values.active),
    };

    setSaving(true);
    try {
      if (editingUom) {
        await updateUom(editingUom.id, payload);
        message.success('Cập nhật đơn vị tính thành công');
      } else {
        await createUom({
          uomName: payload.uomName,
          category: payload.category,
          conversionRatio: payload.conversionRatio,
          baseUnit: payload.baseUnit,
        });
        message.success('Tạo đơn vị tính thành công');
      }
      setModalOpen(false);
      setEditingUom(null);
      await reloadCatalog();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Lưu đơn vị tính thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (uom: UomDto) => {
    const isActive = uom.active !== false;
    try {
      if (isActive) {
        await deactivateUom(uom.id);
        message.success('Đã ngưng hoạt động đơn vị tính');
      } else {
        await activateUom(uom.id);
        message.success('Đã kích hoạt đơn vị tính');
      }
      await reloadCatalog();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Cập nhật trạng thái thất bại');
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="text-lg font-semibold">Đơn vị tính</h2>
          <p className="text-sm text-muted">Quản lý nhóm đơn vị dùng khi tạo sản phẩm và phiếu nhập.</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
          Thêm đơn vị
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5">
        <Input
          className="max-w-xs"
          allowClear
          placeholder="Tìm theo tên đơn vị..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Select
          className="w-56"
          allowClear
          placeholder="Lọc theo nhóm"
          options={UOM_CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      <div className="p-5">
        <Table
          rowKey="id"
          dataSource={filteredUoms}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Tên đơn vị',
              dataIndex: 'uomName',
              key: 'uomName',
            },
            {
              title: 'Nhóm',
              dataIndex: 'category',
              key: 'category',
              render: (value: string) => <Tag color="blue">{UOM_CATEGORY_LABEL[value] ?? value ?? '-'}</Tag>,
            },
            {
              title: 'Tỷ lệ mặc định',
              dataIndex: 'conversionRatio',
              key: 'conversionRatio',
              render: (value: number) => value ?? 1,
            },
            {
              title: 'Đơn vị cơ sở',
              dataIndex: 'baseUnit',
              key: 'baseUnit',
              render: (value: boolean) => (value ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'active',
              key: 'active',
              render: (value: boolean | undefined) =>
                value === false ? <Tag>Ngưng</Tag> : <Tag color="green">Đang dùng</Tag>,
            },
            {
              title: 'Thao tác',
              key: 'actions',
              render: (_, record: UomDto) => {
                const isActive = record.active !== false;
                return (
                  <Space>
                    <Button size="small" onClick={() => openEdit(record)}>
                      Sửa
                    </Button>
                    <Button size="small" danger={isActive} onClick={() => handleToggleActive(record)}>
                      {isActive ? 'Ngưng' : 'Kích hoạt'}
                    </Button>
                  </Space>
                );
              },
            },
          ]}
        />
      </div>

      <Modal
        title={editingUom ? 'Sửa đơn vị tính' : 'Thêm đơn vị tính'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingUom(null);
        }}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="uomName" label="Tên đơn vị" rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}>
            <Input placeholder="Ví dụ: Cái, Thùng, Kg, Lít" />
          </Form.Item>
          <Form.Item name="category" label="Nhóm đơn vị" rules={[{ required: true, message: 'Vui lòng chọn nhóm đơn vị' }]}>
            <Select options={UOM_CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="conversionRatio" label="Tỷ lệ mặc định" rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ mặc định' }]} tooltip="Ví dụ: 1 thùng = 24 cái thì nhập 24">
            <InputNumber className="w-full" min={0.0001} step={0.0001} />
          </Form.Item>
          <Form.Item name="baseUnit" label="Là đơn vị cơ sở" valuePropName="checked">
            <Switch />
          </Form.Item>
          {editingUom && (
            <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
