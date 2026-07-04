import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Radio, message as antdMessage } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Card, StatusChip } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { PurchaseReportDto } from '@/types/api';
import { StatCard } from '../StatCard';
import PurchaseOrderDetailModal from '@/components/purchase/PurchaseOrderDetailModal';
import { fetchPurchaseOrdersPaged, receivePurchaseOrder, cancelPurchaseOrder } from '@/services/wmsApi';
import dayjs from 'dayjs';
import { fuzzySearch } from '@/lib/fuzzySearch';

type PurchaseReportTabProps = {
  purchaseData: PurchaseReportDto[];
  loading: boolean;
  debouncedSearchText: string;
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  onOrderChanged: () => void;
};

export function PurchaseReportTab({
  purchaseData,
  loading,
  debouncedSearchText,
  dateRange,
  onOrderChanged,
}: PurchaseReportTabProps) {
  const [purchaseSubView, setPurchaseSubView] = useState<'supplier' | 'slips'>('supplier');
  const [slipsQuery, setSlipsQuery] = useState({
    supplierId: undefined as number | undefined,
    supplierName: undefined as string | undefined,
    page: 1,
    pageSize: 10,
  });
  const [slipsData, setSlipsData] = useState<any[]>([]);
  const [slipsTotal, setSlipsTotal] = useState(0);
  const [slipsLoading, setSlipsLoading] = useState(false);
  const [viewingSlipDetails, setViewingSlipDetails] = useState<any | null>(null);

  const [receivingOrder, setReceivingOrder] = useState<any | null>(null);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState<any | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const filteredPurchaseData = useMemo(() => {
    return fuzzySearch(purchaseData, ['supplierName'], debouncedSearchText);
  }, [purchaseData, debouncedSearchText]);

  const purchaseTotals = useMemo(() => {
    const totalAmount = purchaseData.reduce((s, r) => s + r.totalAmount, 0);
    const totalOrders = purchaseData.reduce((s, r) => s + r.totalOrders, 0);
    const totalQuantity = purchaseData.reduce((s, r) => s + r.totalQuantity, 0);
    return { totalAmount, totalOrders, totalQuantity, supplierCount: purchaseData.length };
  }, [purchaseData]);

  const formatRange = (): { from?: string; to?: string } => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return {};
    return {
      from: dateRange[0].format('YYYY-MM-DD'),
      to: dateRange[1].format('YYYY-MM-DD'),
    };
  };

  const loadSlipsData = useCallback(async () => {
    setSlipsLoading(true);
    const { from, to } = formatRange();
    try {
      const res = await fetchPurchaseOrdersPaged(
        slipsQuery.page - 1,
        slipsQuery.pageSize,
        undefined,
        undefined,
        slipsQuery.supplierId,
        undefined,
        from,
        to
      );
      setSlipsData(res.content);
      setSlipsTotal(res.totalElements);
    } catch (e) {
      antdMessage.error('Không thể tải danh sách phiếu nhập');
    } finally {
      setSlipsLoading(false);
    }
  }, [slipsQuery.page, slipsQuery.pageSize, slipsQuery.supplierId, dateRange]);

  useEffect(() => {
    if (purchaseSubView === 'slips') {
      loadSlipsData();
    }
  }, [purchaseSubView, slipsQuery.page, slipsQuery.pageSize, slipsQuery.supplierId, dateRange, loadSlipsData]);

  const handleReceiveAll = async (order: any) => {
    setReceiveLoading(true);
    try {
      await receivePurchaseOrder(order.id);
      antdMessage.success('Nhận hàng vào kho thành công');
      setReceivingOrder(null);
      setViewingSlipDetails(null);
      loadSlipsData();
      onOrderChanged();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Nhận hàng thất bại');
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleCancelOrder = async (order: any) => {
    setCancelLoading(true);
    try {
      await cancelPurchaseOrder(order.id);
      antdMessage.success('Hủy phiếu thành công');
      setCancelingOrder(null);
      setViewingSlipDetails(null);
      loadSlipsData();
      onOrderChanged();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Hủy phiếu thất bại');
    } finally {
      setCancelLoading(false);
    }
  };

  const purchaseColumns: ColumnsType<PurchaseReportDto> = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => (a.supplierName || '').localeCompare(b.supplierName || ''),
    },
    {
      title: 'Số đơn nhập',
      dataIndex: 'totalOrders',
      width: 150,
      sorter: (a, b) => a.totalOrders - b.totalOrders,
      render: (v: number, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSlipsQuery({
              supplierId: record.supplierId,
              supplierName: record.supplierName,
              page: 1,
              pageSize: 10,
            });
            setPurchaseSubView('slips');
          }}
          className="p-0 font-semibold flex items-center gap-1 hover:text-indigo-600"
        >
          <span>{v.toLocaleString('vi-VN')} đơn</span>
          <span className="material-symbols-rounded text-sm">search</span>
        </Button>
      ),
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalAmount',
      width: 160,
      render: (v: number) => money(v),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Đơn giá TB',
      width: 140,
      sorter: (a, b) => a.totalAmount / (a.totalQuantity || 1) - b.totalAmount / (b.totalQuantity || 1),
      render: (_, r) => money(Math.round(r.totalAmount / (r.totalQuantity || 1))),
    },
    {
      title: 'Số mặt hàng đã nhập',
      dataIndex: 'totalItemTypes',
      width: 180,
      sorter: (a, b) => a.totalItemTypes - b.totalItemTypes,
    },
    {
      title: 'Tổng SL nhập',
      dataIndex: 'totalQuantity',
      width: 130,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
    },
  ];

  const slipsColumns = [
    { title: 'Mã phiếu', dataIndex: 'id', width: 100, render: (id: number) => `PN-${id}` },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', width: 180 },
    { title: 'Kho nhận', dataIndex: 'locationName', width: 150 },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', width: 130, align: 'right' as const, render: (v: number) => money(v) },
    { title: 'Ngày nhập', dataIndex: 'purchaseDate', width: 130, render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => (
        <StatusChip tone={v === 'PENDING' ? 'warning' : v === 'CANCELLED' ? 'danger' : 'success'}>
          {v === 'PENDING' ? 'Chờ nhận' : v === 'CANCELLED' ? 'Đã hủy' : 'Đã nhận'}
        </StatusChip>
      ),
    },
    {
      title: 'Hành động',
      width: 100,
      render: (_: any, row: any) => (
        <Button size="small" onClick={() => setViewingSlipDetails(row)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const renderPurchaseSummary = (pageData: readonly PurchaseReportDto[]) => {
    let totalOrd = 0;
    let totalAmt = 0;
    let totalQty = 0;

    pageData.forEach((r) => {
      totalOrd += r.totalOrders;
      totalAmt += r.totalAmount;
      totalQty += r.totalQuantity;
    });

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row className="bg-slate-50 font-bold">
          <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
          <Table.Summary.Cell index={1}>{totalOrd.toLocaleString('vi-VN')}</Table.Summary.Cell>
          <Table.Summary.Cell index={2}>{money(totalAmt)}</Table.Summary.Cell>
          <Table.Summary.Cell index={3}>—</Table.Summary.Cell>
          <Table.Summary.Cell index={4}>—</Table.Summary.Cell>
          <Table.Summary.Cell index={5}>{Math.round(totalQty).toLocaleString('vi-VN')}</Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Tổng chi nhập" value={money(purchaseTotals.totalAmount)} color="text-blue-600" />
        <StatCard label="Số đơn nhập" value={purchaseTotals.totalOrders.toLocaleString('vi-VN')} />
        <StatCard label="Tổng SL nhập" value={Math.round(purchaseTotals.totalQuantity).toLocaleString('vi-VN')} />
        <StatCard label="Nhà cung cấp" value={purchaseTotals.supplierCount} />
      </div>
      <Card>
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Chi tiết nhập hàng</h2>
            <p className="text-xs text-slate-400">
              {purchaseSubView === 'supplier'
                ? 'Thống kê tổng hợp lượng tiền chi nhập hàng theo từng đối tác.'
                : 'Xem danh sách chi tiết các phiếu nhập kho đã phát sinh.'}
            </p>
          </div>
          <Radio.Group
            value={purchaseSubView}
            onChange={(e) => {
              setPurchaseSubView(e.target.value);
              setSlipsQuery((prev) => ({ ...prev, page: 1 }));
            }}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="supplier">Tổng hợp theo NCC</Radio.Button>
            <Radio.Button value="slips">Danh sách phiếu nhập</Radio.Button>
          </Radio.Group>
        </div>

        <div className="px-4 py-4 space-y-4">
          {purchaseSubView === 'supplier' ? (
            <Table
              loading={loading}
              dataSource={filteredPurchaseData.map((r) => ({ ...r, key: r.supplierId }))}
              columns={purchaseColumns}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ y: 400, x: 'max-content' }}
              size="small"
              summary={renderPurchaseSummary}
            />
          ) : (
            <div className="space-y-4">
              {slipsQuery.supplierId && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-indigo-600 text-lg">filter_alt</span>
                    <span className="text-sm text-indigo-900 font-medium">
                      Đang lọc theo nhà cung cấp: <strong className="text-indigo-950 underline">{slipsQuery.supplierName}</strong>
                    </span>
                  </div>
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => setSlipsQuery((prev) => ({ ...prev, supplierId: undefined, supplierName: undefined, page: 1 }))}
                    className="border-indigo-300 hover:border-indigo-400 text-indigo-700 font-semibold"
                  >
                    Xóa bộ lọc NCC
                  </Button>
                </div>
              )}
              <Table
                loading={slipsLoading}
                dataSource={slipsData.map((item) => ({ ...item, key: item.id }))}
                columns={slipsColumns}
                pagination={{
                  current: slipsQuery.page,
                  pageSize: slipsQuery.pageSize,
                  total: slipsTotal,
                  showSizeChanger: true,
                  onChange: (p, s) => setSlipsQuery((prev) => ({ ...prev, page: p, pageSize: s || 10 })),
                }}
                scroll={{ y: 400, x: 'max-content' }}
                size="small"
              />
            </div>
          )}
        </div>
      </Card>

      <PurchaseOrderDetailModal
        open={Boolean(viewingSlipDetails)}
        order={viewingSlipDetails}
        onClose={() => setViewingSlipDetails(null)}
        onReceive={(order) => setReceivingOrder(order)}
        onCancel={(order) => setCancelingOrder(order)}
      />

      <Modal
        open={Boolean(receivingOrder)}
        onCancel={() => setReceivingOrder(null)}
        title={`Nhận hàng — PN-${receivingOrder?.id}`}
        footer={[
          <Button key="cancel" onClick={() => setReceivingOrder(null)}>Đóng</Button>,
          <Button
            key="ok"
            type="primary"
            className="!bg-[#006c49] hover:!bg-[#005237] border-none"
            loading={receiveLoading}
            onClick={() => receivingOrder && handleReceiveAll(receivingOrder)}
          >
            Xác nhận nhận hàng
          </Button>,
        ]}
      >
        <div className="space-y-2 text-sm">
          <p className="text-slate-500 mb-3">Xác nhận nhận toàn bộ hàng hóa trong phiếu nhập này:</p>
          {(receivingOrder?.items ?? []).map((i: any) => (
            <div key={i.id} className="flex justify-between border-b border-slate-100 py-2">
              <span className="font-medium">{i.itemName}</span>
              <span className="text-slate-500">Đặt {i.orderedQty} · Đã nhận {i.receivedQty}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={Boolean(cancelingOrder)}
        onCancel={() => setCancelingOrder(null)}
        title={`Xác nhận hủy phiếu PN-${cancelingOrder?.id}?`}
        onOk={() => cancelingOrder && handleCancelOrder(cancelingOrder)}
        confirmLoading={cancelLoading}
        okButtonProps={{ danger: true }}
        okText="Hủy phiếu"
      >
        <p>Hành động này không thể hoàn tác. Các sản phẩm trong phiếu sẽ không được nhập vào kho.</p>
      </Modal>
    </div>
  );
}
