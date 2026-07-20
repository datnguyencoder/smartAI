import * as React from 'react';
import { Button, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { fetchProductExpiryReport } from '@/services/wmsApi';
import type { ProductExpiryReportDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

type Props = { setPage?: (page: PageKey) => void };

export default function ExpiredProductsPage({ setPage }: Props) {
  const [rows, setRows] = React.useState<ProductExpiryReportDto[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProductExpiryReport();
      setRows(data ?? []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải được danh sách cận hạn');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const severity = (days?: number) => {
    if (days == null) return 'default';
    if (days <= 7) return 'red';
    if (days <= 30) return 'orange';
    return 'green';
  };

  return (
    <Card>
      <CardHeader
        title="Hàng cận hạn"
        description="Lô hàng sắp hết hạn — ưu tiên xử lý giảm giá hoặc lập phiếu hủy hàng."
        action={
          <div className="flex gap-2">
            {setPage && (
              <Button icon={<AlertTriangle size={14} />} onClick={() => setPage('expiry-risk')}>
                Rủi ro HSD
              </Button>
            )}
            <Button icon={<RotateCcw size={14} />} onClick={load} loading={loading}>
              Làm mới
            </Button>
          </div>
        }
      />
      <Table
        rowKey={(r) => `${r.itemId}-${r.lotId ?? 0}-${r.locationName}`}
        loading={loading}
        dataSource={rows}
        scroll={{ x: 'max-content', y: 'calc(100vh - 250px)' }}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'Mã SP', dataIndex: 'itemCode', width: 120 },
          { title: 'Tên sản phẩm', dataIndex: 'itemName' },
          { title: 'Lô', dataIndex: 'lotNumber', render: (v) => v || '—' },
          { title: 'Vị trí', dataIndex: 'locationName', render: (v) => v || '—' },
          {
            title: 'HSD',
            dataIndex: 'expiryDate',
            render: (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—'),
          },
          {
            title: 'Còn (ngày)',
            dataIndex: 'daysUntilExpiry',
            render: (d?: number) => <Tag color={severity(d)}>{d ?? '—'}</Tag>,
          },
          {
            title: 'SL',
            dataIndex: 'quantity',
            align: 'right',
            render: (v: number) => Number(v).toLocaleString('vi-VN'),
          },
        ]}
      />
    </Card>
  );
}
