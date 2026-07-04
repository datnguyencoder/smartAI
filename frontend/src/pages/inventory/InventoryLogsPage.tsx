import React from 'react';
import { Table, DatePicker, Tag, message as antdMessage, Input, Modal, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Card, StatusChip , Select } from '@/components/ui';
import { fetchInventoryLogs, fetchLocations, fetchPurchaseOrderById } from '@/services/wmsApi';
import { formatMoney } from '@/lib/itemMapper';
import type { InventoryLogDto, LocationDto, ScrapOrderDto } from '@/types/api';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';
import PurchaseOrderDetailModal from '@/components/purchase/PurchaseOrderDetailModal';
import ScrapOrderDetailDrawer from '@/components/inventory/ScrapOrderDetailDrawer';
import { InvoiceDrawer, type InvoiceView } from '@/components/sales/InvoiceDrawer';
import { purchaseToSlip, type ImportSlipRow } from '@/lib/purchaseMapper';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOrderById, fetchScrapOrderById, fetchStocktakeById } from '@/services/wmsApi';
import type { StocktakeDto } from '@/types/api';

const { RangePicker } = DatePicker;

const ACTION_LABELS: Record<string, { text: string; color: string }> = {
  PURCHASE_RECEIVE: { text: 'Nhập kho', color: 'green' },
  SALE: { text: 'Bán hàng', color: 'red' },
  SALE_CANCEL: { text: 'Hủy bán', color: 'orange' },
  SCRAP: { text: 'Hủy hàng', color: 'volcano' },
  SCRAP_PENDING: { text: 'Chờ loại bỏ', color: 'orange' },
  SCRAP_COMPLETED: { text: 'Loại bỏ', color: 'volcano' },
  ADJUSTMENT: { text: 'Điều chỉnh', color: 'blue' },
};

const LEGACY_TRANSFER_ACTIONS = new Set(['TRANSFER_IN', 'TRANSFER_OUT']);

function resolveActionLabel(actionType: string) {
  if (LEGACY_TRANSFER_ACTIONS.has(actionType)) {
    return ACTION_LABELS.ADJUSTMENT;
  }
  return ACTION_LABELS[actionType] ?? { text: actionType, color: 'default' };
}

const REF_LABELS: Record<string, string> = {
  PURCHASE_ORDER: 'Phiếu nhập',
  ORDER: 'Đơn hàng',
  SCRAP_ORDER: 'Phiếu hủy',
  STOCK_ADJUSTMENT: 'Điều chỉnh',
  STOCKTAKE: 'Phiếu kiểm kê',
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
  
  const { authUser } = useAuth();
  const [viewingPurchaseOrder, setViewingPurchaseOrder] = React.useState<ImportSlipRow | null>(null);
  const [viewingSalesOrder, setViewingSalesOrder] = React.useState<InvoiceView | null>(null);
  const [viewingScrapOrder, setViewingScrapOrder] = React.useState<ScrapOrderDto | null>(null);
  const [viewStocktake, setViewStocktake] = React.useState<StocktakeDto | null>(null);

  const handleViewPurchaseOrder = async (id: number) => {
    try {
      const po = await fetchPurchaseOrderById(id);
      setViewingPurchaseOrder(purchaseToSlip(po));
    } catch (e) {
      antdMessage.error('Không thể tải thông tin phiếu nhập');
    }
  };

  const handleViewSalesOrder = async (id: number) => {
    try {
      const order = await fetchOrderById(id);
      setViewingSalesOrder({
        key: order.orderCode,
        orderId: order.id,
        customer: order.customerName,
        customerPhone: order.customerPhone,
        amount: order.totalAmount,
        cashier: order.cashierName || 'Khách',
        status: order.status,
        rawStatus: order.status,
        time: dayjs(order.orderDate).format('DD/MM/YYYY HH:mm'),
      });
    } catch (e: any) {
      antdMessage.error('Không thể tải thông tin đơn hàng');
    }
  };

  const handleViewScrapOrder = async (id: number) => {
    try {
      const scrap = await fetchScrapOrderById(id);
      setViewingScrapOrder(scrap);
    } catch (e: any) {
      antdMessage.error('Không thể tải thông tin phiếu hủy');
    }
  };

  const handleViewStocktake = async (id: number) => {
    try {
      const res = await fetchStocktakeById(id);
      setViewStocktake(res);
    } catch (e: unknown) {
      antdMessage.error('Không thể tải chi tiết phiếu kiểm kê');
    }
  };

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
        const info = resolveActionLabel(v);
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: 'Tham chiếu',
      width: 150,
      render: (_: unknown, row: InventoryLogDto) => {
        const label = row.referenceType
          ? row.referenceType === 'TRANSFER_ORDER'
            ? 'Điều chỉnh'
            : REF_LABELS[row.referenceType] ?? row.referenceType
          : '-';
        if (row.referenceId) {
          if (row.referenceType === 'PURCHASE_ORDER') {
            return (
              <a onClick={() => handleViewPurchaseOrder(row.referenceId!)} className="text-[#006c49] hover:underline cursor-pointer font-medium">
                {label} #{row.referenceId}
              </a>
            );
          }
          if (row.referenceType === 'ORDER') {
            return (
              <a onClick={() => handleViewSalesOrder(row.referenceId!)} className="text-blue-600 hover:underline cursor-pointer font-medium">
                {label} #{row.referenceId}
              </a>
            );
          }
          if (row.referenceType === 'SCRAP_ORDER') {
            return (
              <a onClick={() => handleViewScrapOrder(row.referenceId!)} className="text-orange-600 hover:underline cursor-pointer font-medium">
                {label} #{row.referenceId}
              </a>
            );
          }
          if (row.referenceType === 'STOCKTAKE') {
            return (
              <a onClick={() => handleViewStocktake(row.referenceId!)} className="text-purple-600 hover:underline cursor-pointer font-medium">
                {label} #{row.referenceId}
              </a>
            );
          }
        }
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
        const isNegative = v < 0;
        const colorClass = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-600';
        return (
          <span className={`${colorClass} font-semibold`}>
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
      render: (v: string, row: InventoryLogDto) => {
        if (!v && LEGACY_TRANSFER_ACTIONS.has(row.actionType)) {
          return 'Điều chỉnh';
        }
        return v || '—';
      },
    },
  ];

  return (
    <>
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
              <option value="PURCHASE_RECEIVE">Nhập kho</option>
              <option value="SALE">Bán hàng</option>
              <option value="SALE_CANCEL">Hủy bán</option>
              <option value="SCRAP_COMPLETED">Loại bỏ</option>
              <option value="ADJUSTMENT">Điều chỉnh</option>
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
          scroll={{ x: 1100, y: 'calc(100vh - 300px)' }}
          size="middle"
        />
      </Card>

      <PurchaseOrderDetailModal
        open={Boolean(viewingPurchaseOrder)}
        order={viewingPurchaseOrder}
        onClose={() => setViewingPurchaseOrder(null)}
      />
      {authUser && (
        <InvoiceDrawer
          invoice={viewingSalesOrder}
          authUser={authUser}
          onClose={() => setViewingSalesOrder(null)}
        />
      )}
      <ScrapOrderDetailDrawer
        open={Boolean(viewingScrapOrder)}
        order={viewingScrapOrder}
        onClose={() => setViewingScrapOrder(null)}
      />

      <Modal
        title={
          <div className="flex items-center justify-between mr-8 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-slate-800">
                Chi tiết phiếu kiểm kê: ST-{String(viewStocktake?.id || 0).padStart(4, '0')}
              </span>
              <StatusChip tone={
                viewStocktake?.status === 'DRAFT' ? 'warning' 
                  : viewStocktake?.status === 'CANCELLED' ? 'danger' 
                    : 'success'
              }>
                {viewStocktake?.status === 'CONFIRMED' ? 'Đã duyệt' : viewStocktake?.status}
              </StatusChip>
            </div>
          </div>
        }
        open={!!viewStocktake}
        onCancel={() => setViewStocktake(null)}
        footer={[
          <Button key="close" onClick={() => setViewStocktake(null)}>
            Đóng
          </Button>
        ]}
        width={1100}
      >
        {viewStocktake && (() => {
          const changedItems = viewStocktake.items.filter(i => {
            const n = Number(i.actualQuantity) - Number(i.systemQuantity);
            return n !== 0;
          });
          const totalVariance = changedItems.reduce((sum, i) => sum + Math.abs(Number(i.actualQuantity) - Number(i.systemQuantity)), 0);

          return (
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin chung</h4>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-20">Kho kiểm kê:</span> 
                    <span className="font-semibold text-slate-800">{viewStocktake.locationName}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-20">Người tạo:</span> 
                    <span className="font-medium text-slate-800">{viewStocktake.createdByUsername || `ID: ${viewStocktake.createdBy}`}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian</h4>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-20">Ngày tạo:</span> 
                    <span className="font-medium text-slate-800">{dayjs(viewStocktake.stocktakeDate).format('DD/MM/YYYY HH:mm')}</span>
                  </div>
                  {viewStocktake.confirmedAt && (
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-20">Ngày duyệt:</span> 
                      <span className="font-medium text-slate-800">{dayjs(viewStocktake.confirmedAt).format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                  )}
                </div>

                {viewStocktake.note && (
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Ghi chú</h4>
                    <div className="flex gap-2 flex-col">
                      <span className="text-slate-500 w-20">Nội dung:</span> 
                      <span className="text-slate-800 line-clamp-2">{viewStocktake.note}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium">
                <div>Các món bị đổi: <strong className="text-slate-800">{changedItems.length} mặt hàng</strong></div>
                <div>Tổng chênh lệch: <strong className="text-slate-800">{totalVariance} SP</strong></div>
              </div>

              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <Table 
                  size="middle" 
                  pagination={{ pageSize: 10 }} 
                  dataSource={changedItems} 
                  rowKey={(i) => `${i.itemId}-${i.lotId}`}
                  columns={[
                    { title: 'Sản phẩm', dataIndex: 'itemName', className: 'text-xs', width: '35%' },
                    { title: 'Lô', dataIndex: 'lotNumber', render: (v?: string) => v || '—', className: 'text-xs' },
                    { title: 'Sổ sách', dataIndex: 'systemQuantity', className: 'text-xs' },
                    { title: 'Thực tế', dataIndex: 'actualQuantity', className: 'text-xs font-semibold' },
                    {
                      title: 'Chênh lệch',
                      className: 'text-xs',
                      render: (_: unknown, line) => {
                        const n = Number(line.actualQuantity) - Number(line.systemQuantity);
                        return (
                          <span className={`font-bold ${n > 0 ? 'text-green-600' : n < 0 ? 'text-red-600' : ''}`}>
                            {n > 0 ? `+${n}` : n}
                          </span>
                        );
                      },
                    },
                  ]}
                />
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
