import { Alert, Button, Table, Tag } from 'antd';
import * as React from 'react';
import { Card } from '@/components/ui';
import { type Product } from '@/lib/itemMapper';
import { ApiClientError } from '@/services/apiClient';
import { fetchReorderRecommendations } from '@/services/wmsApi';
import type { ReorderRecommendationDto } from '@/types/api';
import type { PageKey, PurchaseSuggestionPrefillItem } from '@/types/pages';

export default function PurchaseSuggestionsPage({
  productsList,
  setPage,
  setPrefillItems,
}: {
  productsList: Product[];
  setPage: (page: PageKey) => void;
  setPrefillItems: React.Dispatch<React.SetStateAction<PurchaseSuggestionPrefillItem[]>>;
}) {
  const [recs, setRecs] = React.useState<ReorderRecommendationDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReorderRecommendations()
      .then((rows) => {
        if (cancelled) return;
        setRecs(rows);
      })
      .catch((e) => {
        if (cancelled) return;
        setRecs([]);
        if (e instanceof ApiClientError && e.status === 403) {
          setError('Bạn không có quyền xem gợi ý nhập hàng. Chức năng này chỉ dành cho Admin/Manager.');
        } else {
          setError(e instanceof Error ? e.message : 'Không tải được gợi ý nhập hàng');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const productById = React.useMemo(() => {
    const map = new Map<number, Product>();
    productsList.forEach((product) => map.set(Number(product.key), product));
    return map;
  }, [productsList]);

  const suggestions = React.useMemo(
    () =>
      recs.map((r) => {
        const product = productById.get(Number(r.itemId));
        return {
          ...r,
          key: String(r.itemId),
          itemCode: r.itemCode ?? product?.sku ?? `SKU-${r.itemId}`,
          currentAvailable: Number(r.currentAvailable),
          predictedDemand14d: Number(r.predictedDemand14d ?? r.predictedDemand7d ?? 0),
          suggestedQty: Number(r.suggestedQty),
          unitCost: product?.cost ?? 0,
        };
      }),
    [productById, recs]
  );

  const openImportCreate = React.useCallback(
    (items: Array<{ itemId: number; suggestedQty: number; supplierId?: number }>) => {
      // Phiếu nhập chỉ có 1 NCC — chỉ prefill supplier nếu TẤT CẢ sản phẩm chọn
      // cùng chung 1 NCC mặc định, tránh gán nhầm NCC khi lập phiếu hàng loạt.
      const supplierIds = new Set(items.map((i) => i.supplierId).filter((id): id is number => id != null));
      const commonSupplierId = supplierIds.size === 1 ? [...supplierIds][0] : undefined;

      setPrefillItems(items.map((item) => ({
        itemId: Number(item.itemId),
        suggestedQty: Math.max(1, Math.ceil(Number(item.suggestedQty) || 1)),
        supplierId: commonSupplierId,
      })));
      setPage('import-create');
    },
    [setPage, setPrefillItems]
  );

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">AI Đề xuất nhập thêm hàng</h2>
          <p className="text-xs text-slate-400">Được đề xuất tự động dựa theo tốc độ bán hàng và chu kỳ vận chuyển.</p>
        </div>
        {suggestions.length > 0 && (
          <Button
            type="primary"
            onClick={() =>
              openImportCreate(
                suggestions.map((s) => ({ itemId: s.itemId, suggestedQty: s.suggestedQty, supplierId: s.supplierId }))
              )
            }
          >
            Lập phiếu tất cả
          </Button>
        )}
      </div>
      <div className="px-5 pb-5">
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Không tải được gợi ý nhập hàng"
            description={error}
          />
        ) : suggestions.length === 0 && !loading ? (
          <Alert
            type="warning"
            showIcon
            message="Chưa có đề xuất nhập hàng"
            description={
              <span>
                Hãy chạy{' '}
                <Button type="link" size="small" className="p-0 h-auto" onClick={() => setPage('ai-forecast')}>
                  Huấn luyện AI
                </Button>{' '}
                trên trang Dự báo AI trước.
              </span>
            }
          />
        ) : (
          <Table
            loading={loading}
            dataSource={suggestions}
            columns={[
              {
                title: 'Tên hàng',
                dataIndex: 'itemName',
                render: (v, row) => (
                  <div>
                    <div className="font-bold text-ink">{v}</div>
                    <div className="text-xs text-slate-400">{row.itemCode}</div>
                  </div>
                ),
              },
              { title: 'Tồn hiện tại', dataIndex: 'currentAvailable', render: (v) => Math.round(Number(v) || 0).toLocaleString('vi-VN') },
              { title: 'Nhu cầu (14 ngày)', dataIndex: 'predictedDemand14d', render: (v) => Math.round(Number(v) || 0).toLocaleString('vi-VN') },
              { title: 'Số lượng đề xuất', dataIndex: 'suggestedQty', render: (v) => <strong>{Math.ceil(Number(v) || 0).toLocaleString('vi-VN')}</strong> },
              { title: 'Nguồn', dataIndex: 'source', render: (v) => <Tag color={v === 'AI' ? 'green' : 'orange'}>{v}</Tag> },
              {
                title: 'Nhà cung cấp',
                dataIndex: 'supplierName',
                render: (v) => v ?? <span className="text-slate-400">Chưa xác định</span>,
              },
              {
                title: 'Độ ưu tiên',
                dataIndex: 'riskLevel',
                render: (v) => {
                  if (v === 'HIGH') return <Tag color="red">KHẨN CẤP</Tag>;
                  if (v === 'MEDIUM') return <Tag color="orange">CAO</Tag>;
                  return <Tag color="blue">THEO DÕI</Tag>;
                },
              },
              {
                title: 'Lý do',
                dataIndex: 'reason',
                ellipsis: true,
              },
              {
                title: 'Hành động',
                render: (_, row) => (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={() =>
                      openImportCreate([{ itemId: row.itemId, suggestedQty: row.suggestedQty, supplierId: row.supplierId }])
                    }
                  >
                    Lập phiếu
                  </Button>
                ),
              },
            ]}
            pagination={false}
            rowKey="key"
          />
        )}
      </div>
    </Card>
  );
}
