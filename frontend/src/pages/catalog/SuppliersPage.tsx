import { Button, Form, Input, InputNumber, ModalTag, message as antdMessage } from 'antd';
import { motion } from 'framer-motion';
import { Plus, Search, Truck } from 'lucide-react';
import * as React from 'react';
import { AiSummary } from '@/components/ai/AiSummary';
import { Card, StatusChip, UiButton , Select } from '@/components/ui';
import { formatMoney as money, type Product } from '@/lib/itemMapper';
import { canQuickCreate, normalizeRole } from '@/lib/permissions';
import { fuzzySearch } from '@/lib/fuzzySearch';
import {
  activateSupplierItem,
  createSupplier,
  createSupplierItem,
  deactivateSupplierItem,
  fetchSupplierDebts,
  fetchSupplierDebtsBySupplier,
  fetchSupplierItems,
  recordDebtPayment,
  updateSupplier,
  updateSupplierItem,
} from '@/services/wmsApi';
import type { SupplierDebtDto, SupplierDto, SupplierItemDto, UserDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

export default function SuppliersPage({
  suppliers,
  productsList,
  authUser,
  reloadCatalog,
  setPage,
}: {
  suppliers: SupplierDto[];
  productsList: Product[];
  authUser?: UserDto;
  reloadCatalog?: () => Promise<void>;
  setPage?: (page: PageKey) => void;
}) {
  const [selectedSup, setSelectedSup] = React.useState<SupplierDto | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [debts, setDebts] = React.useState<SupplierDebtDto[]>([]);
  const [debtTab, setDebtTab] = React.useState<'info' | 'items' | 'debt'>('info');
  const [payAmounts, setPayAmounts] = React.useState<Record<number, number>>({});
  const [supplierItems, setSupplierItems] = React.useState<SupplierItemDto[]>([]);
  const [supplierItemsLoading, setSupplierItemsLoading] = React.useState(false);
  const [supplierItemPrices, setSupplierItemPrices] = React.useState<Record<number, number>>({});
  const [allDebts, setAllDebts] = React.useState<SupplierDebtDto[]>([]);

  React.useEffect(() => {
    fetchSupplierDebts().then(setAllDebts).catch(() => setAllDebts([]));
  }, []);

  const debtSummary = React.useMemo(() => {
    const unpaid = allDebts.filter((d) => d.status !== 'PAID');
    const overdue = unpaid.filter((d) => d.status === 'OVERDUE');
    const remaining = unpaid.reduce((s, d) => s + (d.remainingAmount ?? 0), 0);
    return { unpaid: unpaid.length, overdue: overdue.length, remaining };
  }, [allDebts]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm] = Form.useForm();
  const [supplierItemForm] = Form.useForm();
  const canEdit = authUser && ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(normalizeRole(authUser.role));
  const canCreate = authUser && canQuickCreate(authUser.role, 'suppliers');

  const debtStatusTag = (status: SupplierDebtDto['status']) => {
    if (status === 'PAID') return <Tag color="green">Đã trả</Tag>;
    if (status === 'OVERDUE') return <Tag color="red">Quá hạn</Tag>;
    if (status === 'PARTIAL') return <Tag color="gold">Trả một phần</Tag>;
    return <Tag color="orange">Chưa trả</Tag>;
  };

  const filteredSuppliers = React.useMemo(() => {
    return fuzzySearch(suppliers, ['supplierName', 'contactPerson', 'phone'], searchQuery);
  }, [suppliers, searchQuery]);

  const loadSupplierItems = async (supplierId: number) => {
    setSupplierItemsLoading(true);
    try {
      const data = await fetchSupplierItems(supplierId);
      setSupplierItems(data);
      setSupplierItemPrices(
        Object.fromEntries(
          data
            .filter((item) => item.defaultCostPrice != null)
            .map((item) => [item.id, Number(item.defaultCostPrice)])
        )
      );
    } catch (e) {
      setSupplierItems([]);
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được sản phẩm cung cấp');
    } finally {
      setSupplierItemsLoading(false);
    }
  };

  const handleOpen = (sup: SupplierDto) => {
    setSelectedSup(sup);
    setIsEditing(false);
    setDebtTab('info');
    supplierItemForm.resetFields();
    fetchSupplierDebtsBySupplier(sup.id).then(setDebts).catch(() => setDebts([]));
    loadSupplierItems(sup.id);
    form.setFieldsValue({
      supplierName: sup.supplierName,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      active: sup.active,
    });
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedSup) return;

      const isActive = values.active === 'true' || values.active === true;
      values.active = isActive;

      const doUpdate = async () => {
        setLoading(true);
        try {
          await updateSupplier(selectedSup.id, values);
          antdMessage.success('Cập nhật nhà cung cấp thành công');
          setIsEditing(false);
          setSelectedSup(null);
          if (reloadCatalog) await reloadCatalog();
        } catch (e: any) {
          antdMessage.error(e.message || 'Lỗi khi cập nhật');
        } finally {
          setLoading(false);
        }
      };

      if (selectedSup.active && !isActive) {
        Modal.confirm({
          title: 'Xác nhận ngừng hoạt động',
          content: 'Ngừng hoạt động nhà cung cấp này có thể ảnh hưởng đến việc nhập hàng. Bạn có chắc chắn?',
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          onOk: doUpdate
        });
      } else {
        doUpdate();
      }
    } catch (e: any) {
      if (e.errorFields) return;
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setLoading(true);
      await createSupplier({
        supplierName: values.supplierName.trim(),
        contactPerson: values.contactPerson?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        address: values.address?.trim() || undefined,
      });
      antdMessage.success('Tạo nhà cung cấp thành công');
      createForm.resetFields();
      setCreateOpen(false);
      if (reloadCatalog) await reloadCatalog();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      antdMessage.error(e instanceof Error ? e.message : 'Tạo nhà cung cấp thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplierItem = async () => {
    if (!selectedSup) return;
    try {
      const values = await supplierItemForm.validateFields();
      setSupplierItemsLoading(true);
      await createSupplierItem({
        supplierId: selectedSup.id,
        skuItem: values.skuItem,
        defaultCostPrice: values.defaultCostPrice,
      });
      antdMessage.success('Đã thêm sản phẩm cung cấp');
      supplierItemForm.resetFields();
      await loadSupplierItems(selectedSup.id);
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      antdMessage.error(e instanceof Error ? e.message : 'Thêm sản phẩm cung cấp thất bại');
    } finally {
      setSupplierItemsLoading(false);
    }
  };

  const handleToggleSupplierItem = async (item: SupplierItemDto) => {
    if (!selectedSup) return;
    try {
      setSupplierItemsLoading(true);
      if (item.active) {
        await deactivateSupplierItem(item.id);
        antdMessage.success('Đã ngưng cung cấp sản phẩm');
      } else {
        await activateSupplierItem(item.id);
        antdMessage.success('Đã kích hoạt lại sản phẩm');
      }
      await loadSupplierItems(selectedSup.id);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Cập nhật trạng thái thất bại');
    } finally {
      setSupplierItemsLoading(false);
    }
  };

  const handleUpdateSupplierItemPrice = async (item: SupplierItemDto) => {
    if (!selectedSup) return;
    try {
      setSupplierItemsLoading(true);
      await updateSupplierItem(item.id, {
        defaultCostPrice: supplierItemPrices[item.id],
      });
      antdMessage.success('Đã cập nhật giá nhập mặc định');
      await loadSupplierItems(selectedSup.id);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Cập nhật giá thất bại');
    } finally {
      setSupplierItemsLoading(false);
    }
  };

  const mappedSkuSet = new Set(supplierItems.map((item) => item.skuItem.toLowerCase()));
  const availableProducts = productsList.filter((product) => !mappedSkuSet.has(product.sku.toLowerCase()));
  const productOptions = availableProducts.map((product) => ({
    value: product.sku,
    label: product.name + ' (' + product.sku + ')',
    searchText: (product.name + ' ' + product.sku + ' ' + product.category).toLowerCase(),
    category: product.category,
    cost: product.cost,
  }));

  const renderSupplierItems = () => (
    <div className="space-y-3">
      {canEdit && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Form form={supplierItemForm} layout="vertical">
            <Form.Item name="skuItem" label="Sản phẩm" rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}>
              <Select
                showSearch
                placeholder="Tìm theo tên, SKU hoặc danh mục"
                options={productOptions}
                optionRender={(option) => (
                  <div>
                    <div className="font-medium">{option.data.label}</div>
                    <div className="text-xs text-slate-500">
                      SKU: {option.data.value} - {option.data.category} - Giá vốn: {money(Number(option.data.cost ?? 0))}
                    </div>
                  </div>
                )}
                filterOption={(input, option) =>
                  String((option as { searchText?: string })?.searchText ?? '').includes(input.toLowerCase())
                }
                onChange={(sku) => {
                  const product = productsList.find((p) => p.sku === sku);
                  if (product) {
                    supplierItemForm.setFieldValue('defaultCostPrice', product.cost);
                  }
                }}
              />
            </Form.Item>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <Form.Item name="defaultCostPrice" label="Giá nhập mặc định" className="mb-0">
                <InputNumber min={1} className="w-full" />
              </Form.Item>
              <Button type="primary" onClick={handleCreateSupplierItem} loading={supplierItemsLoading}>
                Thêm
              </Button>
            </div>
          </Form>
        </div>
      )}

      <div className="space-y-2">
        {supplierItems.length === 0 ? (
          <p className="text-slate-400">Nhà cung cấp này chưa được gán sản phẩm nào</p>
        ) : supplierItems.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-800">{item.itemName || item.skuItem}</div>
                <div className="text-xs text-slate-500">SKU: {item.skuItem}</div>
                <div className="mt-1">
                  <Tag color={item.active ? 'green' : 'default'}>{item.active ? 'Đang cung cấp' : 'Đã ngưng'}</Tag>
                </div>
              </div>
              {canEdit && (
                <Button size="small" danger={item.active} onClick={() => handleToggleSupplierItem(item)}>
                  {item.active ? 'Ngưng' : 'Kích hoạt lại'}
                </Button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 items-center">
              <InputNumber
                min={1}
                className="w-full"
                disabled={!canEdit}
                placeholder="Giá nhập mặc định"
                value={supplierItemPrices[item.id] ?? Number(item.defaultCostPrice ?? 0)}
                onChange={(value) => setSupplierItemPrices((prev) => ({ ...prev, [item.id]: Number(value) || 0 }))}
              />
              {canEdit && (
                <Button size="small" onClick={() => handleUpdateSupplierItemPrice(item)}>
                  Lưu giá
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted">Công nợ chưa trả</p>
            <p className="text-2xl font-bold text-ink">{debtSummary.unpaid}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">Quá hạn</p>
            <p className="text-2xl font-bold text-red-600">{debtSummary.overdue}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">Tổng còn phải trả</p>
            <p className="text-2xl font-bold text-primary">{money(debtSummary.remaining)}</p>
          </Card>
        </div>
      <Card>
        <div className="p-5 flex items-center justify-between border-b border-slate-100 gap-3">
          <h2 className="font-semibold text-lg">Nhà cung cấp đối tác</h2>
          <div className="flex items-center gap-2">
            <Input className="w-64" prefix={<Search size={16} />} placeholder="Tìm theo tên, SĐT..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} allowClear />
            {canCreate && (
              <UiButton variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} className="mr-1 inline" /> Thêm NCC
              </UiButton>
            )}
          </div>
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {filteredSuppliers.map((sup) => (
            <motion.div whileHover={{ y: -3 }} onClick={() => handleOpen(sup)} className="cursor-pointer rounded-xl border border-line bg-slate-50 p-4 transition-colors hover:bg-slate-100 hover:border-indigo-300" key={sup.id}>
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo">
                  <Truck size={18} />
                </div>
                <StatusChip tone={sup.active ? 'success' : 'warning'}>{sup.active ? 'Hoạt động' : 'Ngưng'}</StatusChip>
              </div>
              <strong className="text-ink text-base">{sup.supplierName}</strong>
              <p className="text-xs text-muted mt-0.5">{sup.contactPerson ?? '—'} · {sup.phone ?? '—'}</p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                {productsList.length} SKU trong hệ thống
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
      </div>
      <AiSummary setPage={setPage ?? (() => {})} />
      <Modal
        title={isEditing ? 'Sửa thông tin Nhà cung cấp' : selectedSup ? 'Chi tiết: ' + selectedSup.supplierName : 'Chi tiết'}
        open={!!selectedSup}
        onCancel={() => { setSelectedSup(null); setIsEditing(false); supplierItemForm.resetFields(); }}
        width={760}
        footer={
          isEditing ? (
            <div className="flex justify-end gap-2">
              <UiButton variant="secondary" onClick={() => setIsEditing(false)} disabled={loading}>Hủy</UiButton>
              <UiButton variant="primary" onClick={handleUpdate} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</UiButton>
            </div>
          ) : (
            canEdit ? <UiButton variant="primary" onClick={() => setIsEditing(true)}>Chỉnh sửa</UiButton> : null
          )
        }
        forceRender
      >
        {selectedSup && !isEditing && (
          <div className="space-y-3 mt-4 text-sm text-slate-700">
            <div className="flex flex-wrap gap-2 mb-3">
              <Button type={debtTab === 'info' ? 'primary' : 'default'} size="small" onClick={() => setDebtTab('info')}>Thông tin</Button>
              <Button type={debtTab === 'items' ? 'primary' : 'default'} size="small" onClick={() => setDebtTab('items')}>Sản phẩm cung cấp ({supplierItems.length})</Button>
              <Button type={debtTab === 'debt' ? 'primary' : 'default'} size="small" onClick={() => setDebtTab('debt')}>Công nợ ({debts.length})</Button>
            </div>
            {debtTab === 'items' ? renderSupplierItems() : debtTab === 'info' ? (
              <>
                <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Tên NCC:</span><span>{selectedSup.supplierName}</span></div>
                <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Người liên hệ:</span><span>{selectedSup.contactPerson || '—'}</span></div>
                <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">SĐT:</span><span>{selectedSup.phone || '—'}</span></div>
                <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Email:</span><span>{selectedSup.email || '—'}</span></div>
                <div className="grid grid-cols-[120px_1fr]"><span className="font-semibold text-slate-500">Địa chỉ:</span><span>{selectedSup.address || '—'}</span></div>
              </>
            ) : (
              <div className="space-y-3">
                {debts.length === 0 ? <p className="text-slate-400">Không có công nợ</p> : debts.map((d) => (
                  <div key={d.id} className="border rounded-lg p-3">
                    <div className="flex justify-between"><span>PO #{d.purchaseOrderId}</span>{debtStatusTag(d.status)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Tổng: {money(d.amount)} · Đã trả: {money(d.paidAmount)} · Còn: {money(d.remainingAmount)}
                      {d.dueDate ? ' · Hạn: ' + d.dueDate : ''}
                    </div>
                    {d.status !== 'PAID' && canEdit && (
                      <div className="flex gap-2 mt-2">
                        <InputNumber
                          min={1}
                          max={d.remainingAmount}
                          value={payAmounts[d.id] ?? d.remainingAmount}
                          onChange={(v) => setPayAmounts((prev) => ({ ...prev, [d.id]: Number(v) || 0 }))}
                          className="flex-1"
                        />
                        <Button size="small" type="primary" onClick={async () => {
                          const amount = payAmounts[d.id] || d.remainingAmount;
                          try {
                            await recordDebtPayment(d.id, { amount, paymentMethod: 'BANK_TRANSFER' });
                            antdMessage.success('Ghi nhận thanh toán');
                            fetchSupplierDebtsBySupplier(selectedSup!.id).then(setDebts);
                          } catch (e: unknown) {
                            antdMessage.error(e instanceof Error ? e.message : 'Thanh toán thất bại');
                          }
                        }}>Thanh toán</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedSup && isEditing && (
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="supplierName" label="Tên nhà cung cấp" rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}>
              <Input placeholder="Nhập tên" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="contactPerson" label="Người liên hệ">
                <Input placeholder="Tên người đại diện" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="Nhập SĐT" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="email" label="Email" className="col-span-2">
                <Input type="email" placeholder="Nhập email" />
              </Form.Item>
            </div>
            <Form.Item name="address" label="Địa chỉ">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
            <Form.Item name="active" label="Trạng thái">
              <select className="h-[34px] w-full px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white">
                <option value="true">Hoạt động</option>
                <option value="false">Ngưng</option>
              </select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="Thêm nhà cung cấp mới"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={handleCreate}
        okText="Tạo"
        cancelText="Hủy"
        confirmLoading={loading}
        forceRender
      >
        <Form form={createForm} layout="vertical" className="mt-2">
          <Form.Item name="supplierName" label="Tên nhà cung cấp" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Công ty TNHH ABC" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="contactPerson" label="Người liên hệ">
              <Input placeholder="Người đại diện" />
            </Form.Item>
            <Form.Item name="phone" label="SĐT">
              <Input placeholder="0901234567" />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="contact@company.vn" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Địa chỉ giao dịch" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
