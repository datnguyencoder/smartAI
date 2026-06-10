import { Form, Input, InputNumber, Modal, Select, Switch, message as antdMessage } from 'antd';
import * as React from 'react';
import { createItem } from '../services/wmsApi';
import type { CategoryDto, UomDto } from '../types/api';
import type { PageKey } from '../types/pages';
import { ProductThumbnail } from './ProductThumbnail';
import { resolveMediaUrl } from '../lib/mediaUrl';

const pageTitles: Record<PageKey, { title: string }> = {
  dashboard: { title: 'Bảng điều khiển' },
  products: { title: 'Sản phẩm' },
  categories: { title: 'Danh mục' },
  suppliers: { title: 'Nhà cung cấp' },
  locations: { title: 'Vị trí kho' },
  pos: { title: 'Bán hàng tại quầy' },
  invoices: { title: 'Hóa đơn bán hàng' },
  'import-create': { title: 'Tạo phiếu nhập' },
  'import-slips': { title: 'Phiếu nhập hàng' },
  inventory: { title: 'Tồn kho' },
  'inventory-alerts': { title: 'Cảnh báo tồn kho' },
  'inventory-logs': { title: 'Lịch sử biến động' },
  'ai-forecast': { title: 'Dự báo AI' },
  'purchase-suggestions': { title: 'Gợi ý nhập hàng' },
  'expiry-risk': { title: 'Rủi ro hết hạn' },
  promotions: { title: 'Đề xuất khuyến mãi' },
  'ai-assistant': { title: 'Trợ lý AI' },
  reports: { title: 'Báo cáo hệ thống' },
  users: { title: 'Người dùng' },
  settings: { title: 'Cài đặt hệ thống' },
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
  const [saving, setSaving] = React.useState(false);
  const [previewName, setPreviewName] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>();
  const baseUom = uoms.find((u) => u.uomName === 'Cái') ?? uoms[0];

  const handleFinish = async (values: {
    name: string;
    sku: string;
    categoryId?: number;
    price: number;
    costPrice: number;
    hasExpiry?: boolean;
    imageUrl?: string;
  }) => {
    if (page === 'products') {
      if (!baseUom) {
        antdMessage.error('Chưa có đơn vị tính (UOM) trên hệ thống');
        return;
      }
      setSaving(true);
      try {
        await createItem({
          itemCode: values.sku || `SKU-${Date.now()}`,
          itemName: values.name,
          categoryId: values.categoryId,
          baseUomId: baseUom.id,
          costPrice: values.costPrice ?? values.price * 0.8,
          sellingPrice: values.price,
          minimumStock: 10,
          hasExpiry: Boolean(values.hasExpiry),
          imageUrl: values.imageUrl,
        });
        await onCreated();
        antdMessage.success(`Thêm sản phẩm ${values.name} thành công`);
      } catch (e) {
        antdMessage.error(e instanceof Error ? e.message : 'Tạo sản phẩm thất bại');
      } finally {
        setSaving(false);
      }
    } else {
      antdMessage.success('Tạo thành công tác vụ vận hành mới!');
    }
    form.resetFields();
    setPreviewName('');
    setPreviewUrl(undefined);
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={page === 'products' ? 'Thêm mới Sản phẩm vào hệ thống' : `Tạo nhanh - ${pageTitles[page].title}`}
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
        }}
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
                <Select
                  placeholder="Chọn danh mục"
                  options={categories.map((c) => ({ value: c.id, label: c.categoryName }))}
                />
              </Form.Item>
            </div>
            <Form.Item name="imageUrl" label="URL ảnh (tùy chọn)">
              <Input placeholder="/media/items/milk-vnm-1l.svg hoặc https://..." />
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
        ) : (
          <Form.Item name="name" label="Mô tả nhanh">
            <Input.TextArea rows={3} placeholder="Nhập nội dung tác vụ..." />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
