import * as React from 'react';
import { Button, Form, Input, InputNumber, Modal, Space, Switch, Table, Tag, message } from 'antd';
import { Info, Lightbulb, Package, Plus, RefreshCw } from 'lucide-react';
import { Card , Select } from '@/components/ui';
import { activateUom, createUom, deactivateUom, updateUom } from '@/services/wmsApi';
import type { UomDto } from '@/types/api';

const TEXT = {
  title: '\u0110\u01a1n v\u1ecb t\u00ednh',
  description:
    'Qu\u1ea3n l\u00fd \u0111\u01a1n v\u1ecb, nh\u00f3m \u0111\u01a1n v\u1ecb v\u00e0 t\u1ef7 l\u1ec7 quy \u0111\u1ed5i d\u00f9ng khi t\u1ea1o s\u1ea3n ph\u1ea9m v\u00e0 phi\u1ebfu nh\u1eadp.',
  addUnit: 'Th\u00eam \u0111\u01a1n v\u1ecb',
  searchPlaceholder: 'T\u00ecm theo t\u00ean \u0111\u01a1n v\u1ecb...',
  filterGroup: 'L\u1ecdc theo nh\u00f3m',
  unitName: 'T\u00ean \u0111\u01a1n v\u1ecb',
  unitGroup: 'Nh\u00f3m \u0111\u01a1n v\u1ecb',
  conversionUom: '\u0110\u01a1n v\u1ecb chuy\u1ec3n \u0111\u1ed5i',
  conversionRatio: 'S\u1ed1 l\u01b0\u1ee3ng trong 1 \u0111\u01a1n v\u1ecb \u0111\u00f3ng g\u00f3i',
  status: 'Tr\u1ea1ng th\u00e1i',
  inactive: 'Ng\u01b0ng',
  active: '\u0110ang d\u00f9ng',
  actions: 'Thao t\u00e1c',
  edit: 'S\u1eeda',
  activate: 'K\u00edch ho\u1ea1t',
  editTitle: 'S\u1eeda \u0111\u01a1n v\u1ecb t\u00ednh',
  createTitle: 'Th\u00eam \u0111\u01a1n v\u1ecb t\u00ednh',
  save: 'L\u01b0u',
  cancel: 'H\u1ee7y',
  nameRequired: 'Vui l\u00f2ng nh\u1eadp t\u00ean \u0111\u01a1n v\u1ecb',
  namePlaceholder: 'V\u00ed d\u1ee5: C\u00e1i, Th\u00f9ng 24 lon, Kg, L\u00edt',
  groupRequired: 'Vui l\u00f2ng nh\u1eadp nh\u00f3m \u0111\u01a1n v\u1ecb',
  groupTooltip: 'Ch\u1ecdn \u0110\u01a1n v\u1ecb l\u1ebb cho \u0111\u01a1n v\u1ecb g\u1ed1c, ho\u1eb7c \u0110\u00f3ng g\u00f3i cho \u0111\u01a1n v\u1ecb c\u1ea7n quy \u0111\u1ed5i.',
  groupPlaceholder: 'V\u00ed d\u1ee5: \u0110\u00f3ng g\u00f3i',
  conversionTooltip: 'V\u00ed d\u1ee5: Th\u00f9ng 24 lon chuy\u1ec3n \u0111\u1ed5i v\u1ec1 Lon.',
  ratioRequired: 'Vui l\u00f2ng nh\u1eadp s\u1ed1 l\u01b0\u1ee3ng trong 1 \u0111\u01a1n v\u1ecb \u0111\u00f3ng g\u00f3i',
  ratioTooltip: 'V\u00ed d\u1ee5: Th\u00f9ng 24 lon th\u00ec nh\u1eadp 24.',
  activeField: '\u0110ang ho\u1ea1t \u0111\u1ed9ng',
  updateSuccess: 'C\u1eadp nh\u1eadt \u0111\u01a1n v\u1ecb t\u00ednh th\u00e0nh c\u00f4ng',
  createSuccess: 'T\u1ea1o \u0111\u01a1n v\u1ecb t\u00ednh th\u00e0nh c\u00f4ng',
  saveFailed: 'L\u01b0u \u0111\u01a1n v\u1ecb t\u00ednh th\u1ea5t b\u1ea1i',
  deactivated: '\u0110\u00e3 ng\u01b0ng ho\u1ea1t \u0111\u1ed9ng \u0111\u01a1n v\u1ecb t\u00ednh',
  activated: '\u0110\u00e3 k\u00edch ho\u1ea1t \u0111\u01a1n v\u1ecb t\u00ednh',
  statusFailed: 'C\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i th\u1ea5t b\u1ea1i',
};

const RETAIL_GROUP = '\u0110\u01a1n v\u1ecb l\u1ebb';
const PACKAGING_GROUP = '\u0110\u00f3ng g\u00f3i';
const UOM_GROUP_OPTIONS = [{ value: RETAIL_GROUP }, { value: PACKAGING_GROUP }];

const normalizeUomGroup = (category?: string) => {
  const value = category?.trim().toUpperCase();

  if (!value) return '';
  if (['ĐƠN VỊ LẺ', 'BÁN LẺ', 'COUNT', 'WEIGHT', 'VOLUME', 'LENGTH', 'OTHER'].includes(value)) {
    return RETAIL_GROUP;
  }
  if (['ĐÓNG GÓI', 'PACKAGE'].includes(value)) {
    return PACKAGING_GROUP;
  }

  return category?.trim() ?? '';
};

const isPackagingUomGroup = (category?: string) => normalizeUomGroup(category) === PACKAGING_GROUP;

const getDisplayUomGroup = (uom: UomDto) => {
  const group = normalizeUomGroup(uom.category);
  const ratio = Number(uom.conversionRatio ?? 1);

  if (group === PACKAGING_GROUP || ratio > 1) return PACKAGING_GROUP;
  if (group === RETAIL_GROUP || ratio <= 1) return RETAIL_GROUP;

  return group;
};

type Props = {
  uoms: UomDto[];
  reloadCatalog: () => Promise<void>;
};

type UomFormValues = {
  uomName: string;
  category: string;
  conversionUomId?: number;
  conversionRatio: number;
  active?: boolean;
};

function UomHelpPanel() {
  const helpItems = [
    {
      title: 'Đơn vị lẻ',
      description: 'Là đơn vị nhỏ nhất để bán và tính tồn kho.',
      example: 'Ví dụ: gói, cái, lon, kg.',
      icon: <Package size={18} />,
      cardClass: 'border-emerald-100 bg-emerald-50/70',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Đóng gói',
      description: 'Là đơn vị lớn hơn dùng khi nhập hàng.',
      example: 'Ví dụ: thùng 24 gói, bao 10kg.',
      icon: <Package size={18} />,
      cardClass: 'border-blue-100 bg-blue-50/70',
      iconClass: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Tỷ lệ quy đổi',
      description: 'Là số lượng đơn vị lẻ có trong 1 đơn vị đóng gói.',
      example: 'Ví dụ: 1 thùng 24 gói = 24 gói.',
      icon: <RefreshCw size={18} />,
      cardClass: 'border-violet-100 bg-violet-50/70',
      iconClass: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <aside className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:sticky xl:top-4 xl:self-start">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Hướng dẫn nhanh</p>
          <p className="text-xs text-muted">Cách cấu hình đơn vị tính khi nhập hàng.</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Info size={16} />
        </span>
      </div>

      <div className="space-y-3">
        {helpItems.map((item) => (
          <div key={item.title} className={`rounded-xl border p-3 ${item.cardClass}`}>
            <div className="flex gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}>
                {item.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.example}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Lightbulb size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mẹo</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Tạo đơn vị lẻ trước, sau đó tạo đơn vị đóng gói để nhập hàng chính xác.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
export default function UomsPage({ uoms, reloadCatalog }: Props) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingUom, setEditingUom] = React.useState<UomDto | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string | undefined>();
  const [form] = Form.useForm<UomFormValues>();
  const selectedCategory = Form.useWatch('category', form);
  const isPackagingGroup = isPackagingUomGroup(selectedCategory);

  const activeUomOptions = React.useMemo(
    () =>
      uoms
        .filter((uom) => uom.active !== false)
        .map((uom) => ({
          value: uom.id,
          label: uom.uomName,
        })),
    [uoms]
  );

  const filteredUoms = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return uoms.filter((uom) => {
      const matchQuery = !query || uom.uomName.toLowerCase().includes(query);
      const matchCategory = !categoryFilter || getDisplayUomGroup(uom) === categoryFilter;
      return matchQuery && matchCategory;
    });
  }, [categoryFilter, searchQuery, uoms]);

  const openCreate = () => {
    setEditingUom(null);
    form.resetFields();
    form.setFieldsValue({ category: RETAIL_GROUP, conversionRatio: 1, active: true });
    setModalOpen(true);
  };

  const openEdit = (uom: UomDto) => {
    setEditingUom(uom);
    form.setFieldsValue({
      uomName: uom.uomName,
      category: uom.category,
      conversionUomId: uom.conversionUomId,
      conversionRatio: uom.conversionRatio ?? 1,
      active: uom.active ?? true,
    });
    setModalOpen(true);
  };

  React.useEffect(() => {
    if (!isPackagingUomGroup(selectedCategory)) {
      form.setFieldsValue({
        conversionUomId: undefined,
        conversionRatio: 1,
      });
    }
  }, [form, selectedCategory]);

  const handleSave = async () => {
    const values = await form.validateFields();
    const packaging = isPackagingUomGroup(values.category);
    const payload = {
      uomName: values.uomName.trim(),
      category: normalizeUomGroup(values.category),
      conversionUomId: packaging ? values.conversionUomId : undefined,
      conversionRatio: packaging ? values.conversionRatio ?? 1 : 1,
      active: Boolean(values.active),
    };

    setSaving(true);
    try {
      if (editingUom) {
        await updateUom(editingUom.id, payload);
        message.success(TEXT.updateSuccess);
      } else {
        await createUom({
          uomName: payload.uomName,
          category: payload.category,
          conversionUomId: payload.conversionUomId,
          conversionRatio: payload.conversionRatio,
        });
        message.success(TEXT.createSuccess);
      }
      setModalOpen(false);
      setEditingUom(null);
      await reloadCatalog();
    } catch (e) {
      message.error(e instanceof Error ? e.message : TEXT.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (uom: UomDto) => {
    const isActive = uom.active !== false;
    try {
      if (isActive) {
        await deactivateUom(uom.id);
        message.success(TEXT.deactivated);
      } else {
        await activateUom(uom.id);
        message.success(TEXT.activated);
      }
      await reloadCatalog();
    } catch (e) {
      message.error(e instanceof Error ? e.message : TEXT.statusFailed);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="text-lg font-semibold">{TEXT.title}</h2>
          <p className="text-sm text-muted">{TEXT.description}</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
          {TEXT.addUnit}
        </Button>
      </div>

      <div className="grid gap-5 border-b border-slate-100 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          allowClear
          placeholder={TEXT.searchPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Select
          className="w-56"
          allowClear
          placeholder={TEXT.filterGroup}
          options={UOM_GROUP_OPTIONS}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

          <Table
          rowKey="id"
          dataSource={filteredUoms}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: TEXT.unitName,
              dataIndex: 'uomName',
              key: 'uomName',
            },
            {
              title: TEXT.unitGroup,
              dataIndex: 'category',
              key: 'category',
              render: (_: string, record: UomDto) => <Tag color="blue">{getDisplayUomGroup(record) || '-'}</Tag>,
            },
            {
              title: TEXT.conversionUom,
              key: 'conversionUomName',
              render: (_, record: UomDto) => record.conversionUomName ?? record.uomName,
            },
            {
              title: TEXT.conversionRatio,
              dataIndex: 'conversionRatio',
              key: 'conversionRatio',
              render: (value: number) => value ?? 1,
            },
            {
              title: TEXT.status,
              dataIndex: 'active',
              key: 'active',
              render: (value: boolean | undefined) =>
                value === false ? <Tag>{TEXT.inactive}</Tag> : <Tag color="green">{TEXT.active}</Tag>,
            },
            {
              title: TEXT.actions,
              key: 'actions',
              render: (_, record: UomDto) => {
                const isActive = record.active !== false;
                return (
                  <Space>
                    <Button size="small" onClick={() => openEdit(record)}>
                      {TEXT.edit}
                    </Button>
                    <Button size="small" danger={isActive} onClick={() => handleToggleActive(record)}>
                      {isActive ? TEXT.inactive : TEXT.activate}
                    </Button>
                  </Space>
                );
              },
            },
          ]}
          />
        </div>

        <UomHelpPanel />
      </div>

      <Modal
        title={editingUom ? TEXT.editTitle : TEXT.createTitle}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingUom(null);
        }}
        onOk={handleSave}
        okText={TEXT.save}
        cancelText={TEXT.cancel}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="uomName" label={TEXT.unitName} rules={[{ required: true, message: TEXT.nameRequired }]}>
            <Input placeholder={TEXT.namePlaceholder} />
          </Form.Item>
          <Form.Item
            name="category"
            label={TEXT.unitGroup}
            rules={[{ required: true, message: TEXT.groupRequired }]}
            tooltip={TEXT.groupTooltip}
          >
            <Select options={UOM_GROUP_OPTIONS} placeholder={TEXT.groupPlaceholder} />
          </Form.Item>
          {isPackagingGroup && (
            <>
              <Form.Item
                name="conversionUomId"
                label={TEXT.conversionUom}
                tooltip={TEXT.conversionTooltip}
                rules={[{ required: true, message: 'Vui l\u00f2ng ch\u1ecdn \u0111\u01a1n v\u1ecb chuy\u1ec3n \u0111\u1ed5i' }]}
              >
                <Select allowClear showSearch optionFilterProp="label" options={activeUomOptions} />
              </Form.Item>
              <Form.Item
                name="conversionRatio"
                label={TEXT.conversionRatio}
                rules={[{ required: true, message: TEXT.ratioRequired }]}
                tooltip={TEXT.ratioTooltip}
              >
                <InputNumber<number>
                  className="w-full"
                  min={0.0001}
                  step={1}
                  formatter={(value) => {
                    if (value === undefined || value === null) return '';
                    return String(value).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
                  }}
                  parser={(value) => Number(value?.replace(/,/g, '') || 0)}
                />
              </Form.Item>
            </>
          )}
          {editingUom && (
            <Form.Item name="active" label={TEXT.activeField} valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
