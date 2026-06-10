import React from 'react';
import { Table, Select, DatePicker, Tag, message as antdMessage } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Card } from '../components/ui';
import { fetchInventoryLogs, fetchLocations } from '../services/wmsApi';
import { formatMoney } from '../lib/itemMapper';
import type { InventoryLogDto, LocationDto } from '../types/api';
import { Search } from 'lucide-react';
import { Input } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ACTION_LABELS: Record<string, { text: string; color: string }> = {
  PURCHASE_RECEIVE: { text: 'Nhập kho', color: 'green' },
  SALE: { text: 'Bán hàng', color: 'red' },
  SALE_CANCEL: { text: 'Hủy bán', color: 'orange' },
  SCRAP: { text: 'Hủy hàng', color: 'volcano' },
  ADJUSTMENT: { text: 'Điều chỉnh', color: 'blue' },
};

const REF_LABELS: Record<string, string> = {
  PURCHASE_ORDER: 'Phiếu nhập',
  ORDER: 'Đơn hàng',
  SCRAP_ORDER: 'Phiếu hủy',
  STOCK_ADJUSTMENT: 'Điều chỉnh',
};

export default function InventoryLogsPage() {
  const [data, setData] = React.useState<InventoryLogDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [actionFilter, setActionFilter] = React.useState<string | undefined>();
  const [locationFilter, setLocationFilter] = React.useState<number | undefined>();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState<[string, string] | undefined>();
  const [locations, setLocations] = React.useState<LocationDto[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInventoryLogs(
        page - 1,
        pageSize,
        actionFilter,
        undefined, // itemId
        locationFilter,
        searchQuery,
        dateRange?.[0],
        dateRange?.[1]
      );
      setData(res.content);
      setTotal(res.totalElements);
    } catch (e) {
      antdMessage.error('Không thể tải nhật ký biến động kho');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, locationFilter, searchQuery, dateRange]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    fetchLocations().then(setLocations).catch(console.error);
  }, []);

  const columns: ColumnsType<InventoryLogDto> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) =>
        v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'itemName',
      ellipsis: true,
    },
    {
      title: 'Kho',
      dataIndex: 'locationName',
      ellipsis: true,
    },
    {
      title: 'Loại hành động',
      dataIndex: 'actionType',
      width: 140,
      render: (v: string) => {
        const info = ACTION_LABELS[v] ?? { text: v, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: 'Tham chiếu',
      width: 150,
      render: (_: unknown, row: InventoryLogDto) => {
        const label = row.referenceType ? REF_LABELS[row.referenceType] ?? row.referenceType : '—';
        return row.referenceId ? `${label} #${row.referenceId}` : label;
      },
    },
    {
      title: 'Trước',
      dataIndex: 'quantityBefore',
      width: 100,
      align: 'right',
      render: (v: number) => v?.toLocaleString('vi-VN') ?? '—',
    },
    {
      title: 'Thay đổi',
      dataIndex: 'quantityChange',
      width: 110,
      align: 'right',
      render: (v: number) => {
        const isPositive = v > 0;
        return (
          <span className={isPositive ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
            {isPositive ? '+' : ''}{v?.toLocaleString('vi-VN') ?? '—'}
          </span>
        );
      },
    },
    {
      title: 'Sau',
      dataIndex: 'quantityAfter',
      width: 100,
      align: 'right',
      render: (v: number) => v?.toLocaleString('vi-VN') ?? '—',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <h2 className="font-semibold text-lg">Nhật ký biến động kho</h2>
          <Input className="w-64" prefix={<Search size={16} />} placeholder="Tìm kiếm sản phẩm, kho, phiếu..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} allowClear />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={locationFilter || ''}
            onChange={(e) => {
              const val = e.target.value;
              setLocationFilter(val ? Number(val) : undefined);
              setPage(1);
            }}
            className="h-[34px] px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">Tất cả vị trí kho</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.locationName}</option>
            ))}
          </select>
          <select
            value={actionFilter ?? 'ALL'}
            onChange={(e) => {
              const val = e.target.value;
              setActionFilter(val === 'ALL' ? undefined : val);
              setPage(1);
            }}
            className="h-[34px] px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="PURCHASE_RECEIVE">🟢 Nhập kho</option>
            <option value="SALE">🔴 Bán hàng</option>
            <option value="SALE_CANCEL">🟠 Hủy bán</option>
            <option value="SCRAP">🔥 Hủy hàng</option>
            <option value="ADJUSTMENT">🔵 Điều chỉnh</option>
          </select>
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([
                  dates[0].format('YYYY-MM-DD'),
                  dates[1].format('YYYY-MM-DD'),
                ]);
              } else {
                setDateRange(undefined);
              }
              setPage(1);
            }}
          />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t) => `Tổng ${t} bản ghi`,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
        }}
        rowKey="id"
        scroll={{ x: 1100 }}
        size="middle"
      />
    </Card>
  );
}
