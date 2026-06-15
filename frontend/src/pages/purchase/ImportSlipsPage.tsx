import React from 'react';
import { Table, Modal, Button, Select, message as antdMessage, Dropdown, DatePicker } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Search } from 'lucide-react';
import { Input } from 'antd';
import { Card } from '@/components/ui';
import { StatusChip } from '@/components/ui';
import { receivePurchaseOrder, cancelPurchaseOrder, fetchPurchaseOrdersPaged, fetchSuppliers, fetchLocations } from '@/services/wmsApi';
import type { SupplierDto, LocationDto } from '@/types/api';
import { purchaseToSlip, type ImportSlipRow } from '@/lib/purchaseMapper';
import { formatMoney as money } from '@/lib/itemMapper';
import { animateModalContent } from '@/lib/gsapAnimations';

export default function ImportSlipsPage({
  reloadCatalog,
  globalSearch,
}: {
  reloadCatalog: () => Promise<void>;
  globalSearch: string;
}) {
  const [data, setData] = React.useState<ImportSlipRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [supplierFilter, setSupplierFilter] = React.useState<number | undefined>(undefined);
  const [locationFilter, setLocationFilter] = React.useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState<any>(null);
  
  const [suppliers, setSuppliers] = React.useState<SupplierDto[]>([]);
  const [locations, setLocations] = React.useState<LocationDto[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [receiving, setReceiving] = React.useState<ImportSlipRow | null>(null);
  const [receiveLoading, setReceiveLoading] = React.useState(false);
  const [canceling, setCanceling] = React.useState<ImportSlipRow | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [viewingDetails, setViewingDetails] = React.useState<ImportSlipRow | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
      const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;
      const res = await fetchPurchaseOrdersPaged(page - 1, pageSize, statusFilter, searchQuery, supplierFilter, locationFilter, fromDate, toDate);
      setData(res.content.map(purchaseToSlip));
      setTotal(res.totalElements);
    } catch (e) {
      antdMessage.error('Không thể tải danh sách phiếu nhập');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery, supplierFilter, locationFilter, dateRange]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    fetchSuppliers().then(setSuppliers).catch(console.error);
    fetchLocations().then(setLocations).catch(console.error);
  }, []);

  // removing animateModalContent for now since it might be in App.tsx
  // React.useEffect(() => {
  //   if (receiving) animateModalContent(receiptRef.current);
  // }, [receiving]);

  const handleReceiveAll = async (slip: ImportSlipRow) => {
    setReceiveLoading(true);
    try {
      await receivePurchaseOrder(slip.id);
      await reloadCatalog();
      await fetchData();
      antdMessage.success('Nhận hàng vào kho thành công');
      setReceiving(null);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Nhận hàng thất bại');
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleCancel = async (slip: ImportSlipRow) => {
    setCancelLoading(true);
    try {
      await cancelPurchaseOrder(slip.id);
      await reloadCatalog();
      await fetchData();
      antdMessage.success('Hủy phiếu thành công');
      setCanceling(null);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Hủy phiếu thất bại');
    } finally {
      setCancelLoading(false);
    }
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'key' },
    { title: 'Nhà cung cấp', dataIndex: 'supplier' },
    { title: 'Kho', dataIndex: 'locationName' },
    { title: 'Tổng giá trị', dataIndex: 'amount', render: (v: number) => money(v) },
    { title: 'Ngày', dataIndex: 'time' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (v: string) => (
        <StatusChip tone={v.includes('Chờ') || v.includes('phần') ? 'warning' : v.includes('Hủy') ? 'danger' : 'success'}>{v}</StatusChip>
      ),
    },
    {
      title: 'Hành động',
      render: (_: unknown, row: ImportSlipRow) => {
        return (
          <div className="flex flex-wrap gap-2 items-center">
            <Button size="small" onClick={() => setViewingDetails(row)}>
              Chi tiết
            </Button>
            {row.canReceive && (
              <>
                <Button size="small" type="primary" className="!bg-[#006c49]" onClick={() => setReceiving(row)}>
                  Nhận hàng
                </Button>
                <Button size="small" danger onClick={() => setCanceling(row)}>
                  Hủy
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <h2 className="font-semibold text-lg">Danh sách phiếu nhập hàng</h2>
            <Input className="w-64" prefix={<Search size={16} />} placeholder="Tìm kiếm phiếu nhập..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} allowClear />
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <DatePicker.RangePicker 
              value={dateRange} 
              onChange={(val) => { setDateRange(val); setPage(1); }} 
              style={{ width: 250 }} 
            />
            <select
              className="h-[34px] px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white"
              value={supplierFilter || ""}
              onChange={(e) => {
                const val = e.target.value;
                setSupplierFilter(val ? Number(val) : undefined);
                setPage(1);
              }}
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.supplierName}</option>
              ))}
            </select>
            <select
              className="h-[34px] px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white"
              value={locationFilter || ""}
              onChange={(e) => {
                const val = e.target.value;
                setLocationFilter(val ? Number(val) : undefined);
                setPage(1);
              }}
            >
              <option value="">Chọn kho</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.locationName}</option>
              ))}
            </select>
            <select
              className="h-[34px] px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ nhận</option>
              <option value="COMPLETED">Đã nhận</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ current: page, pageSize, total, onChange: (p, s) => { setPage(p); setPageSize(s); } }}
          rowKey="key"
        />
      </Card>
      <Modal
        open={Boolean(viewingDetails)}
        onCancel={() => setViewingDetails(null)}
        title={`Chi tiết phiếu nhập — ${viewingDetails?.key}`}
        footer={[
          <Button key="close" onClick={() => setViewingDetails(null)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        <div className="mb-4 text-sm text-slate-600">
          <p>Nhà cung cấp: <span className="font-medium text-slate-800">{viewingDetails?.supplier}</span></p>
          <p>Kho nhận: <span className="font-medium text-slate-800">{viewingDetails?.locationName}</span></p>
          <p>Trạng thái: <span className="font-medium text-slate-800">{viewingDetails?.status}</span></p>
        </div>
        <Table
          dataSource={viewingDetails?.items ?? []}
          pagination={false}
          size="small"
          rowKey="id"
          columns={[
            { title: 'Sản phẩm', dataIndex: 'itemName' },
            { title: 'Đơn vị', dataIndex: 'purchaseUomName' },
            { title: 'Số lượng đặt', dataIndex: 'orderedQty' },
            { title: 'Đã nhận', dataIndex: 'receivedQty' },
            { title: 'Đơn giá', dataIndex: 'unitPrice', render: (v) => money(Number(v)) },
          ]}
        />
      </Modal>
      <Modal
        open={Boolean(receiving)}
        onCancel={() => setReceiving(null)}
        title={`Nhận hàng — ${receiving?.key}`}
        footer={[
          <Button key="cancel" onClick={() => setReceiving(null)}>
            Đóng
          </Button>,
          <Button
            key="ok"
            type="primary"
            className="!bg-[#006c49]"
            loading={receiveLoading}
            onClick={() => receiving && handleReceiveAll(receiving)}
          >
            Nhận
          </Button>,
        ]}
      >
        <div ref={receiptRef} className="space-y-2 text-sm">
          {(receiving?.items ?? []).map((i) => (
            <div key={i.id} className="flex justify-between border-b border-slate-100 py-2">
              <span>{i.itemName}</span>
              <span>
                Đặt {i.orderedQty} · Đã nhận {i.receivedQty}
              </span>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        open={Boolean(canceling)}
        onCancel={() => setCanceling(null)}
        title={`Xác nhận hủy phiếu ${canceling?.key}?`}
        onOk={() => canceling && handleCancel(canceling)}
        confirmLoading={cancelLoading}
        okButtonProps={{ danger: true }}
        okText="Hủy phiếu"
      >
        <p>Hành động này không thể hoàn tác. Các sản phẩm trong phiếu sẽ không được nhập vào kho.</p>
      </Modal>
    </>
  );
}
