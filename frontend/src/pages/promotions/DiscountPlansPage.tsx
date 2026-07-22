import * as React from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Segmented, Switch, Table, Tabs, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Gift, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Card, CardHeader, Select } from '@/components/ui';
import { createDiscountPlan, deleteDiscountPlan, fetchCategories, fetchDiscountPlans, fetchNearExpiry, updateDiscountPlan } from '@/services/wmsApi';
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
  const giftMode = Form.useWatch('giftMode', form);
  const categoryId = Form.useWatch('categoryId', form);
  const itemId = Form.useWatch('itemId', form);
  const discountPercent = Form.useWatch('discountPercent', form);
  const buyQuantity = Form.useWatch('buyQuantity', form);
  const freeQuantity = Form.useWatch('freeQuantity', form);
  const giftItemId = Form.useWatch('giftItemId', form);
  const fixedAmount = Form.useWatch('fixedAmount', form);
  const minQuantity = Form.useWatch('minQuantity', form);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [plans, cats] = await Promise.all([fetchDiscountPlans(), fetchCategories()]);
      setRows(plans ?? []);
      setCategories(cats ?? []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải chiến dịch khuyến mãi');
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
    form.setFieldsValue({
      planType: 'CATEGORY', dealType: 'PERCENTAGE', discountPercent: 5,
      buyQuantity: 2, freeQuantity: 1, giftMode: 'SAME',
    });
    setModalOpen(true);
  };

  const openCreateForItem = (itemIdArg: number, itemName: string, daysLeft?: number) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      planName: `Xả hàng cận date - ${itemName}`,
      planType: 'SKU',
      itemId: itemIdArg,
      dealType: 'PERCENTAGE',
      discountPercent: suggestPercentByDaysLeft(daysLeft),
      buyQuantity: 2,
      freeQuantity: 1,
      giftMode: 'SAME',
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
      giftMode: row.giftItemId ? 'OTHER' : 'SAME',
      giftItemId: row.giftItemId,
      fixedAmount: row.fixedAmount,
      minQuantity: row.minQuantity ?? 1,
      startDate: row.startDate ? dayjs(row.startDate) : undefined,
      endDate: row.endDate ? dayjs(row.endDate) : undefined,
      active: row.active,
      priority: row.priority ?? 0,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const isBogo = values.dealType === 'BOGO';
    const isFixedAmount = values.dealType === 'FIXED_AMOUNT';
    const isGiftOther = isBogo && values.giftMode === 'OTHER';
    if (isGiftOther && !values.giftItemId) {
      message.error('Chọn sản phẩm dùng làm quà tặng');
      return;
    }
    const payload = {
      planName: values.planName,
      planType: values.planType,
      categoryId: values.categoryId,
      itemId: values.itemId,
      dealType: values.dealType,
      discountPercent: isBogo || isFixedAmount ? undefined : Number(values.discountPercent),
      buyQuantity: isBogo ? Number(values.buyQuantity) : undefined,
      freeQuantity: isBogo ? Number(values.freeQuantity) : undefined,
      fixedAmount: isFixedAmount ? Number(values.fixedAmount) : undefined,
      minQuantity: isBogo ? undefined : Number(values.minQuantity ?? 1),
      giftItemId: editing
        ? (isGiftOther ? Number(values.giftItemId) : 0) // 0 = xoá về mặc định khi sửa
        : (isGiftOther ? Number(values.giftItemId) : undefined),
      startDate: values.startDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
      active: values.active,
      priority: values.priority !== undefined ? Number(values.priority) : undefined,
    };
    try {
      if (editing) {
        await updateDiscountPlan(editing.id, payload);
        message.success('Cập nhật thành công');
      } else {
        await createDiscountPlan(payload);
        message.success('Tạo chiến dịch thành công');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDiscountPlan(id);
      message.success('Đã xoá chiến dịch');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không xoá được chiến dịch');
    }
  };

  const dealLabel = (r: DiscountPlanDto) => {
    if (r.dealType === 'FIXED_AMOUNT') {
      return `Giảm ${(r.fixedAmount ?? 0).toLocaleString('vi-VN')}đ`;
    }
    if (r.dealType !== 'BOGO') return `${r.discountPercent}%`;
    return r.giftItemId
      ? `Mua ${r.buyQuantity} tặng ${r.freeQuantity} × ${r.giftItemName}`
      : `Mua ${r.buyQuantity} tặng ${r.freeQuantity}`;
  };

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

  // ── Xem trước trực quan trong modal — giúp người tạo thấy ngay ưu đãi trông
  // như thế nào trước khi lưu, tránh nhầm lẫn giữa "tặng cùng SP" và "tặng SP khác".
  const previewText = React.useMemo(() => {
    const targetName =
      planType === 'CATEGORY'
        ? categories.find((c) => c.id === categoryId)?.categoryName
        : productsList.find((p) => Number(p.key) === itemId)?.name;
    if (!targetName) return null;

    const minQtyPrefix = minQuantity && minQuantity > 1 ? `Mua từ ${minQuantity} "${targetName}" trở lên` : `Mua "${targetName}"`;
    if (dealType === 'PERCENTAGE') {
      if (!discountPercent) return null;
      return { icon: TagIcon, text: `${minQtyPrefix} → giảm ${discountPercent}%` };
    }
    if (dealType === 'FIXED_AMOUNT') {
      if (!fixedAmount) return null;
      return { icon: TagIcon, text: `${minQtyPrefix} → giảm ${Number(fixedAmount).toLocaleString('vi-VN')}đ` };
    }
    if (dealType === 'BOGO') {
      if (!buyQuantity || !freeQuantity) return null;
      if (giftMode === 'OTHER') {
        const giftName = productsList.find((p) => Number(p.key) === giftItemId)?.name;
        if (!giftName) return { icon: Gift, text: `Mua ${buyQuantity} "${targetName}" → chọn sản phẩm quà tặng bên dưới` };
        return { icon: Gift, text: `Mua ${buyQuantity} "${targetName}" → TẶNG ${freeQuantity} "${giftName}" (miễn phí)` };
      }
      return { icon: Gift, text: `Mua ${buyQuantity} "${targetName}" → TẶNG THÊM ${freeQuantity} "${targetName}" (cùng loại, miễn phí)` };
    }
    return null;
  }, [planType, categoryId, itemId, dealType, discountPercent, fixedAmount, minQuantity, buyQuantity, freeQuantity, giftMode, giftItemId, categories, productsList]);

  // ── Chỉ cho chọn sản phẩm còn hàng khi tạo/sửa chiến dịch, tránh rối vì danh sách
  // dài lẫn lộn cả hàng hết hàng. Vẫn giữ lại sản phẩm đang được chọn (khi sửa) dù
  // hết hàng, để không hiện ô trống gây hiểu nhầm là mất dữ liệu.
  const inStockProducts = React.useMemo(() => productsList.filter((p) => p.stock > 0), [productsList]);

  const itemOptions = React.useMemo(() => {
    if (itemId && !inStockProducts.some((p) => Number(p.key) === itemId)) {
      const current = productsList.find((p) => Number(p.key) === itemId);
      if (current) return [...inStockProducts, current];
    }
    return inStockProducts;
  }, [inStockProducts, productsList, itemId]);

  const giftItemOptions = React.useMemo(() => {
    let list = inStockProducts.filter((p) => Number(p.key) !== itemId);
    if (giftItemId && !list.some((p) => Number(p.key) === giftItemId)) {
      const current = productsList.find((p) => Number(p.key) === giftItemId);
      if (current) list = [...list, current];
    }
    return list;
  }, [inStockProducts, productsList, itemId, giftItemId]);

  return (
    <Card>
      <CardHeader
        title="Chiến dịch khuyến mãi"
        description="Giảm giá theo danh mục/sản phẩm, chương trình mua tặng (cùng SP hoặc SP khác), và xả hàng cận date."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tạo chiến dịch</Button>}
      />
      <Tabs
        items={[
          {
            key: 'plans',
            label: `Chiến dịch khuyến mãi${rows.length ? ` (${rows.length})` : ''}`,
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
                        <div className="flex flex-col gap-1">
                          <Tag
                            icon={r.dealType === 'BOGO' ? <Gift size={12} className="mr-1 inline align-text-bottom" /> : undefined}
                            color={r.dealType === 'BOGO' ? (r.giftItemId ? 'magenta' : 'purple') : r.dealType === 'FIXED_AMOUNT' ? 'gold' : 'blue'}
                          >
                            {dealLabel(r)}
                          </Tag>
                          {!!r.minQuantity && r.minQuantity > 1 && (
                            <span className="text-xs text-slate-500">Từ {r.minQuantity} sản phẩm</span>
                          )}
                        </div>
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
                    {
                      title: '',
                      render: (_: unknown, r: DiscountPlanDto) => (
                        <div className="flex items-center gap-1">
                          <Button type="link" onClick={() => openEdit(r)}>Sửa</Button>
                          <Popconfirm
                            title="Xoá chiến dịch này?"
                            description="Không thể hoàn tác. Đơn hàng cũ đã áp dụng chiến dịch này vẫn giữ nguyên."
                            okText="Xoá"
                            okButtonProps={{ danger: true }}
                            cancelText="Huỷ"
                            onConfirm={() => handleDelete(r.id)}
                          >
                            <Button type="link" danger icon={<Trash2 size={14} />} />
                          </Popconfirm>
                        </div>
                      ),
                    },
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
      <Modal open={modalOpen} title={editing ? 'Sửa chiến dịch' : 'Tạo chiến dịch khuyến mãi'} onCancel={() => setModalOpen(false)} onOk={handleSave} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="planName" label="Tên chiến dịch" rules={[{ required: true }]}><Input placeholder="VD: Mua 1 tặng 1 Coca-Cola" /></Form.Item>
          <Form.Item name="planType" label="Áp dụng theo" rules={[{ required: true }]} extra={editing ? 'Không thể đổi sau khi tạo — tạo chiến dịch mới nếu cần đổi đối tượng.' : undefined}>
            <Select disabled={!!editing} options={[
              { value: 'CATEGORY', label: 'Theo danh mục' },
              { value: 'SKU', label: 'Theo sản phẩm' },
            ]} />
          </Form.Item>
          {planType === 'CATEGORY' && (
            <Form.Item name="categoryId" label="Danh mục cần mua" rules={[{ required: true }]}>
              <Select disabled={!!editing} options={categories.map((c) => ({ value: c.id, label: c.categoryName }))} />
            </Form.Item>
          )}
          {planType === 'SKU' && (
            <Form.Item name="itemId" label="Sản phẩm cần mua" rules={[{ required: true }]} extra="Chỉ hiện sản phẩm còn hàng.">
              <Select
                disabled={!!editing}
                showSearch
                optionFilterProp="label"
                notFoundContent="Không có sản phẩm còn hàng phù hợp"
                options={itemOptions.map((p) => ({ value: Number(p.key), label: `${p.sku} · ${p.name}` }))}
              />
            </Form.Item>
          )}
          <Form.Item name="dealType" label="Loại ưu đãi" rules={[{ required: true }]} extra={editing ? 'Không thể đổi loại ưu đãi sau khi tạo.' : undefined}>
            <Select disabled={!!editing} options={[
              { value: 'PERCENTAGE', label: 'Giảm giá %' },
              { value: 'BOGO', label: 'Mua tặng (mua X tặng Y)' },
              { value: 'FIXED_AMOUNT', label: 'Giảm số tiền cố định (VND)' },
            ]} />
          </Form.Item>

          {dealType === 'BOGO' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Form.Item name="buyQuantity" label="Mua (số lượng)" rules={[{ required: true }]}>
                  <InputNumber className="w-full" min={1} />
                </Form.Item>
                <Form.Item name="freeQuantity" label="Tặng (số lượng)" rules={[{ required: true }]}>
                  <InputNumber className="w-full" min={1} />
                </Form.Item>
              </div>
              <Form.Item name="giftMode" label="Quà tặng là gì?">
                <Segmented
                  block
                  options={[
                    { label: 'Tặng thêm chính SP đang mua', value: 'SAME' },
                    { label: 'Tặng SP khác (mua 1 tặng kèm quà)', value: 'OTHER' },
                  ]}
                />
              </Form.Item>
              {giftMode === 'OTHER' && (
                <Form.Item
                  name="giftItemId"
                  label="Sản phẩm dùng làm quà tặng"
                  rules={[{ required: true, message: 'Chọn sản phẩm quà tặng' }]}
                  extra="Chỉ hiện sản phẩm còn hàng. Nhân viên POS phải quét CẢ sản phẩm khách mua VÀ sản phẩm quà vào giỏ — hệ thống sẽ tự miễn phí phần quà."
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="VD: Móc khóa, ly giữ nhiệt..."
                    notFoundContent="Không có sản phẩm còn hàng phù hợp"
                    options={giftItemOptions.map((p) => ({ value: Number(p.key), label: `${p.sku} · ${p.name}` }))}
                  />
                </Form.Item>
              )}
            </>
          ) : dealType === 'FIXED_AMOUNT' ? (
            <Form.Item name="fixedAmount" label="Số tiền giảm (VND)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={1000} step={1000} />
            </Form.Item>
          ) : (
            <Form.Item name="discountPercent" label="Giảm (%)" rules={[{ required: true }]}><InputNumber className="w-full" min={0.01} max={100} /></Form.Item>
          )}
          {dealType !== 'BOGO' && (
            <Form.Item
              name="minQuantity"
              label="Số lượng mua tối thiểu để được áp dụng"
              tooltip="VD: mua từ 3 sản phẩm trở lên mới được giảm. Mặc định 1 = luôn áp dụng."
              initialValue={1}
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>
          )}

          {previewText && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
              <previewText.icon size={16} className="shrink-0" />
              <span>{previewText.text}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="startDate" label="Từ ngày"><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="endDate" label="Đến ngày"><DatePicker className="w-full" /></Form.Item>
          </div>
          <Form.Item
            name="priority"
            label="Độ ưu tiên"
            tooltip="Khi 1 sản phẩm khớp nhiều chiến dịch cùng lúc, chiến dịch có độ ưu tiên cao hơn sẽ thắng. Để mặc định 0 nếu không có xung đột."
            initialValue={0}
          >
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>
          {editing && <Form.Item name="active" label="Kích hoạt" valuePropName="checked"><Switch /></Form.Item>}
        </Form>
      </Modal>
    </Card>
  );
}
