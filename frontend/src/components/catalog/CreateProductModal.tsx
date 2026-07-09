import { Select } from '@/components/ui';
import { Form, Input, InputNumber, Modal, Switch, Upload, Button, message as antdMessage } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as React from 'react';
import { createItem, createSupplier, uploadMedia } from '@/services/wmsApi';
import type { CategoryDto, UomDto } from '@/types/api';
import type { PageKey } from '@/types/pages';
import { ProductThumbnail } from '@/components/catalog/ProductThumbnail';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useFormDraft } from '@/hooks/useFormDraft';

const pageTitles: Record<PageKey, { title: string }> = {
  dashboard: { title: 'Bảng điều khiển' },
  products: { title: 'Sản phẩm' },
  categories: { title: 'Danh mục' },
  brands: { title: 'Thương hiệu' },
  suppliers: { title: 'Nhà cung cấp' },
  locations: { title: 'Vị trí kho' },
  uoms: { title: 'Đơn vị tính' },
  pos: { title: 'Bán hàng tại quầy' },
  customers: { title: 'Khách hàng' },
  'customer-debts': { title: 'Công nợ khách' },
  invoices: { title: 'Hóa đơn bán hàng' },
  'return-orders': { title: 'Phiếu trả hàng' },
  quotations: { title: 'Báo giá' },
  'online-orders': { title: 'Đơn hàng online' },
  'import-create': { title: 'Tạo phiếu nhập' },
  'import-slips': { title: 'Phiếu nhập hàng' },
  inventory: { title: 'Tồn kho' },
  'barcode-print': { title: 'In mã vạch' },
  'expired-products': { title: 'Hàng cận hạn' },
  'inventory-alerts': { title: 'Cảnh báo tồn kho' },
  'inventory-logs': { title: 'Lịch sử biến động' },
  stocktake: { title: 'Kiểm kê kho' },
  shifts: { title: 'Ca làm việc' },
  'item-lots': { title: 'Quản lý lô hàng' },
  'ai-forecast': { title: 'Dự báo AI' },
  'purchase-suggestions': { title: 'Gợi ý nhập hàng' },
  'expiry-risk': { title: 'Rủi ro hết hạn' },
  promotions: { title: 'Đề xuất KM (AI)' },
  'promotion-manage': { title: 'Quản lý mã KM' },
  'discount-plans': { title: 'Kế hoạch giảm giá' },
  'gift-cards': { title: 'Thẻ quà tặng' },
  'ai-assistant': { title: 'Trợ lý AI' },
  reports: { title: 'Báo cáo hệ thống' },
  finance: { title: 'Thu chi' },
  users: { title: 'Người dùng' },
  settings: { title: 'Cài đặt hệ thống' },
  'scrap-orders': { title: 'Quản lý Yêu cầu loại bỏ hàng hóa' },
  'audit-logs': { title: 'Nhật ký hoạt động' },
  chat: { title: 'Tin nhắn' },
};

type Props = {
  open: boolean;
  onCancel: () => void;
  page: PageKey;
  categories: CategoryDto[];
  uoms: UomDto[];
  onCreated: () => Promise<void>;
};

export function CreateProductModal({ open, onCancel, page, categories, uoms, onCreated }: Props) {
  const [form] = Form.useForm();
  const { clearDraft, saveDraft } = useFormDraft(form, `draft_quick_create_${page}`);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [previewName, setPreviewName] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>();
  const filteredUoms = React.useMemo(() => uoms.filter((uom) => uom.active !== false), [uoms]);
  const retailUoms = React.useMemo(
    () => filteredUoms.filter((uom) => uom.category === 'Đơn vị lẻ'),
    [filteredUoms]
  );
  const packagingUoms = React.useMemo(
    () => filteredUoms.filter((uom) => uom.category === 'Đóng gói'),
    [filteredUoms]
  );

  const handleCancel = () => {
    form.resetFields();
    setPreviewName('');
    setPreviewUrl(undefined);
    onCancel();
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      setUploading(true);
      const url = await uploadMedia(file as File);
      form.setFieldValue('imageUrl', url);
      setPreviewUrl(url);
      saveDraft();
      onSuccess("ok");
      antdMessage.success('Tải ảnh lên thành công');
    } catch (err) {
      onError(err);
      antdMessage.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async (values: {
    name: string;
    sku: string;
    categoryId?: number;
    baseUomId: number;
    purchaseUomId?: number;
    price: number;
    costPrice: number;
    hasExpiry?: boolean;
    imageUrl?: string;
    supplierName?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => {
    if (page === 'products') {
      if (!values.baseUomId) {
        antdMessage.error('Vui lòng chọn đơn vị lẻ');
        return;
      }
      setSaving(true);
      try {
        await createItem({
          itemCode: values.sku || `SKU-${Date.now()}`,
          itemName: values.name,
          categoryId: values.categoryId ? Number(values.categoryId) : undefined,
          baseUomId: Number(values.baseUomId),
          purchaseUomId: values.purchaseUomId ? Number(values.purchaseUomId) : undefined,
          costPrice: values.costPrice ?? values.price * 0.8,
          sellingPrice: values.price,
          minimumStock: 10,
          hasExpiry: Boolean(values.hasExpiry),
          imageUrl: values.imageUrl,
        });
        await onCreated();
        antdMessage.success(`Thêm sản phẩm ${values.name} thành công`);
        clearDraft();
        handleCancel();
      } catch (e) {
        antdMessage.error(e instanceof Error ? e.message : 'Tạo sản phẩm thất bại');
      } finally {
        setSaving(false);
      }
    } else if (page === 'suppliers') {
      setSaving(true);
      try {
        await createSupplier({
          supplierName: values.supplierName!.trim(),
          contactPerson: values.contactPerson?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          email: values.email?.trim() || undefined,
          address: values.address?.trim() || undefined,
        });
        await onCreated();
        antdMessage.success(`Đã thêm nhà cung cấp ${values.supplierName}`);
        clearDraft();
        handleCancel();
      } catch (e) {
        antdMessage.error(e instanceof Error ? e.message : 'Tạo nhà cung cấp thất bại');
      } finally {
        setSaving(false);
      }
    } else {
      antdMessage.info('Chức năng tạo nhanh cho trang này đang được phát triển');
      return;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={
        page === 'products'
          ? 'Thêm mới Sản phẩm vào hệ thống'
          : page === 'suppliers'
            ? 'Thêm nhà cung cấp mới'
            : `Tạo nhanh - ${pageTitles[page].title}`
      }
      okText="Tạo"
      cancelText="Hủy"
      confirmLoading={saving}
      onOk={() => form.submit()}
      forceRender
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        onValuesChange={(_, all) => {
          setPreviewName(all.name ?? '');
          setPreviewUrl(resolveMediaUrl(all.imageUrl));
          saveDraft();
        }}
        initialValues={{ hasExpiry: false }}
      >
        {page === 'products' ? (
          <div className="space-y-1">
            <div className="flex justify-center mb-4">
              <ProductThumbnail name={previewName || 'SP mới'} imageUrl={previewUrl ?? form.getFieldValue('imageUrl')} size={80} />
            </div>
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
              <Input placeholder="Nhập tên sản phẩm (Ví dụ: Trà sữa đóng chai)" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="sku" label="Mã SKU" rules={[{ required: true }]}>
                <Input placeholder="Ví dụ: MILK-BOT-500" />
              </Form.Item>
              <Form.Item name="categoryId" label="Danh mục">
                <select className="h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Chọn danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.categoryName}</option>
                  ))}
                </select>
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="baseUomId" label="Đơn vị lẻ" rules={[{ required: true, message: 'Vui lòng chọn đơn vị lẻ' }]}>
                <select className="h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Chọn đơn vị lẻ</option>
                  {retailUoms.map((uom) => (
                    <option key={uom.id} value={uom.id}>{uom.uomName}</option>
                  ))}
                </select>
              </Form.Item>
              <Form.Item name="purchaseUomId" label="Đơn vị đóng gói">
                <select className="h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Chọn đơn vị đóng gói</option>
                  {packagingUoms.map((uom) => (
                    <option key={uom.id} value={uom.id}>{uom.uomName}</option>
                  ))}
                </select>
              </Form.Item>
            </div>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.purchaseUomId !== curr.purchaseUomId}>
              {({ getFieldValue }) => {
                const pUomId = getFieldValue('purchaseUomId');
                const selectedUom = packagingUoms.find((uom) => uom.id === (pUomId ? Number(pUomId) : undefined)); if (!selectedUom) return null;
                return (
                  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {'Quy \u0111\u1ed5i: 1 '}{selectedUom.uomName} = {selectedUom.conversionRatio ?? 1}{' '}
                    {selectedUom.conversionUomName ?? selectedUom.uomName}
                  </div>
                );
              }}
            </Form.Item>
            <Form.Item label="Hình ảnh sản phẩm">
              <div className="flex gap-2">
                <Form.Item name="imageUrl" noStyle>
                  <Input placeholder="Dán link ảnh sản phẩm..." />
                </Form.Item>
                <Upload
                  accept="image/*"
                  customRequest={handleUpload}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} loading={uploading} />
                </Upload>
              </div>
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="costPrice" label="Giá vốn (VNĐ)">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
              <Form.Item name="price" label="Giá bán (VNĐ)" rules={[{ required: true }]}>
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </div>
            <Form.Item name="hasExpiry" label="Có hạn dùng" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        ) : page === 'suppliers' ? (
          <div className="space-y-1">
            <Form.Item
              name="supplierName"
              label="Tên nhà cung cấp"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}
            >
              <Input placeholder="Ví dụ: Công ty TNHH ABC" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="contactPerson" label="Người liên hệ">
                <Input placeholder="Họ tên người đại diện" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="0901234567" />
              </Form.Item>
            </div>
            <Form.Item name="email" label="Email">
              <Input type="email" placeholder="contact@company.vn" />
            </Form.Item>
            <Form.Item name="address" label="Địa chỉ">
              <Input.TextArea rows={2} placeholder="Địa chỉ giao dịch / kho" />
            </Form.Item>
          </div>
        ) : (
          <Form.Item name="name" label="Mô tả nhanh">
            <Input.TextArea rows={3} placeholder="Nhập nội dung tác vụ..." />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
