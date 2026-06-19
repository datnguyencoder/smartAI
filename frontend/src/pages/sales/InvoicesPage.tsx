import { Button, DatePicker, Input, Table, Tag, message as antdMessage } from 'antd';
import {
  CreditCardOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import * as React from 'react';
import { Card, CardHeader, StatusChip } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import { ordersToInvoices } from '@/lib/mappers/ordersToInvoices';
import { cancelOrder, fetchOrdersPaged } from '@/services/wmsApi';
import type { UserDto } from '@/types/api';

const STATUS_TONE: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  'Đã thanh toán': 'success',
  'Đã hủy': 'danger',
  'Chờ xử lý': 'warning',
};

export default function InvoicesPage({
  setSelectedInvoice,
  authUser,
}: {
  setSelectedInvoice: (invoice: any) => void;
  authUser: UserDto;
}) {
  const canCancel = ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(normalizeRole(authUser.role));
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ page: 0, size: 10, total: 0 });
  const [filters, setFilters] = React.useState({ search: '', status: 'ALL', fromDate: '', toDate: '' });
  const [reloadTick, setReloadTick] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetchOrdersPaged(
      pagination.page, pagination.size,
      filters.search, filters.status,
      filters.fromDate, filters.toDate,
    )
      .then((res) => {
        if (active) {
          setOrders(ordersToInvoices(res.content));
          setPagination((p) => ({ ...p, total: res.totalElements }));
        }
      })
      .catch(() => { if (active) antdMessage.error('Lỗi tải hóa đơn'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pagination.page, pagination.size, filters.search, filters.status, filters.fromDate, filters.toDate, reloadTick]);

  const columns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'key',
      render: (v: string, row: any) => (
        <button
          className="font-mono font-bold text-primary hover:text-emerald-600 hover:underline"
          onClick={() => setSelectedInvoice(row)}
        >
          {v}
        </button>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      render: (v: string, row: any) => (
        <div>
          <div className="font-medium text-slate-800">{v}</div>
          {row.customerPhone && <div className="text-xs text-slate-400">{row.customerPhone}</div>}
        </div>
      ),
    },
    {
      title: 'Thu ngân',
      dataIndex: 'cashier',
      responsive: ['md' as const],
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      responsive: ['lg' as const],
      render: (v: string) => (
        <Tag icon={<CreditCardOutlined />} color="blue">
          {v}
        </Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'amount',
      render: (v: number) => (
        <span className="font-semibold tabular-nums text-slate-800">{money(v)}</span>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'time',
      render: (v: string) => (
        <span className="whitespace-nowrap text-sm text-slate-500">{v}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (v: string) => (
        <StatusChip tone={STATUS_TONE[v] ?? 'neutral'}>{v}</StatusChip>
      ),
    },
    {
      title: 'Thao tác',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => setSelectedInvoice(row)}>
            Chi tiết
          </Button>
          {canCancel && row.rawStatus === 'COMPLETED' && (
            <Button
              size="small"
              danger
              onClick={async () => {
                try {
                  await cancelOrder(row.orderId);
                  antdMessage.success('Đã hủy hóa đơn');
                  setReloadTick((t) => t + 1);
                } catch (e) {
                  antdMessage.error(e instanceof Error ? e.message : 'Hủy thất bại');
                }
              }}
            >
              Hủy
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className="flex h-[calc(100vh-120px)] flex-col overflow-hidden">
      <CardHeader
        title="Danh sách hóa đơn"
        className="shrink-0"
        action={
          <div className="flex flex-wrap gap-2">
            <Input.Search
              placeholder="Tìm mã, khách hàng..."
              prefix={<SearchOutlined className="text-slate-400" />}
              onSearch={(val) => {
                setFilters((f) => ({ ...f, search: val }));
                setPagination((p) => ({ ...p, page: 0 }));
              }}
              style={{ width: 220 }}
              allowClear
            />
            <select
              className="h-8 rounded border border-slate-200 bg-white px-3 text-sm focus:border-primary focus:outline-none"
              value={filters.status}
              onChange={(e) => {
                setFilters((f) => ({ ...f, status: e.target.value }));
                setPagination((p) => ({ ...p, page: 0 }));
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="COMPLETED">Đã thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="PENDING">Chờ xử lý</option>
            </select>
            <DatePicker
              placeholder="Từ ngày"
              onChange={(_, dateStr) => {
                setFilters((f) => ({ ...f, fromDate: dateStr ? `${dateStr as string}T00:00:00` : '' }));
                setPagination((p) => ({ ...p, page: 0 }));
              }}
            />
            <DatePicker
              placeholder="Đến ngày"
              onChange={(_, dateStr) => {
                setFilters((f) => ({ ...f, toDate: dateStr ? `${dateStr as string}T23:59:59` : '' }));
                setPagination((p) => ({ ...p, page: 0 }));
              }}
            />
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{
            current: pagination.page + 1,
            pageSize: pagination.size,
            total: pagination.total,
            showTotal: (total) => `${total} hóa đơn`,
            onChange: (page, size) => setPagination((p) => ({ ...p, page: page - 1, size })),
            className: '!m-0 sticky bottom-0 z-10 border-t border-slate-100 bg-white px-5 py-3',
          }}
          rowKey="key"
          scroll={{ y: 'calc(100vh - 285px)' }}
          rowClassName={(row) =>
            row.rawStatus === 'CANCELLED' ? 'opacity-60' : ''
          }
        />
      </div>
    </Card>
  );
}
