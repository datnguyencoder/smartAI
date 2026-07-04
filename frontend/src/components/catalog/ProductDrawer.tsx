import { Button, Drawer, Form, Input, InputNumber, Progress, Statistic, Table, Upload } from 'antd';
import * as React from 'react';
import { message as antdMessage } from 'antd';
import { ImagePlus, RotateCcw, UploadCloud } from 'lucide-react';
import { animateDrawer } from '@/lib/gsapAnimations';
import { formatMoney, type Product } from '@/lib/itemMapper';
import { ProductThumbnail } from '@/components/catalog/ProductThumbnail';
import { aiExplainRisk, downloadBarcodeLabel, fetchInventory, updateItem, uploadMedia } from '@/services/wmsApi';
import type { InventoryItemDto } from '@/types/api';
import { MarkdownMessage } from '@/components/ai/MarkdownMessage';

type Props = {
  product: Product | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export function ProductDrawer({ product, onClose, onUpdated }: Props) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [price, setPrice] = React.useState<number | null>(null);
  const [imageUrl, setImageUrl] = React.useState('');
  const [lots, setLots] = React.useState<InventoryItemDto[]>([]);
  const [loadingLots, setLoadingLots] = React.useState(false);
  const [riskInsight, setRiskInsight] = React.useState<string | null>(null);
  const [riskLoading, setRiskLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const url = await uploadMedia(file as File);
      setImageUrl(url);
      onSuccess?.(url);
      antdMessage.success('Tải ảnh lên thành công!');
    } catch (err) {
      onError?.(err as Error);
      antdMessage.error('Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    if (product) {
      animateDrawer(bodyRef.current, true);
      setPrice(product.price);
      setImageUrl(product.imageUrl ?? '');
      setRiskInsight(null);
      setLoadingLots(true);
      fetchInventory()
        .then((rows) => setLots(rows.filter((row) => String(row.itemId) === product.key)))
        .catch(() => setLots([]))
        .finally(() => setLoadingLots(false));
    } else {
      setLots([]);
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
              <p className="text-sm text-slate-500">
                {product.sku} · {product.category}
              </p>
              {product && (product.purchaseUomName || product.baseUomName) && (
                <div className="mt-1.5 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-medium rounded border border-emerald-100">
                  Quy đổi: 1 {product.purchaseUomName || product.baseUomName} = {product.purchaseRatio || 1} {product.baseUomName || product.purchaseUomName}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Statistic title="Tồn kho" value={product.stock} suffix={product.baseUomName || ''} />
            <Statistic title="Đã bán" value={product.sold} suffix={product.baseUomName || ''} />
            <Statistic title="Giá nhập TB" value={product.cost} formatter={(v) => formatMoney(Number(v))} />
            <Statistic title="Giá bán" value={product.price} formatter={(v) => formatMoney(Number(v))} />
            <Statistic title="Hạn dùng" value={product.expiry} className="col-span-2" />
          </div>
          <Progress percent={Math.min(100, Math.round((product.stock / 900) * 100))} strokeColor="#006c49" />
          <Form layout="vertical">
            <Form.Item label="Ảnh sản phẩm">
              <div className="flex gap-2">
                <Input
                  allowClear
                  placeholder="Dán link ảnh sản phẩm..."
                  prefix={<ImagePlus size={16} className="text-slate-400" />}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Upload customRequest={handleUpload} showUploadList={false} accept="image/*">
                  <Button icon={<UploadCloud size={16} />} loading={uploading} />
                </Upload>
              </div>
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
            Lưu thay đổi
          </Button>

          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="mb-3 text-base font-semibold text-slate-800">Chi tiết tồn kho theo lô</h3>
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
                  ),
                },
                { title: 'SL', dataIndex: 'quantity', align: 'right', render: (v) => `${v} ${product.baseUomName || ''}`.trim() },
              ]}
            />
          </div>

          <Button
            block
            onClick={async () => {
              if (!product) return;
              const itemId = Number(product.key);
              if (Number.isNaN(itemId)) return;
              try {
                const blob = await downloadBarcodeLabel(itemId);
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
              } catch (e) {
                antdMessage.error(e instanceof Error ? e.message : 'In nhãn thất bại');
              }
            }}
          >
            In nhãn barcode
          </Button>

          <Button
            block
            loading={riskLoading}
            onClick={async () => {
              if (!product) return;
              setRiskLoading(true);
              try {
                const text = await aiExplainRisk({
                  itemId: Number(product.key),
                  itemName: product.name,
                  stock: product.stock,
                  sold: product.sold,
                  price: product.price,
                });
                setRiskInsight(text);
              } catch (e) {
                antdMessage.error(e instanceof Error ? e.message : 'Phân tích thất bại');
              } finally {
                setRiskLoading(false);
              }
            }}
          >
            Phân tích rủi ro AI
          </Button>
          {riskInsight && (
            <div className="rounded-xl border border-line bg-white p-4 text-sm">
              <MarkdownMessage text={riskInsight} />
            </div>
          )}
        </div>
      ) : null}
    </Drawer>
  );
}
