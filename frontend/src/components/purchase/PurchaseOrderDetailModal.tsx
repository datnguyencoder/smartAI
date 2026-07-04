import * as React from 'react';
import { Modal, Button, Table, Progress, InputNumber, Tooltip, Input } from 'antd';
import { Check, X, Search, HelpCircle } from 'lucide-react';
import { StatusChip } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';

export type PurchaseOrderDetailModalProps = {
  open: boolean;
  order: {
    id: number;
    key?: string;
    supplierName?: string;
    supplier?: string;
    locationName: string;
    status: string;
    statusRaw?: string;
    purchaseDate?: string;
    time?: string;
    completedAt?: string;
    totalAmount?: number;
    amount?: number;
    items: Array<{
      id: number;
      itemName: string;
      uomName?: string;
      purchaseUomName?: string;
      purchaseRatio?: number;
      orderedQty: number;
      receivedQty: number;
      unitPrice: number;
      subtotal: number;
    }>;
  } | null;
  onClose: () => void;
  onReceive?: (order: any, items: Array<{ purchaseOrderItemId: number; quantity: number }>) => void;
  onCancel?: (order: any) => void;
};

export default function PurchaseOrderDetailModal({
  open,
  order,
  onClose,
  onReceive,
  onCancel,
}: PurchaseOrderDetailModalProps) {
  const [receiveLines, setReceiveLines] = React.useState<Record<number, number>>({});
  const [searchText, setSearchText] = React.useState('');

  React.useEffect(() => {
    if (order) {
      const initial: Record<number, number> = {};
      (order.items || []).forEach(i => {
        initial[i.id] = Math.max(0, Number(i.orderedQty) - Number(i.receivedQty));
      });
      setReceiveLines(initial);
    } else {
      setReceiveLines({});
      setSearchText('');
    }
  }, [order]);

  if (!order) return null;

  // Map raw status enum to Vietnamese labels
  const statusLabelMap: Record<string, string> = {
    'PENDING': 'Chờ nhận',
    'COMPLETED': 'Đã nhận',
    'CANCELLED': 'Đã hủy',
    'PARTIALLY_RECEIVED': 'Nhận thiếu',
  };

  // Resolve compatibility fields between PurchaseOrderDto and ImportSlipRow
  const slipCode = order.key || `PN-${order.id}`;
  const supplierName = order.supplierName || order.supplier || '—';
  const displayStatus = statusLabelMap[order.status] || order.status || '—';
  const displayStatusRaw = order.statusRaw || order.status || 'PENDING';
  
  // Try to parse the creation date
  let displayCreatedDate = order.time || '—';
  if (displayCreatedDate === '—' && order.purchaseDate) {
    displayCreatedDate = new Date(order.purchaseDate).toLocaleDateString('vi-VN');
  }

  // Check if we can receive / cancel (PENDING or PARTIALLY_RECEIVED)
  const canReceive = displayStatusRaw === 'PENDING' || displayStatusRaw === 'PARTIALLY_RECEIVED';

  // Calculate totals
  let totalOrdered = 0;
  let totalReceived = 0;
  let totalMissing = 0;
  let totalAmountOrdered = 0;
  let totalAmountActual = 0;
  let totalAmountMissing = 0;

  (order.items || []).forEach((item) => {
    const oQty = Number(item.orderedQty || 0);
    const rQty = Number(item.receivedQty || 0);
    const price = Number(item.unitPrice || 0);
    const mQty = Math.max(0, oQty - rQty);

    totalOrdered += oQty;
    totalReceived += rQty;
    totalMissing += mQty;
    totalAmountOrdered += oQty * price;
    totalAmountActual += rQty * price;
    totalAmountMissing += mQty * price;
  });

  const completionRate = totalOrdered === 0 
    ? 0 
    : Math.round((totalReceived / totalOrdered) * 100);

  const formattedCompletedAt = order.completedAt
    ? new Date(order.completedAt).toLocaleString('vi-VN')
    : '—';

  const filteredItems = (order.items || []).filter(i => 
    !searchText || 
    i.itemName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center justify-between mr-8 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-800">
              Chi tiết phiếu nhập: {slipCode}
            </span>
            <StatusChip tone={
              displayStatusRaw === 'PENDING' || displayStatus.includes('Chờ') 
                ? 'warning' 
                : displayStatusRaw === 'CANCELLED' || displayStatus.includes('Hủy') 
                  ? 'danger' 
                  : 'success'
            }>
              {displayStatus}
            </StatusChip>
          </div>
          
          {/* Action buttons display only if handlers are provided and status is PENDING */}
          {canReceive && (onReceive || onCancel) && (
            <div className="flex gap-2">
              {onReceive && (
                <Button 
                  size="small" 
                  type="primary" 
                  className="!bg-[#006c49] hover:!bg-[#005237] border-none flex items-center gap-1.5 font-medium"
                  onClick={() => {
                    if (onReceive) {
                      const payload = Object.entries(receiveLines).map(([id, qty]) => ({
                        purchaseOrderItemId: Number(id),
                        quantity: qty,
                      })).filter(l => l.quantity > 0);
                      onReceive(order, payload);
                    }
                  }}
                >
                  <Check size={14} /> Nhận hàng
                </Button>
              )}
              {onCancel && (
                <Button 
                  size="small" 
                  danger 
                  className="flex items-center gap-1.5 font-medium"
                  onClick={() => onCancel(order)}
                >
                  <X size={14} /> Hủy phiếu
                </Button>
              )}
            </div>
          )}
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={1100}
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 pt-3">
        {/* Khu vực 2: Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          {/* Cột 1: Thông tin hành chính */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin chung</h4>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Kho nhận:</span> 
              <span className="font-semibold text-slate-800">{order.locationName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Thủ kho:</span> 
              <span className="text-slate-400">—</span>
            </div>
          </div>

          {/* Cột 2: Đối tác */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Đối tác & Đơn đặt</h4>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Nhà cung cấp:</span> 
              <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">{supplierName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Mã đơn PO:</span> 
              <span className="text-slate-400">—</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Số hóa đơn:</span> 
              <span className="text-slate-400">—</span>
            </div>
          </div>

          {/* Cột 3: Thời gian & Tiến độ */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Tiến độ & Thời gian</h4>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Ngày tạo:</span> 
              <span className="font-medium text-slate-800">{order.purchaseDate ? new Date(order.purchaseDate).toLocaleString('vi-VN') : displayCreatedDate}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Nhập kho lúc:</span> 
              <span className="font-medium text-slate-800">{formattedCompletedAt}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-slate-500 w-24">Tiến độ:</span> 
              <span className="font-semibold text-slate-800">{completionRate}% ({totalReceived}/{totalOrdered})</span>
            </div>
          </div>
        </div>

        {/* Thống kê nhanh phía trên bảng */}
        <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium">
          <div className="flex gap-4 flex-wrap">
            <div>Danh mục: <strong className="text-slate-800">{(order.items || []).length} mặt hàng</strong></div>
            <div>Tổng đặt: <strong className="text-slate-800">{totalOrdered.toLocaleString('vi-VN')} SP</strong></div>
            <div>Tổng nhận: <strong className="text-slate-800">{totalReceived.toLocaleString('vi-VN')} SP</strong></div>
            <div>Hiệu suất: <strong className="text-slate-800">{completionRate}% hoàn thành</strong></div>
          </div>
          <div>
            <Input 
              placeholder="Tìm kiếm sản phẩm..." 
              prefix={<Search size={14} className="text-slate-400" />} 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-56"
              size="small"
              allowClear
            />
          </div>
        </div>

        {/* Khu vực 3: Bảng chi tiết hàng hóa */}
        <div className="space-y-3">
          <Table
            dataSource={filteredItems}
            pagination={false}
            size="small"
            rowKey="id"
            scroll={{ x: 'max-content' }}
            columns={[
              { 
                title: 'STT', 
                width: 50, 
                render: (_, __, idx) => idx + 1 
              },
              { 
                title: 'Tên sản phẩm', 
                dataIndex: 'itemName',
                minWidth: 200,
              },
              { 
                title: 'ĐVT', 
                dataIndex: 'uomName', 
                width: 100,
                render: (v, record) => {
                  const ratio = Number(record.purchaseRatio) || 1;
                  const hasPurchaseUom = ratio > 1 && record.purchaseUomName && record.purchaseUomName !== record.uomName;
                  const preferPurchase = hasPurchaseUom && (Number(record.orderedQty) % ratio === 0);
                  
                  if (!hasPurchaseUom) {
                     return v || '—';
                  }
                  
                  return (
                    <div className="flex items-center gap-1.5">
                      <span>{preferPurchase ? record.purchaseUomName : v}</span>
                    </div>
                  );
                }
              },
              { 
                title: 'SL Đặt', 
                dataIndex: 'orderedQty', 
                width: 100,
                align: 'right',
                render: (v, record) => {
                  const ratio = Number(record.purchaseRatio) || 1;
                  const hasPurchaseUom = ratio > 1 && record.purchaseUomName && record.purchaseUomName !== record.uomName;
                  const preferPurchase = hasPurchaseUom && (Number(v) % ratio === 0);
                  const displayRatio = preferPurchase ? ratio : 1;
                  return Math.round(Number(v) / displayRatio).toLocaleString('vi-VN');
                }
              },
              { 
                title: 'Số lượng thực nhận', 
                dataIndex: 'receivedQty', 
                width: 160,
                align: 'right',
                render: (v, record) => {
                  const ratio = Number(record.purchaseRatio) || 1;
                  const hasPurchaseUom = ratio > 1 && record.purchaseUomName && record.purchaseUomName !== record.uomName;
                  const preferPurchase = hasPurchaseUom && (Number(record.orderedQty) % ratio === 0);
                  const displayRatio = preferPurchase ? ratio : 1;

                  if (canReceive && onReceive) {
                    const maxAllowed = Number(record.orderedQty) - Number(v);
                    const displayMax = Math.round(maxAllowed / displayRatio);
                    const displayCurrent = (receiveLines[record.id] || 0) / displayRatio;
                    return (
                      <div className="flex flex-col items-end gap-1">
                        <InputNumber
                          size="small"
                          min={0}
                          max={displayMax}
                          value={displayCurrent}
                          onChange={(val) => {
                            const newBaseVal = (Number(val) || 0) * displayRatio;
                            setReceiveLines(prev => ({ ...prev, [record.id]: newBaseVal }));
                          }}
                        />
                        {Number(v) > 0 && <span className="text-[10px] text-slate-400">Đã nhận: {Math.round(Number(v) / displayRatio).toLocaleString('vi-VN')}</span>}
                      </div>
                    );
                  }
                  return Math.round(Number(v) / displayRatio).toLocaleString('vi-VN');
                }
              },
              { 
                title: 'SL Thiếu', 
                width: 90,
                align: 'right',
                render: (_, record) => {
                  const ratio = Number(record.purchaseRatio) || 1;
                  const hasPurchaseUom = ratio > 1 && record.purchaseUomName && record.purchaseUomName !== record.uomName;
                  const preferPurchase = hasPurchaseUom && (Number(record.orderedQty) % ratio === 0);
                  const displayRatio = preferPurchase ? ratio : 1;

                  const missingBase = Math.max(0, Number(record.orderedQty) - Number(record.receivedQty));
                  if (missingBase === 0) return <span className="text-slate-400">—</span>;
                  return <span className="text-red-500 font-medium">{Math.round(missingBase / displayRatio).toLocaleString('vi-VN')}</span>;
                }
              },
              { 
                title: 'Đơn giá', 
                dataIndex: 'unitPrice', 
                width: 130,
                align: 'right',
                render: (v, record) => {
                  const basePrice = Number(v);
                  const ratio = Number(record.purchaseRatio) || 1;
                  const hasPurchaseUom = ratio > 1 && record.purchaseUomName && record.purchaseUomName !== record.uomName;
                  const preferPurchase = hasPurchaseUom && (Number(record.orderedQty) % ratio === 0);
                  
                  if (preferPurchase) {
                    return (
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{money(basePrice * ratio)}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">(Giá lẻ: {money(basePrice)}/{record.uomName})</span>
                      </div>
                    );
                  }
                  return money(basePrice);
                }
              },
              { 
                title: 'Tổng tiền đặt', 
                width: 130,
                align: 'right',
                render: (_, record) => money(Number(record.orderedQty || 0) * Number(record.unitPrice || 0)) 
              },
              { 
                title: 'Tiền thực trả', 
                width: 130,
                align: 'right',
                render: (_, record) => money(Number(record.receivedQty || 0) * Number(record.unitPrice || 0)) 
              },
              { 
                title: 'Tiền thiếu', 
                width: 130,
                align: 'right',
                render: (_, record) => {
                  const missingBase = Math.max(0, Number(record.orderedQty) - Number(record.receivedQty));
                  if (missingBase === 0) return <span className="text-slate-400">—</span>;
                  return <span className="text-red-500 font-medium">{money(missingBase * Number(record.unitPrice || 0))}</span>;
                }
              },
            ]}
            summary={() => {
              return (
                <Table.Summary fixed="bottom">
                  <Table.Summary.Row className="bg-slate-50 font-bold">
                    <Table.Summary.Cell index={0} colSpan={3}>Tổng cộng</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} className="text-right">
                      {totalOrdered.toLocaleString('vi-VN')}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} className="text-right">
                      {totalReceived.toLocaleString('vi-VN')}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} className="text-right text-red-500">
                      {totalMissing > 0 ? totalMissing.toLocaleString('vi-VN') : '—'}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                    <Table.Summary.Cell index={5} className="text-right">
                      {money(totalAmountOrdered)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} className="text-right text-emerald-600">
                      {money(totalAmountActual)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} className="text-right text-red-500">
                      {totalAmountMissing > 0 ? money(totalAmountMissing) : '—'}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
