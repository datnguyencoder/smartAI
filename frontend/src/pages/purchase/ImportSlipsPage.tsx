import React from 'react';
import { Table, Modal, Buttonmessage as antdMessage, Dropdown, DatePicker, Progress, Form, Input, InputNumber } from 'antd';
import { Search, RotateCcw } from 'lucide-react';
import { Card , Select } from '@/components/ui';
import { StatusChip } from '@/components/ui';
import { receivePurchaseOrder, cancelPurchaseOrder, createPurchaseReturn, fetchPurchaseOrderById, fetchPurchaseOrdersPaged, fetchSuppliers, fetchLocations } from '@/services/wmsApi';
import { receivePurchaseOrderPartial } from '@/services/purchaseApi';
import type { SupplierDto, LocationDto } from '@/types/api';
import { purchaseToSlip, type ImportSlipRow } from '@/lib/purchaseMapper';
import { formatMoney as money } from '@/lib/itemMapper';
import { animateModalContent } from '@/lib/gsapAnimations';
import PurchaseOrderDetailModal from '@/components/purchase/PurchaseOrderDetailModal';

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

  const [receiveLoading, setReceiveLoading] = React.useState(false);
  const [canceling, setCanceling] = React.useState<ImportSlipRow | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [viewingDetails, setViewingDetails] = React.useState<ImportSlipRow | null>(null);
  const [returnOpen, setReturnOpen] = React.useState(false);
  const [returnLoading, setReturnLoading] = React.useState(false);
  const [returnForm] = Form.useForm();
  const [returnLines, setReturnLines] = React.useState<Array<{ itemId: number; itemName: string; quantity: number; unitPrice: number; maxQty: number }>>([]);

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

  const handleReceive = async (slip: ImportSlipRow, itemsToReceive: Array<{ purchaseOrderItemId: number; quantity: number }>) => {
    if (itemsToReceive.length === 0) {
      antdMessage.warning('Vui lòng nhập số lượng nhận cho ít nhất 1 mặt hàng');
      return;
    }
    setReceiveLoading(true);
    try {
      await receivePurchaseOrderPartial(slip.id, itemsToReceive);
      await reloadCatalog();
      await fetchData();
      antdMessage.success('Nhận hàng vào kho thành công');
      setViewingDetails(null);
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

  const loadReturnFromPo = async (poId: number) => {
    try {
      const po = await fetchPurchaseOrderById(poId);
      returnForm.setFieldsValue({ supplierId: po.supplierId, locationId: po.locationId, purchaseOrderId: poId });
      setReturnLines((po.items ?? []).map((it) => ({
        itemId: it.itemId,
        itemName: it.itemName,
        quantity: Math.max(0, it.receivedQty),
        unitPrice: it.unitPrice,
        maxQty: it.receivedQty,
      })).filter((l) => l.maxQty > 0));
    } catch (e) {
      antdMessage.error('Không tải chi tiết phiếu nhập');
    }
  };

  const handlePurchaseReturn = async () => {
    const values = await returnForm.validateFields();
    const items = returnLines.filter((l) => l.quantity > 0).map((l) => ({
      itemId: l.itemId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    }));
    if (items.length === 0) {
      antdMessage.warning('Nhập số lượng trả cho ít nhất 1 dòng');
      return;
    }
    setReturnLoading(true);
    try {
      await createPurchaseReturn({
        supplierId: values.supplierId,
        locationId: values.locationId,
        purchaseOrderId: values.purchaseOrderId,
        note: values.note,
        items,
      });
      antdMessage.success('Tạo phiếu trả hàng NCC thành công');
      setReturnOpen(false);
      returnForm.resetFields();
      setReturnLines([]);
      await reloadCatalog();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Tạo phiếu trả thất bại');
    } finally {
      setReturnLoading(false);
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
            <Button icon={<RotateCcw size={14} />} onClick={() => { setReturnOpen(true); returnForm.resetFields(); setReturnLines([]); }}>
              Trả hàng NCC
            </Button>
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
      <PurchaseOrderDetailModal
        open={Boolean(viewingDetails)}
        order={viewingDetails}
        onClose={() => setViewingDetails(null)}
        onReceive={handleReceive}
        onCancel={(order) => setCanceling(order)}
      />
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
      <Modal
        open={returnOpen}
        title="Tạo phiếu trả hàng nhà cung cấp"
        onCancel={() => setReturnOpen(false)}
        onOk={handlePurchaseReturn}
        confirmLoading={returnLoading}
        width={680}
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item name="purchaseOrderId" label="Phiếu nhập gốc (tùy chọn)">
            <Select
              allowClear
              showSearch
              placeholder="Chọn phiếu đã nhận"
              optionFilterProp="label"
              onChange={(v) => v && loadReturnFromPo(v)}
              options={data.filter((d) => d.statusRaw === 'COMPLETED').map((d) => ({
                value: d.id,
                label: `${d.key} · ${d.supplier}`,
              }))}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true }]}>
              <Select options={suppliers.map((s) => ({ value: s.id, label: s.supplierName }))} />
            </Form.Item>
            <Form.Item name="locationId" label="Kho trả" rules={[{ required: true }]}>
              <Select options={locations.map((l) => ({ value: l.id, label: l.locationName }))} />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
        {returnLines.length > 0 && (
          <Table
            size="small"
            pagination={false}
            rowKey="itemId"
            dataSource={returnLines}
            columns={[
              { title: 'Sản phẩm', dataIndex: 'itemName' },
              {
                title: 'SL trả',
                dataIndex: 'quantity',
                render: (v: number, _r, idx) => (
                  <InputNumber
                    min={0}
                    max={returnLines[idx].maxQty}
                    value={v}
                    onChange={(n) => {
                      const next = [...returnLines];
                      next[idx] = { ...next[idx], quantity: Number(n) || 0 };
                      setReturnLines(next);
                    }}
                  />
                ),
              },
              { title: 'Tối đa', dataIndex: 'maxQty', width: 70 },
            ]}
          />
        )}
      </Modal>
    </>
  );
}
