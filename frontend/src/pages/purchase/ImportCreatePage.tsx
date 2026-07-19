import React from 'react';
import { Form, InputNumber, Button, message as antdMessage, Alert, Spin, Segmented } from 'antd';
import { Trash2, Plus, FileText, Package, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';
import { createPurchaseOrder, fetchItemsBySupplier } from '@/services/wmsApi';
import type { Product } from '@/lib/itemMapper';
import { formatMoney as money } from '@/lib/itemMapper';
import type { SupplierDto, LocationDto, ItemDto } from '@/types/api';
import type { PageKey, PurchaseSuggestionPrefillItem } from '@/types/pages';
import { AiSummary } from '@/components/ai/AiSummary';
import { useAuth } from '@/contexts/AuthContext';
import { useFormDraft } from '@/hooks/useFormDraft';

type FormValues = {
  supplierId?: number;
  locationId?: number;
  items: { itemId: number | ''; inputMode?: ImportMode; quantity: number; price: number; expiryDate?: string }[];
};

type ImportMode = 'base' | 'purchase';

const getPurchaseRatio = (item?: ItemDto | Product) => {
  if (!item) return 1;
  const conversionRatio = 'purchaseConversionRatio' in item ? item.purchaseConversionRatio : undefined;
  const ratio = Number(conversionRatio ?? item.purchaseRatio ?? 1);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
};

const getDefaultImportMode = (item?: ItemDto | Product): ImportMode => {
  if (!item?.purchaseUomName || item.purchaseUomName === item.baseUomName) return 'base';
  return getPurchaseRatio(item) > 1 ? 'purchase' : 'base';
};

const getLineRatio = (item?: ItemDto | Product, mode?: ImportMode) =>
  mode === 'purchase' ? getPurchaseRatio(item) : 1;

const getLineUomName = (item?: ItemDto | Product, mode?: ImportMode) =>
  mode === 'purchase'
    ? item?.purchaseUomName || item?.baseUomName || ''
    : item?.baseUomName || item?.purchaseUomName || '';

const getBaseUomName = (item?: ItemDto | Product) =>
  item?.baseUomName || item?.purchaseUomName || '';

const getSupplierCostPrice = (item?: ItemDto | Product) => {
  if (!item) return 0;
  const price = 'costPrice' in item ? item.costPrice : item.cost;
  const normalizedPrice = Number(price);
  return Number.isFinite(normalizedPrice) ? normalizedPrice : 0;
};

const calculateLineTotal = (quantity?: number, basePrice?: number, item?: ItemDto | Product, mode?: ImportMode) =>
  Number(quantity || 0) * getLineRatio(item, mode) * Number(basePrice || 0);

const ReadOnlyPrice = ({ value }: { value?: number }) => (
  <div className="h-[40px] px-3 flex items-center bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
    {value ? new Intl.NumberFormat('vi-VN').format(value) : '0'}
  </div>
);

function TotalPriceDisplay({ form, supplierItems }: { form: any; supplierItems: ItemDto[] }) {
  const itemsWatch = Form.useWatch('items', form);
  const total = (itemsWatch || []).reduce(
    (acc: number, line: any) => {
      const item = supplierItems.find((p) => String(p.id) === String(line?.itemId));
      return acc + calculateLineTotal(line?.quantity, line?.price, item, line?.inputMode);
    },
    0
  );
  return <span>{money(total)}</span>;
}

function ItemsCount({ form }: { form: any }) {
  const itemsWatch = Form.useWatch('items', form);
  const count = (itemsWatch || []).filter((i: any) => i?.itemId).length;
  return <span>{count}</span>;
}

export default function ImportCreatePage({
  productsList,
  suppliers,
  locations,
  setPage,
  reloadCatalog,
  catalogLoading,
  prefillItems = [],
  clearPrefillItems,
}: {
  productsList: Product[];
  suppliers: SupplierDto[];
  locations: LocationDto[];
  setPage: (page: PageKey) => void;
  reloadCatalog: () => Promise<void>;
  catalogLoading?: boolean;
  prefillItems?: PurchaseSuggestionPrefillItem[];
  clearPrefillItems?: () => void;
}) {
  const [form] = Form.useForm<FormValues>();
  const { clearDraft, saveDraft } = useFormDraft(form, 'draft_import_create');
  const { authUser } = useAuth();
  const canEditPrice = authUser?.role === 'ROLE_MANAGER' || authUser?.role === 'ROLE_ADMIN';
  const [submitting, setSubmitting] = React.useState(false);
  const [paymentDeferred, setPaymentDeferred] = React.useState(false);
  const [supplierItems, setSupplierItems] = React.useState<ItemDto[]>([]);
  const [loadingSupplierItems, setLoadingSupplierItems] = React.useState(false);
  const selectedSupplierId = Form.useWatch('supplierId', form);

  React.useEffect(() => {
    if (prefillItems.length === 0 || productsList.length === 0) {
      return;
    }
    const items = prefillItems.flatMap((prefill) => {
      const product = productsList.find((p) => Number(p.key) === prefill.itemId);
      if (!product) return [];
      const quantity = Math.max(1, Math.ceil(Number(prefill.suggestedQty) || 1));
      const price = Number(getSupplierCostPrice(product).toFixed(2));
      return [{ itemId: prefill.itemId, inputMode: 'base' as ImportMode, quantity, price }];
    });

    if (items.length > 0) {
      // Set supplierId CÙNG LÚC với items (không gọi handleSupplierChange vì nó reset
      // items về rỗng). useEffect theo dõi selectedSupplierId bên dưới sẽ tự fetch
      // supplierItems; một khi options đó load xong, <select> sẽ tự khớp đúng itemId
      // đã set sẵn trong form state — không cần set lại itemId lần 2.
      const supplierId = prefillItems.find((p) => p.supplierId != null)?.supplierId;
      form.setFieldsValue({
        ...(supplierId != null ? { supplierId } : {}),
        items,
      });
      antdMessage.info(
        supplierId != null
          ? 'Đã điền sản phẩm và nhà cung cấp từ gợi ý nhập hàng'
          : 'Đã điền số lượng từ gợi ý — sản phẩm này chưa có NCC mặc định, vui lòng chọn NCC'
      );
      clearPrefillItems?.();
    }
  }, [clearPrefillItems, form, prefillItems, productsList]);

  React.useEffect(() => {
    if (selectedSupplierId && supplierItems.length === 0 && !loadingSupplierItems) {
      setLoadingSupplierItems(true);
      fetchItemsBySupplier(selectedSupplierId)
        .then(setSupplierItems)
        .catch((e) => antdMessage.error(e instanceof Error ? e.message : 'Không tải được sản phẩm của nhà cung cấp'))
        .finally(() => setLoadingSupplierItems(false));
    }
  }, [selectedSupplierId, supplierItems.length, loadingSupplierItems]);

  const handleSupplierChange = async (supplierId: number) => {
    form.setFieldsValue({
      supplierId,
      items: [{ itemId: '', inputMode: 'purchase', quantity: 50, price: 0 }],
    });

    setSupplierItems([]);

    if (!supplierId) return;

    setLoadingSupplierItems(true);
    try {
      const data = await fetchItemsBySupplier(supplierId);
      setSupplierItems(data);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được sản phẩm của nhà cung cấp');
    } finally {
      setLoadingSupplierItems(false);
    }
  };
  const handleCreateSlip = async (values: FormValues) => {
    if (!values.items || values.items.length === 0) {
      antdMessage.error('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }
    if (values.supplierId == null || values.locationId == null) {
      antdMessage.error('Vui lòng chọn nhà cung cấp và vị trí kho');
      return;
    }
    setSubmitting(true);
    try {
      const po = await createPurchaseOrder({
        supplierId: values.supplierId,
        locationId: values.locationId,
        paymentDeferred,
        items: values.items.map((i: any) => {
          const item = supplierItems.find((p) => String(p.id) === String(i.itemId));
          const ratio = getLineRatio(item, i.inputMode);

          return {
            itemId: Number(i.itemId),
            quantity: Number(i.quantity) * ratio,
            unitPrice: Number(i.price),
            expiryDate: i.expiryDate || undefined,
          };
        }),
      });
      await reloadCatalog();
      antdMessage.success(`Tạo phiếu nhập PN-${po.id} thành công!`);
      clearDraft();
      form.resetFields();
      setPage('import-slips');
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Tạo phiếu nhập thất bại (cần quyền kho: warehouse/admin)');
    } finally {
      setSubmitting(false);
    }
  };

  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spin size="large" tip="Đang tải dữ liệu...">
          <div className="w-10 h-10" />
        </Spin>
      </div>
    );
  }

  const selectClass =
    "w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 transition-all hover:border-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      {/* Cảnh báo */}
      {suppliers.length === 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertTriangle size={18} />}
          message="Chưa có nhà cung cấp nào. Vui lòng tạo nhà cung cấp trước khi tạo phiếu nhập."
          className="lg:col-span-2 rounded-xl border-amber-200"
        />
      )}
      {locations.length === 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertTriangle size={18} />}
          message="Chưa có kho nào được cấu hình. Vui lòng tạo kho trước khi tạo phiếu nhập."
          className="lg:col-span-2 rounded-xl border-amber-200"
        />
      )}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-transparent">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 leading-tight">
                Lập phiếu nhập hàng
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Chọn nhà cung cấp, kho nhận và thêm các sản phẩm cần nhập
              </p>
            </div>
          </div>
        </div>

        <Form
          layout="vertical"
          form={form}
          onFinish={handleCreateSlip}
          onValuesChange={saveDraft}
          className="px-6 pt-6 pb-6"
          initialValues={{ supplierId: "", locationId: "", items: [{ itemId: '', inputMode: 'purchase', quantity: 50, price: 0 }] }}
        >
          {/* Thông tin chung */}
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="supplierId"
              label={<span className="font-medium text-slate-700">Nhà cung cấp</span>}
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <select
                className={selectClass}
                onChange={(e) => handleSupplierChange(Number(e.target.value))}
              >
                <option value="" disabled>-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.supplierName}</option>
                ))}
              </select>
            </Form.Item>
            <Form.Item
              name="locationId"
              label={<span className="font-medium text-slate-700">Kho nhận</span>}
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <select
                className={selectClass}
                onChange={(e) => form.setFieldsValue({ locationId: Number(e.target.value) })}
              >
                <option value="" disabled>-- Chọn kho nhận --</option>
                {locations.filter(l => l.parentId).map((l) => (
                  <option key={l.id} value={l.id}>{l.locationName}</option>
                ))}
              </select>
            </Form.Item>
          </div>
          <Form.Item label={<span className="font-medium text-slate-700">Thanh toán</span>}>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={paymentDeferred} onChange={(e) => setPaymentDeferred(e.target.checked)} />
              Thanh toán sau (tạo công nợ NCC khi nhận hàng)
            </label>
          </Form.Item>

          {/* Divider có nhãn */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Package size={18} className="text-emerald-600" />
              Danh sách sản phẩm nhập
            </div>
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-500">
              <ItemsCount form={form} /> mặt hàng
            </span>
          </div>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <div className="space-y-3">
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div
                      key={key}
                      className="relative bg-white border border-slate-200 rounded-xl p-4 transition-all hover:border-emerald-200 hover:shadow-sm"
                    >
                      {/* Số thứ tự */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          Sản phẩm {index + 1}
                        </span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(name)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            aria-label="Xoá"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-24 gap-3 items-end">
                        <Form.Item
                          {...restField}
                          name={[name, 'itemId']}
                          label={<span className="text-xs font-medium text-slate-600 whitespace-nowrap">Sản phẩm</span>}
                          rules={[{ required: true, message: 'Bắt buộc' }]}
                          className="mb-0 md:col-span-6 xl:col-span-7"
                        >
                          <select
                            className={selectClass}
                            disabled={!selectedSupplierId || loadingSupplierItems}
                            onChange={(e) => {
                              const val = e.target.value;
                              form.setFieldValue(['items', name, 'itemId'], val);

                              const item = supplierItems.find((p) => String(p.id) === String(val));

                              if (item) {
                                form.setFieldValue(['items', name, 'inputMode'], getDefaultImportMode(item));
                                form.setFieldValue(['items', name, 'price'], Number(getSupplierCostPrice(item).toFixed(2)));
                              }
                            }}
                          >
                            <option value="" disabled>
                              {selectedSupplierId ? '-- Chọn sản phẩm --' : '-- Chọn nhà cung cấp trước --'}
                            </option>

                            {supplierItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.itemName} ({item.itemCode})
                              </option>
                            ))}
                          </select>
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'inputMode']}
                          label={<span className="text-xs font-medium text-slate-600 whitespace-nowrap">{'Nh\u1eadp theo'}</span>}
                          rules={[{ required: true, message: 'B\u1eaft bu\u1ed9c' }]}
                          className="mb-0 md:col-span-6 xl:col-span-5 min-w-[190px]"
                        >
                          <Segmented
                            size="large"
                            className="w-full min-w-[178px]"
                            options={[
                              { label: '\u0110\u01a1n v\u1ecb l\u1ebb', value: 'base' },
                              { label: '\u0110\u00f3ng g\u00f3i', value: 'purchase' },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label={
                            <Form.Item
                              shouldUpdate={(prevValues, currentValues) => {
                                const prev = prevValues.items?.[name];
                                const curr = currentValues.items?.[name];
                                return prev?.itemId !== curr?.itemId || prev?.inputMode !== curr?.inputMode;
                              }}
                              noStyle
                            >
                              {({ getFieldValue }) => {
                                const selectedId = getFieldValue(['items', name, 'itemId']);
                                const mode = getFieldValue(['items', name, 'inputMode']) as ImportMode | undefined;
                                const p = supplierItems.find((p) => String(p.id) === String(selectedId));
                                const uom = getLineUomName(p, mode);
                                const ratio = getLineRatio(p, mode);
                                const baseUom = getBaseUomName(p);
                                return (
                                  <span className="text-xs font-medium text-slate-600">
                                    {'S\u1ed1 l\u01b0\u1ee3ng'} {uom ? '(' + uom + ')' : ''}
                                    {p && uom && baseUom && (
                                      <span className="block text-[10px] text-emerald-600 font-normal leading-tight mt-0.5">
                                        1 {uom} = {ratio} {baseUom}
                                      </span>
                                    )}
                                  </span>
                                );
                              }}
                            </Form.Item>
                          }
                          rules={[{ required: true, message: 'Bắt buộc' }]}
                          className="mb-0 md:col-span-3 xl:col-span-4"
                        >
                          <InputNumber size="large" className="w-full" min={1} />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label={
                            <Form.Item
                              shouldUpdate={(prevValues, currentValues) => prevValues.items?.[name]?.itemId !== currentValues.items?.[name]?.itemId}
                              noStyle
                            >
                              {({ getFieldValue }) => {
                                const selectedId = getFieldValue(['items', name, 'itemId']);
                                const p = supplierItems.find((p) => String(p.id) === String(selectedId));
                                const baseUom = getBaseUomName(p);
                                return (
                                  <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1 whitespace-nowrap">
                                    <DollarSign size={12} /> {'\u0110\u01a1n gi\u00e1 NCC /'} {baseUom || '\u0111\u01a1n v\u1ecb l\u1ebb'}
                                  </span>
                                );
                              }}
                            </Form.Item>
                          }
                          rules={[{ required: true, message: 'Bắt buộc' }]}
                          className="mb-0 md:col-span-5 xl:col-span-4"
                        >
                          {canEditPrice ? (
                            <InputNumber size="large" className="w-full" min={1} />
                          ) : (
                            <ReadOnlyPrice />
                          )}
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'expiryDate']}
                          label={
                            <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1 whitespace-nowrap">
                              <Calendar size={12} /> Hạn sử dụng
                            </span>
                          }
                          className="mb-0 md:col-span-4 xl:col-span-4"
                        >
                          <input
                            type="date"
                            className={selectClass}
                          />
                        </Form.Item>

                        <div className="md:col-span-12 xl:col-span-24 mt-2 pt-2 border-t border-slate-100 flex justify-end">
                          <span className="text-sm text-slate-500 font-medium mr-2">Thành tiền:</span>
                          <span className="text-sm font-bold text-emerald-600">
                            <Form.Item
                              shouldUpdate={(prevValues, currentValues) => {
                                const prev = prevValues.items?.[name];
                                const curr = currentValues.items?.[name];
                                return prev?.itemId !== curr?.itemId
                                  || prev?.inputMode !== curr?.inputMode
                                  || prev?.quantity !== curr?.quantity
                                  || prev?.price !== curr?.price;
                              }}
                              noStyle
                            >
                              {({ getFieldValue }) => {
                                const selectedId = getFieldValue(['items', name, 'itemId']);
                                const mode = getFieldValue(['items', name, 'inputMode']) as ImportMode | undefined;
                                const p = supplierItems.find((p) => String(p.id) === String(selectedId));
                                const qty = getFieldValue(['items', name, 'quantity']) || 0;
                                const price = getFieldValue(['items', name, 'price']) || 0;
                                const ratio = getLineRatio(p, mode);
                                const inputUom = getLineUomName(p, mode);
                                const baseUom = getBaseUomName(p);
                                const convertedQty = Number(qty || 0) * ratio;
                                return (
                                  <span className="inline-flex flex-col items-end gap-0.5">
                                    {p && (
                                      <span className="text-[11px] font-medium text-slate-500">
                                        {qty || 0} {inputUom} x {ratio} = {convertedQty} {baseUom}
                                      </span>
                                    )}
                                    <span>{money(calculateLineTotal(qty, price, p, mode))}</span>
                                  </span>
                                );
                              }}
                            </Form.Item>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Form.Item className="mt-3 mb-0">
                  <Button
                    type="dashed"
                    onClick={() => add({ itemId: '', inputMode: 'purchase', quantity: 50, price: 0 })}
                    block
                    icon={<Plus size={16} />}
                    className="h-11 border-emerald-300 text-emerald-700 hover:!border-emerald-500 hover:!text-emerald-800"
                  >
                    Thêm sản phẩm khác
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Tổng tiền */}
          <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-800 font-bold text-base">Tổng tiền phiếu nhập</div>
                <div className="text-slate-500 font-medium text-sm mt-0.5">
                  <ItemsCount form={form} /> mặt hàng được chọn
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-600">
                <TotalPriceDisplay form={form} supplierItems={supplierItems} />
              </div>
            </div>
          </div>

          {/* Action bar dính đáy */}
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 px-6 py-4 bg-white/95 backdrop-blur border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 rounded-b-xl">
            <Button
              type="default"
              size="large"
              onClick={() => form.resetFields()}
              className="h-11"
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<Plus size={16} />}
              size="large"
              className="h-11 px-6 bg-emerald-600 hover:!bg-emerald-700 border-emerald-600"
            >
              Tạo phiếu nhập
            </Button>
          </div>
        </Form>
      </Card>

      <AiSummary setPage={setPage} />
    </div>
  );
}
