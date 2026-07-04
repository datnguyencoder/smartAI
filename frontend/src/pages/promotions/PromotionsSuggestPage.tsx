import React from 'react';
import { Alert, Button, Table, Tag, message as antdMessage } from 'antd';
import { Sparkles, WandSparkles } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import {
  aiSuggestPromotion,
  approvePromotionRecommendation,
  fetchItems,
  fetchNearExpiry,
  fetchPromotionRecommendations,
  rejectPromotionRecommendation,
} from '@/services/wmsApi';
import type { PageKey } from '@/types/pages';
import type { PromotionRecommendationDto } from '@/types/api';

type Props = {
  setPage: (page: PageKey) => void;
};

export default function PromotionsSuggestPage({ setPage }: Props) {
  const [rows, setRows] = React.useState<PromotionRecommendationDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [nearExpiry, setNearExpiry] = React.useState<{ itemId: number; itemName: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchPromotionRecommendations(false));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được đề xuất KM');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const loadItemOptions = async () => {
      try {
        const near = await fetchNearExpiry();
        if (near.length > 0) {
          setNearExpiry(near.map((i) => ({ itemId: i.itemId, itemName: i.itemName })));
          return;
        }
        const all = await fetchItems();
        setNearExpiry(all.slice(0, 20).map((i) => ({ itemId: i.id, itemName: i.itemName })));
      } catch {
        setNearExpiry([]);
      }
    };
    loadItemOptions();
  }, [load]);

  const handleGenerate = async () => {
    if (!selectedItemId) {
      antdMessage.warning('Chọn sản phẩm cần đề xuất KM');
      return;
    }
    setGenerating(true);
    try {
      const res = await aiSuggestPromotion(selectedItemId);
      antdMessage.success(
        res.source === 'FALLBACK'
          ? 'Đã tạo đề xuất KM bằng rule fallback để demo không bị gián đoạn'
          : 'Gemini đã tạo đề xuất khuyến mãi'
      );
      await load();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tạo được đề xuất');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await approvePromotionRecommendation(id);
      antdMessage.success(`Đã duyệt — mã KM: ${res.promotionCode ?? '—'}`);
      await load();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Duyệt thất bại');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectPromotionRecommendation(id);
      antdMessage.info('Đã từ chối đề xuất');
      await load();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Từ chối thất bại');
    }
  };

  const columns = [
    { title: 'SKU', dataIndex: 'itemCode', key: 'itemCode' },
    { title: 'Sản phẩm', dataIndex: 'itemName', key: 'itemName' },
    {
      title: 'Giảm đề xuất',
      dataIndex: 'discountPercent',
      key: 'discountPercent',
      render: (v: number) => <Tag color="purple">{v}%</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'PENDING' ? 'orange' : s === 'APPROVED' ? 'green' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Mã KM (sau duyệt)',
      dataIndex: 'promotionCode',
      key: 'promotionCode',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, row: PromotionRecommendationDto) =>
        row.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button size="small" type="primary" onClick={() => handleApprove(row.id)}>
              Duyệt
            </Button>
            <Button size="small" danger onClick={() => handleReject(row.id)}>
              Từ chối
            </Button>
          </div>
        ) : row.promotionCode ? (
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() => {
                navigator.clipboard?.writeText(row.promotionCode || '');
                antdMessage.success(`Đã copy mã ${row.promotionCode}`);
              }}
            >
              Copy mã
            </Button>
            <Button
              size="small"
              ghost
              type="primary"
              onClick={() => {
                sessionStorage.setItem('smartmart_pending_promo_code', row.promotionCode || '');
                setPage('pos');
              }}
            >
              Dùng tại POS
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Đề xuất khuyến mãi (AI)"
          description="Gemini phân tích tồn kho & dự báo → Manager duyệt → mã KM tự động dùng tại POS"
        />
        <div className="px-5 pb-5 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              className="min-w-[280px]"
              placeholder="Chọn SP cận date / cần xả hàng"
              value={selectedItemId ?? undefined}
              onChange={setSelectedItemId}
              options={nearExpiry.map((i) => ({
                value: i.itemId,
                label: `${i.itemName} (#${i.itemId})`,
              }))}
              showSearch
              optionFilterProp="label"
            />
            <Button
              type="primary"
              icon={<Sparkles size={16} />}
              loading={generating}
              onClick={handleGenerate}
            >
              Tạo đề xuất AI
            </Button>
          </div>
          {rows.length === 0 && !loading && (
            <Alert
              type="info"
              showIcon
              message="Chưa có đề xuất khuyến mãi"
              description="Chọn sản phẩm cận hạn và nhấn Tạo đề xuất AI, hoặc dùng trang Rủi ro hết hạn."
            />
          )}
          <Table
            rowKey="id"
            loading={loading}
            dataSource={rows}
            columns={columns}
            pagination={{ pageSize: 8 }}
            expandable={{
              expandedRowRender: (row) => (
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{row.reason || '—'}</p>
              ),
            }}
          />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <WandSparkles size={16} />
          Sau khi duyệt, nhập mã KM tại POS hoặc quản lý mã tại{' '}
          <Button type="link" size="small" className="p-0 h-auto" onClick={() => setPage('promotion-manage')}>
            Quản lý mã KM
          </Button>
        </div>
      </Card>
    </div>
  );
}
