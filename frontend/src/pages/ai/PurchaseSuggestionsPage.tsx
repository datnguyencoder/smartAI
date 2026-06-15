import { Alert, Button, Table, Tag } from 'antd';
import * as React from 'react';
import { Card } from '@/components/ui';
import { type Product } from '@/lib/itemMapper';
import { fetchReorderRecommendations } from '@/services/wmsApi';
import type { PageKey } from '@/types/pages';

export default function PurchaseSuggestionsPage({ productsList: _productsList, setPage }: { productsList: Product[]; setPage: (page: PageKey) => void }) {
  const [recs, setRecs] = React.useState<Record<string, unknown>[]>([]);
  React.useEffect(() => {
    fetchReorderRecommendations().then(setRecs).catch(() => setRecs([]));
  }, []);
  const suggestions = recs.map((r) => ({
    key: String(r.itemId),
    name: String(r.itemName),
    stock: Number(r.currentAvailable),
    sold: Number(r.predictedDemand14d ?? r.predictedDemand7d),
    suggested: Number(r.suggestedQty),
    risk: String(r.riskLevel),
    source: String(r.source ?? 'AI'),
  }));
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">AI Đề xuất nhập thêm hàng</h2>
          <p className="text-xs text-slate-400">Được đề xuất tự động dựa theo tốc độ bán hàng và chu kỳ vận chuyển.</p>
        </div>
        {suggestions.length > 0 && (
          <Button type="primary" onClick={() => setPage('import-create')}>Lập phiếu tất cả</Button>
        )}
      </div>
      <div className="px-5 pb-5">
        {suggestions.length === 0 ? (
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
            dataSource={suggestions}
            columns={[
              { title: 'Tên hàng', dataIndex: 'name', render: (v) => <span className="font-bold text-ink">{v}</span> },
              { title: 'Tồn hiện tại', dataIndex: 'stock' },
              { title: 'Nhu cầu (14 ngày)', dataIndex: 'sold' },
              { title: 'Số lượng đề xuất', dataIndex: 'suggested' },
              { title: 'Nguồn', dataIndex: 'source', render: (v) => <Tag color={v === 'AI' ? 'green' : 'orange'}>{v}</Tag> },
              { title: 'Độ ưu tiên', render: (_, row) => <Tag color={row.stock === 0 ? 'red' : 'orange'}>{row.stock === 0 ? 'KHẨN CẤP' : 'CAO'}</Tag> },
              { title: 'Hành động', render: () => <Button size="small" type="primary" ghost onClick={() => setPage('import-create')}>Lập phiếu</Button> }
            ]}
            pagination={false}
            rowKey="key"
          />
        )}
      </div>
    </Card>
  );
}
