import { Button, Drawer, Form, InputNumber, Progress, Statistic } from 'antd';
import * as React from 'react';
import { message as antdMessage } from 'antd';
import { animateDrawer } from '../lib/gsapAnimations';
import { formatMoney, type Product } from '../lib/itemMapper';
import { ProductThumbnail } from './ProductThumbnail';
import { updateItem } from '../services/wmsApi';

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
      await updateItem(itemId, { sellingPrice: price });
      antdMessage.success('Đã cập nhật giá bán');
      onUpdated?.();
      onClose();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={Boolean(product)} onClose={onClose} title="Chi tiết sản phẩm" width={440}>
      {product ? (
        <div ref={bodyRef} className="space-y-5">
          <div className="flex gap-4 rounded-2xl bg-slate-50 p-5">
            <ProductThumbnail name={product.name} imageUrl={product.imageUrl} size={96} className="rounded-xl" />
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
            <Statistic title="Giá bán" value={product.price} formatter={(v) => formatMoney(Number(v))} />
            <Statistic title="Hạn dùng" value={product.expiry} />
          </div>
          <Progress percent={Math.min(100, Math.round((product.stock / 900) * 100))} strokeColor="#006c49" />
          <Form layout="vertical">
            <Form.Item label="Giá bán mới (VNĐ)">
              <InputNumber className="w-full" min={0} value={price ?? undefined} onChange={(v) => setPrice(v ?? null)} />
            </Form.Item>
          </Form>
          <Button type="primary" block loading={saving} onClick={handleSave}>
            Lưu giá bán
          </Button>
        </div>
      ) : null}
    </Drawer>
  );
}
