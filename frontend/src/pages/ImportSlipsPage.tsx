import React from 'react';
import { Table, Modal, Button, Select, message as antdMessage, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Card } from '../components/ui';
import { StatusChip } from '../components/ui';
import { receivePurchaseOrder, cancelPurchaseOrder, fetchPurchaseOrdersPaged } from '../services/wmsApi';
import { purchaseToSlip, type ImportSlipRow } from '../lib/purchaseMapper';
import { formatMoney as money } from '../lib/itemMapper';
import { animateModalContent } from '../lib/gsapAnimations';

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
      const res = await fetchPurchaseOrdersPaged(page - 1, pageSize, statusFilter, globalSearch);
      setData(res.content.map(purchaseToSlip));
      setTotal(res.totalElements);
    } catch (e) {
      antdMessage.error('Không thể tải danh sách phiếu nhập');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, globalSearch]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <h2 className="font-semibold text-lg">Danh sách phiếu nhập hàng</h2>
          <div className="flex gap-3 items-center">
            <Select
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              className="w-40"
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'PENDING', label: 'Chờ nhận' },
                { value: 'COMPLETED', label: 'Đã nhận' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ]}
            />
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
