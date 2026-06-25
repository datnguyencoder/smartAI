import * as React from 'react';
import { Button, Drawer, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { RotateCcw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { fetchReturnOrders } from '@/services/wmsApi';
import type { ReturnOrderDto } from '@/types/api';

const statusColor: Record<string, string> = {
  COMPLETED: 'green',
  PENDING: 'gold',
  CANCELLED: 'red',
};

export default function ReturnOrdersPage() {
  const [orders, setOrders] = React.useState<ReturnOrderDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<ReturnOrderDto | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReturnOrders();
      setOrders(data ?? []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải được phiếu trả hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'id', key: 'id', render: (id: number) => `#${id}` },
    { title: 'Hóa đơn gốc', dataIndex: 'originalOrderCode', key: 'originalOrderCode' },
    {
      title: 'Ngày trả',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hoàn tiền',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColor[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, row: ReturnOrderDto) => (
        <Button type="link" onClick={() => setSelected(row)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Phiếu trả hàng"
        description="Danh sách phiếu trả hàng từ quầy POS và hóa đơn."
        action={
          <Button icon={<RotateCcw size={14} />} onClick={load} loading={loading}>
            Làm mới
          </Button>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
        pagination={{ pageSize: 15 }}
      />
      <Drawer
        title={`Phiếu trả #${selected?.id}`}
        open={!!selected}
        onClose={() => setSelected(null)}
        width={560}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <p>
              <strong>Hóa đơn gốc:</strong> {selected.originalOrderCode}
            </p>
            <p>
              <strong>Lý do:</strong> {selected.reason || '—'}
            </p>
            <p>
              <strong>Hoàn tiền:</strong> {Number(selected.refundAmount).toLocaleString('vi-VN')} đ
            </p>
            <Table
              size="small"
              pagination={false}
              rowKey="itemId"
              dataSource={selected.items}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'itemName' },
                { title: 'SL', dataIndex: 'quantity', width: 60 },
                {
                  title: 'Thành tiền',
                  dataIndex: 'subtotal',
                  render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </Card>
  );
}
