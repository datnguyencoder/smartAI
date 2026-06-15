import { Button, DatePicker, Input, Table, message as antdMessage } from 'antd';
import * as React from 'react';
import { Card, CardHeader, StatusChip } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import { ordersToInvoices } from '@/lib/mappers/ordersToInvoices';
import { cancelOrder, fetchOrdersPaged } from '@/services/wmsApi';
import type { UserDto } from '@/types/api';

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
    fetchOrdersPaged(pagination.page, pagination.size, filters.search, filters.status, filters.fromDate, filters.toDate)
      .then(res => {
        if (active) {
          setOrders(ordersToInvoices(res.content));
          setPagination(p => ({ ...p, total: res.totalElements }));
        }
      })
      .catch(e => {
        if (active) antdMessage.error('Lỗi tải hóa đơn');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pagination.page, pagination.size, filters.search, filters.status, filters.fromDate, filters.toDate, reloadTick]);

  const columns = [
    { title: 'Mã hóa đơn', dataIndex: 'key', render: (v: string, row: any) => <button className="font-bold text-primary hover:text-emerald" onClick={() => setSelectedInvoice(row)}>{v}</button> },
    { title: 'Khách hàng', dataIndex: 'customer' },
    { title: 'Thu ngân', dataIndex: 'cashier' },
    { title: 'Tổng thanh toán', dataIndex: 'amount', render: (v: number) => money(v) },
    { title: 'Thời gian', dataIndex: 'time' },
    { title: 'Trạng thái', dataIndex: 'status', render: (v: string) => <StatusChip tone={v.includes('toán') ? 'success' : 'warning'}>{v}</StatusChip> },
    {
      title: 'Hành động',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => setSelectedInvoice(row)}>Chi tiết</Button>
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
    <Card className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <CardHeader title="Danh sách hóa đơn" className="shrink-0" action={
        <div className="flex gap-2">
          <Input.Search
            placeholder="Tìm mã, khách hàng..."
            onSearch={val => { setFilters(f => ({ ...f, search: val })); setPagination(p => ({ ...p, page: 0 })); }}
            style={{ width: 240 }}
            allowClear
          />
          <select
            className="h-8 px-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-primary bg-white"
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 0 })); }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="COMPLETED">Đã thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <DatePicker
            placeholder="Từ ngày"
            onChange={(_, dateStr) => { setFilters(f => ({ ...f, fromDate: dateStr ? (dateStr as string) + 'T00:00:00' : '' })); setPagination(p => ({ ...p, page: 0 })); }}
          />
          <DatePicker
            placeholder="Đến ngày"
            onChange={(_, dateStr) => { setFilters(f => ({ ...f, toDate: dateStr ? (dateStr as string) + 'T23:59:59' : '' })); setPagination(p => ({ ...p, page: 0 })); }}
          />
        </div>
      } />
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{
            current: pagination.page + 1,
            pageSize: pagination.size,
            total: pagination.total,
            onChange: (page, size) => setPagination(p => ({ ...p, page: page - 1, size })),
            className: 'px-5 py-3 !m-0 border-t border-slate-100 bg-white sticky bottom-0 z-10'
          }}
          rowKey="key"
          scroll={{ y: 'calc(100vh - 275px)' }}
        />
      </div>
    </Card>
  );
}
