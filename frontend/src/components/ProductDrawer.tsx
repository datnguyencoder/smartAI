import { Button, Drawer, Form, InputNumber, Progress, Statistic } from 'antd';
import * as React from 'react';
import { message as antdMessage } from 'antd';
import { ImagePlus, RotateCcw } from 'lucide-react';
import { animateDrawer } from '../lib/gsapAnimations';
import { formatMoney, type Product } from '../lib/itemMapper';
import { ProductThumbnail } from './ProductThumbnail';
import { updateItem, fetchInventory } from '../services/wmsApi';
import type { InventoryItemDto } from '../types/api';

type Props = {
  product: Product | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export function ProductDrawer({ product, onClose, onUpdated }: Props) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [price, setPrice] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (product) {
      animateDrawer(bodyRef.current, true);
      setPrice(product.price);
    }
  }, [product]);

  const handleSave = async () => {
    if (!product || price == null) return;
    const itemId = Number(product.key);
    if (Number.isNaN(itemId)) {
      antdMessage.warning('Không cập nhật được sản phẩm demo');
      return;
    }
    setSaving(true);
    try {
      await updateItem(itemId, {
        sellingPrice: price,
        imageUrl: imageUrl.trim(),
      });
      antdMessage.success('Đã cập nhật sản phẩm');
      onUpdated?.();
      onClose();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const previewImageUrl = imageUrl.trim() || undefined;

  return (
    <Drawer open={Boolean(product)} onClose={onClose} title="Chi tiết sản phẩm" width={440}>
      {product ? (
        <div ref={bodyRef} className="space-y-5">
          <div className="flex gap-4 rounded-2xl bg-slate-50 p-5">
            <ProductThumbnail name={product.name} imageUrl={previewImageUrl} size={96} className="rounded-xl" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-muted">
                {product.sku} · {product.category}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Statistic title="Tồn kho" value={product.stock} />
            <Statistic title="Đã bán" value={product.sold} />
            <Statistic title="Giá nhập" value={product.cost} formatter={(v) => formatMoney(Number(v))} />
            <Statistic title="Giá bán" value={product.price} formatter={(v) => formatMoney(Number(v))} />
            <Statistic title="Hạn dùng" value={product.expiry} className="col-span-2" />
          </div>
          <Progress percent={Math.min(100, Math.round((product.stock / 900) * 100))} strokeColor="#006c49" />
          <Form layout="vertical">
            <Form.Item label="Ảnh sản phẩm">
              <Input
                allowClear
                placeholder="Dán link ảnh sản phẩm..."
                prefix={<ImagePlus size={16} className="text-slate-400" />}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button
                className="mt-2"
                icon={<RotateCcw size={15} />}
                size="small"
                onClick={() => setImageUrl(product.imageUrl ?? '')}
              >
                Khôi phục ảnh cũ
              </Button>
            </Form.Item>
            <Form.Item label="Giá bán mới (VNĐ)">
              <InputNumber className="w-full" min={0} value={price ?? undefined} onChange={(v) => setPrice(v ?? null)} />
            </Form.Item>
          </Form>
          <Button type="primary" block loading={saving} onClick={handleSave}>
            Lưu giá bán
          </Button>

          <div className="pt-6 mt-6 border-t border-slate-200">
            <h3 className="font-semibold text-base mb-3 text-slate-800">Chi tiết tồn kho theo lô</h3>
            <Table
              dataSource={lots}
              loading={loadingLots}
              rowKey={(r) => r.id}
              pagination={false}
              size="small"
              columns={[
                { title: 'Kho', dataIndex: 'locationName' },
                { 
                  title: 'Lô / HSD', 
                  render: (_, r) => (
                    <div className="text-xs">
                      <div className="font-medium text-slate-700">{r.lotNumber || '-'}</div>
                      <div className="text-slate-400">{r.expiryDate || 'Không có HSD'}</div>
                    </div>
                  ) 
                },
                { title: 'SL', dataIndex: 'quantity', align: 'right' },
              ]}
            />
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
