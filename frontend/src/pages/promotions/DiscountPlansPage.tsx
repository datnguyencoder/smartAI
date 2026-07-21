import * as React from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Switch, Table, Tabs, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { Card, CardHeader, Select } from '@/components/ui';
import { createDiscountPlan, fetchCategories, fetchDiscountPlans, fetchNearExpiry, updateDiscountPlan } from '@/services/wmsApi';
import type { DiscountPlanDto, CategoryDto, InventoryItemDto } from '@/types/api';
import type { Product } from '@/lib/itemMapper';

type Props = { productsList?: Product[] };

function suggestPercentByDaysLeft(daysLeft?: number) {
  if (daysLeft == null) return 15;
  if (daysLeft <= 3) return 50;
  if (daysLeft <= 7) return 30;
  if (daysLeft <= 14) return 20;
  return 10;
}

export default function DiscountPlansPage({ productsList = [] }: Props) {
  const [rows, setRows] = React.useState<DiscountPlanDto[]>([]);
  const [categories, setCategories] = React.useState<CategoryDto[]>([]);
  const [nearExpiry, setNearExpiry] = React.useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [expiryLoading, setExpiryLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DiscountPlanDto | null>(null);
  const [form] = Form.useForm();
  const planType = Form.useWatch('planType', form);
  const dealType = Form.useWatch('dealType', form);

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

  const loadNearExpiry = React.useCallback(async () => {
    setExpiryLoading(true);
    try {
      setNearExpiry(await fetchNearExpiry());
    } catch {
      setNearExpiry([]);
    } finally {
      setExpiryLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); loadNearExpiry(); }, [load, loadNearExpiry]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ planType: 'CATEGORY', dealType: 'PERCENTAGE', discountPercent: 5, buyQuantity: 2, freeQuantity: 1 });
    setModalOpen(true);
  };

  const openCreateForItem = (itemId: number, itemName: string, daysLeft?: number) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      planName: `Xả hàng cận date - ${itemName}`,
      planType: 'SKU',
      itemId,
      dealType: 'PERCENTAGE',
      discountPercent: suggestPercentByDaysLeft(daysLeft),
      buyQuantity: 2,
      freeQuantity: 1,
      startDate: dayjs(),
      endDate: dayjs().add(14, 'day'),
    });
    setModalOpen(true);
  };

  const openEdit = (row: DiscountPlanDto) => {
    setEditing(row);
    form.setFieldsValue({
      planName: row.planName,
      planType: row.planType,
      categoryId: row.categoryId,
      itemId: row.itemId,
      dealType: row.dealType ?? 'PERCENTAGE',
      discountPercent: row.discountPercent,
      buyQuantity: row.buyQuantity ?? 2,
      freeQuantity: row.freeQuantity ?? 1,
      startDate: row.startDate ? dayjs(row.startDate) : undefined,
      endDate: row.endDate ? dayjs(row.endDate) : undefined,
      active: row.active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const isBogo = values.dealType === 'BOGO';
    const payload = {
      planName: values.planName,
      planType: values.planType,
      categoryId: values.categoryId,
      itemId: values.itemId,
      dealType: values.dealType,
      discountPercent: isBogo ? undefined : Number(values.discountPercent),
      buyQuantity: isBogo ? Number(values.buyQuantity) : undefined,
      freeQuantity: isBogo ? Number(values.freeQuantity) : undefined,
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

  const dealLabel = (r: DiscountPlanDto) =>
    r.dealType === 'BOGO' ? `Mua ${r.buyQuantity} tặng ${r.freeQuantity}` : `${r.discountPercent}%`;

  const statusMeta: Record<string, { color: string; label: string }> = {
    RUNNING: { color: 'green', label: 'Đang chạy' },
    SCHEDULED: { color: 'blue', label: 'Sắp diễn ra' },
    EXPIRED: { color: 'default', label: 'Đã hết hạn' },
    DISABLED: { color: 'red', label: 'Đã tắt' },
  };

  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const filteredRows = React.useMemo(
    () => (statusFilter === 'ALL' ? rows : rows.filter((r) => (r.status ?? 'RUNNING') === statusFilter)),
    [rows, statusFilter]
  );

  return (
    <Card>
      <CardHeader
        title="Khuyến mãi & Kế hoạch giảm giá"
        description="Giảm giá theo danh mục/sản phẩm, chương trình mua tặng, và xả hàng cận date."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tạo kế hoạch</Button>}
      />
      <Tabs
        items={[
          {
            key: 'plans',
            label: `Kế hoạch giảm giá${rows.length ? ` (${rows.length})` : ''}`,
            children: (
              <>
                <div className="mb-3 flex justify-end">
                  <Select
                    className="w-48"
                    value={statusFilter}
                    onChange={(v: any) => setStatusFilter(v)}
                    options={[
                      { value: 'ALL', label: 'Tất cả trạng thái' },
                      { value: 'RUNNING', label: 'Đang chạy' },
                      { value: 'SCHEDULED', label: 'Sắp diễn ra' },
                      { value: 'EXPIRED', label: 'Đã hết hạn' },
                      { value: 'DISABLED', label: 'Đã tắt' },
                    ]}
                  />
                </div>
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredRows}
                  columns={[
                    { title: 'Tên', dataIndex: 'planName' },
                    { title: 'Loại', dataIndex: 'planType', render: (v: string) => (v === 'CATEGORY' ? 'Danh mục' : 'Sản phẩm') },
                    { title: 'Đối tượng', render: (_: unknown, r: DiscountPlanDto) => r.itemName || r.categoryName || 'Toàn cửa hàng' },
                    {
                      title: 'Ưu đãi',
                      render: (_: unknown, r: DiscountPlanDto) => (
                        <Tag color={r.dealType === 'BOGO' ? 'purple' : 'blue'}>{dealLabel(r)}</Tag>
                      ),
                    },
                    {
                      title: 'Hiệu lực',
                      render: (_: unknown, r: DiscountPlanDto) =>
                        `${r.startDate ? dayjs(r.startDate).format('DD/MM/YY') : '—'} → ${r.endDate ? dayjs(r.endDate).format('DD/MM/YY') : '—'}`,
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      render: (v: string) => {
                        const meta = statusMeta[v] ?? statusMeta.RUNNING;
                        return <Tag color={meta.color}>{meta.label}</Tag>;
                      },
                    },
                    { title: '', render: (_: unknown, r: DiscountPlanDto) => <Button type="link" onClick={() => openEdit(r)}>Sửa</Button> },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'near-expiry',
            label: `Hàng cận date${nearExpiry.length ? ` (${nearExpiry.length})` : ''}`,
            children: (
              <Table
                rowKey={(r: InventoryItemDto) => `${r.itemId}-${r.lotId ?? r.lotNumber ?? r.expiryDate}`}
                loading={expiryLoading}
                dataSource={nearExpiry}
                columns={[
                  { title: 'Sản phẩm', dataIndex: 'itemName' },
                  { title: 'Số lô', dataIndex: 'lotNumber', render: (v?: string) => v || '—' },
                  { title: 'HSD', dataIndex: 'expiryDate', render: (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
                  {
                    title: 'Còn lại',
                    dataIndex: 'daysUntilExpiry',
                    render: (v?: number) => (v != null ? <Tag color={v <= 3 ? 'red' : v <= 7 ? 'orange' : 'gold'}>{v} ngày</Tag> : '—'),
                  },
                  { title: 'Tồn kho', dataIndex: 'availableQuantity', render: (v: number) => Math.round(Number(v)) },
                  { title: 'Kho', dataIndex: 'locationName' },
                  {
                    title: '',
                    render: (_: unknown, r: InventoryItemDto) => (
                      <Button type="link" onClick={() => openCreateForItem(r.itemId, r.itemName, r.daysUntilExpiry)}>
                        Tạo KM
                      </Button>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <Modal open={modalOpen} title={editing ? 'Sửa kế hoạch' : 'Tạo kế hoạch giảm giá'} onCancel={() => setModalOpen(false)} onOk={handleSave} width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="planName" label="Tên kế hoạch" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="planType" label="Áp dụng theo" rules={[{ required: true }]} extra={editing ? 'Không thể đổi sau khi tạo — tạo kế hoạch mới nếu cần đổi đối tượng.' : undefined}>
            <Select disabled={!!editing} options={[
              { value: 'CATEGORY', label: 'Theo danh mục' },
              { value: 'SKU', label: 'Theo sản phẩm' },
            ]} />
          </Form.Item>
          {planType === 'CATEGORY' && (
            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
              <Select disabled={!!editing} options={categories.map((c) => ({ value: c.id, label: c.categoryName }))} />
            </Form.Item>
          )}
          {planType === 'SKU' && (
            <Form.Item name="itemId" label="Sản phẩm" rules={[{ required: true }]}>
              <Select
                disabled={!!editing}
                showSearch
                optionFilterProp="label"
                options={productsList.map((p) => ({ value: Number(p.key), label: `${p.sku} · ${p.name}` }))}
              />
            </Form.Item>
          )}
          <Form.Item name="dealType" label="Loại ưu đãi" rules={[{ required: true }]} extra={editing ? 'Không thể đổi loại ưu đãi sau khi tạo.' : undefined}>
            <Select disabled={!!editing} options={[
              { value: 'PERCENTAGE', label: 'Giảm giá %' },
              { value: 'BOGO', label: 'Mua X tặng Y' },
            ]} />
          </Form.Item>
          {dealType === 'BOGO' ? (
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="buyQuantity" label="Mua (số lượng)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} />
              </Form.Item>
              <Form.Item name="freeQuantity" label="Tặng (số lượng)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </div>
          ) : (
            <Form.Item name="discountPercent" label="Giảm (%)" rules={[{ required: true }]}><InputNumber className="w-full" min={0.01} max={100} /></Form.Item>
          )}
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
