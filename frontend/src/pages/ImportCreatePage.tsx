import React from 'react';
import { Form, Select, InputNumber, Button, message as antdMessage, Alert, Spin } from 'antd';
import { Trash2, Plus } from 'lucide-react';
import { Card, CardHeader } from '../components/ui';
import { createPurchaseOrder } from '../services/wmsApi';
import type { Product } from '../lib/itemMapper';
import { formatMoney as money } from '../lib/itemMapper';
import type { SupplierDto, LocationDto } from '../types/api';
import type { PageKey } from '../types/pages';
import { AiSummary } from '../App';

export default function ImportCreatePage({
  productsList,
  suppliers,
  locations,
  setPage,
  reloadCatalog,
  catalogLoading,
}: {
  productsList: Product[];
  suppliers: SupplierDto[];
  locations: LocationDto[];
  setPage: (page: PageKey) => void;
  reloadCatalog: () => Promise<void>;
  catalogLoading?: boolean;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  const defaultLocation = locations.length > 0 ? (locations.find((l) => l.locationName?.includes('Kho bán')) ?? locations[0]) : null;

  const handleCreateSlip = async (values: {
    supplierId: number;
    locationId: number;
    items: { itemId: number; quantity: number; price: number }[];
  }) => {
    if (!values.items || values.items.length === 0) {
      antdMessage.error('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }
    setSubmitting(true);
    try {
      const po = await createPurchaseOrder({
        supplierId: values.supplierId,
        locationId: values.locationId,
        items: values.items.map((i: any) => ({ itemId: Number(i.itemId), quantity: Number(i.quantity), unitPrice: Number(i.price) })),
      });
      await reloadCatalog();
      antdMessage.success(`Tạo phiếu nhập PN-${po.id} thành công!`);
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
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="Đang tải dữ liệu...">
          <div className="w-10 h-10" />
        </Spin>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      {/* Cảnh báo Alert */}
      {suppliers.length === 0 && (
        <Alert type="warning" message="Chưa có nhà cung cấp nào. Vui lòng tạo nhà cung cấp trước khi tạo phiếu nhập." className="lg:col-span-2" />
      )}
      {locations.length === 0 && (
        <Alert type="warning" message="Chưa có kho nào được cấu hình. Vui lòng tạo kho trước khi tạo phiếu nhập." className="lg:col-span-2" />
      )}
      <Card>
        <CardHeader title="Thông tin lập phiếu nhập hàng" />
        <Form
          layout="vertical"
          form={form}
          onFinish={handleCreateSlip}
          className="px-5 pb-5"
          initialValues={{ locationId: defaultLocation?.id, items: [{ quantity: 50, price: 0 }] }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select
                virtual={false}
                placeholder="Chọn nhà cung cấp"
                notFoundContent="Không có nhà cung cấp"
                options={suppliers.map((s) => ({ value: s.id, label: s.supplierName }))}
                getPopupContainer={() => document.body}
                dropdownStyle={{ zIndex: 99999, minWidth: 200 }}
              />
            </Form.Item>
            <Form.Item name="locationId" label="Kho nhận" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select
                virtual={false}
                placeholder="Chọn kho"
                notFoundContent="Không có kho lưu trữ"
                options={locations.map((l) => ({ value: l.id, label: l.locationName }))}
                getPopupContainer={() => document.body}
                dropdownStyle={{ zIndex: 99999, minWidth: 200 }}
              />
            </Form.Item>
          </div>

          <div className="mt-4 mb-2 font-semibold text-slate-700">Danh sách sản phẩm nhập</div>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex gap-3 items-end mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <Form.Item
                      {...restField}
                      name={[name, 'itemId']}
                      label="Sản phẩm"
                      rules={[{ required: true, message: 'Bắt buộc' }]}
                      className="mb-0 flex-1"
                    >
                      <Select
                        virtual={false}
                        placeholder="Chọn sản phẩm"
                        notFoundContent="Không có sản phẩm"
                        options={productsList.map((p) => ({
                          value: p.key,
                          label: `${p.name} (Tồn: ${p.stock})`,
                        }))}
                        showSearch
                        optionFilterProp="label"
                        getPopupContainer={() => document.body}
                        dropdownStyle={{ zIndex: 99999, minWidth: 300 }}
                        onChange={(val) => {
                          const product = productsList.find((p) => p.key === val);
                          if (product) {
                            const currentItems = form.getFieldValue('items') || [];
                            currentItems[name] = { ...currentItems[name], price: product.cost };
                            form.setFieldsValue({ items: currentItems });
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      label="Số lượng"
                      rules={[{ required: true, message: 'Bắt buộc' }]}
                      className="mb-0 w-28"
                    >
                      <InputNumber className="w-full" min={1} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'price']}
                      label="Đơn giá nhập"
                      rules={[{ required: true, message: 'Bắt buộc' }]}
                      className="mb-0 w-36"
                    >
                      <InputNumber className="w-full" min={1} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button danger type="text" icon={<Trash2 size={18} />} onClick={() => remove(name)} className="mb-0" />
                    )}
                  </div>
                ))}
                <Form.Item className="mb-4">
                  <Button type="dashed" onClick={() => add({ quantity: 50, price: 0 })} block icon={<Plus size={16} />}>
                    Thêm sản phẩm khác
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 rounded-lg flex justify-between items-center font-medium">
            <span className="text-base">Tổng tiền phiếu nhập:</span>
            <span className="text-xl font-bold">
              <Form.Item noStyle dependencies={['items']}>
                {() => {
                  const items = form.getFieldValue('items') || [];
                  const total = items.reduce((acc: number, item: any) => acc + (Number(item?.quantity || 0) * Number(item?.price || 0)), 0);
                  return money(total);
                }}
              </Form.Item>
            </span>
          </div>

          <Button type="primary" htmlType="submit" loading={submitting} icon={<Plus size={16} />} size="large" className="w-full sm:w-auto">
            Tạo phiếu nhập
          </Button>
        </Form>
      </Card>
      <AiSummary setPage={setPage} />
    </div>
  );
}
