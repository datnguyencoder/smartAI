import React, { useState } from 'react';
import { Modal, Button, message as antdMessage, InputNumber, Input, Checkbox, Tag, Divider, Table } from 'antd';
import {
  PrinterOutlined,
  RollbackOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  GiftOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { formatMoney as money } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import { buildPrintHtml } from '@/lib/printReceipt';
import { cancelOrder, createReturnOrder, fetchOrderById, fetchOrderPrint } from '@/services/wmsApi';
import { StatusChip } from '@/components/ui';
import type { UserDto } from '@/types/api';

export type InvoiceView = {
  key: string;
  orderId: number;
  customer: string;
  customerPhone?: string;
  amount: number;
  cashier: string;
  status: string;
  rawStatus: string;
  time: string;
  subtotal?: number;
  discount?: number;
  paymentMethod?: string;
  promotionCode?: string;
  loyaltyPointsRedeemed?: number;
  loyaltyPointsEarned?: number;
  items?: Array<{ name: string; qty: number; price: number; itemId?: number; lotId?: number; lotNumber?: string }>;
};

type Props = {
  invoice: InvoiceView | null;
  authUser: UserDto;
  onClose: () => void;
  onCancelled?: () => void;
};

const PAYMENT_ICON: Record<string, React.ReactNode> = {
  'Tiền mặt': '💵',
  'Thẻ ngân hàng': '💳',
  'Chuyển khoản': '🏦',
  MoMo: '📱',
  VNPay: '📱',
  'Kết hợp': '🔀',
};

export function InvoiceDrawer({ invoice, authUser, onClose, onCancelled }: Props) {
  const role = normalizeRole(authUser.role);
  const canCancel = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  const canReturn = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER' || role === 'ROLE_STAFF';
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnLines, setReturnLines] = useState<Record<number, { checked: boolean; qty: number }>>({});
  const [detailItems, setDetailItems] = useState<InvoiceView['items']>([]);

  React.useEffect(() => {
    if (!invoice?.orderId) {
      setDetailItems([]);
      return;
    }
    setDetailItems(invoice.items ?? []);
    fetchOrderById(invoice.orderId)
      .then((order) => {
        setDetailItems(
          (order.items ?? []).map((i) => ({
            name: i.itemName,
            qty: Number(i.quantity),
            price: Number(i.unitPrice),
            itemId: i.itemId,
            lotId: i.lotId,
            lotNumber: i.lotNumber,
          }))
        );
      })
      .catch(() => {
        // keep list view items if detail fetch fails
      });
  }, [invoice?.orderId]);

  const lineItems = (detailItems?.length ?? 0) > 0 ? detailItems : invoice?.items;

  React.useEffect(() => {
    if (!lineItems?.length) return;
    const init: Record<number, { checked: boolean; qty: number }> = {};
    lineItems.forEach((it, idx) => {
      init[idx] = { checked: false, qty: it.qty };
    });
    setReturnLines(init);
  }, [invoice?.orderId, detailItems]);

  const handlePrint = async () => {
    if (!invoice?.orderId) {
      antdMessage.warning('Không có mã đơn để in');
      return;
    }
    try {
      const data = await fetchOrderPrint(invoice.orderId);
      const html = buildPrintHtml(data);
      const w = window.open('', '_blank', 'width=460,height=700');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'In hóa đơn thất bại');
    }
  };

  const handleCancel = async () => {
    if (!invoice?.orderId) return;
    try {
      await cancelOrder(invoice.orderId);
      antdMessage.success('Đã hủy hóa đơn');
      onCancelled?.();
      onClose();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Hủy thất bại');
    }
  };

  const handleReturn = async () => {
    if (!invoice?.orderId || !lineItems) return;
    const items = lineItems
      .map((it, idx) => ({ it, idx }))
      .filter(({ idx }) => returnLines[idx]?.checked)
      .map(({ it, idx }) => ({
        itemId: it.itemId ?? 0,
        lotId: it.lotId,
        quantity: returnLines[idx]?.qty || it.qty,
      }))
      .filter((l) => l.itemId > 0 && l.quantity > 0);

    if (items.length === 0) {
      antdMessage.warning('Chọn ít nhất 1 sản phẩm để trả');
      return;
    }
    try {
      await createReturnOrder({ originalOrderId: invoice.orderId, reason: returnReason, items });
      antdMessage.success('Tạo phiếu trả hàng thành công');
      setReturnOpen(false);
      onCancelled?.();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Trả hàng thất bại');
    }
  };

  const isCancelled = invoice?.rawStatus === 'CANCELLED';
  const subtotal = invoice?.subtotal ?? invoice?.amount ?? 0;
  const discount = invoice?.discount ?? 0;

  if (!invoice) return null;

  return (
    <>
      <Modal
        open={Boolean(invoice)}
        onCancel={onClose}
        title={
          <div className="flex items-center justify-between mr-8 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-slate-800">
                Chi tiết đơn hàng: {invoice.key}
              </span>
              <StatusChip tone={isCancelled ? 'danger' : 'success'}>
                {invoice.status}
              </StatusChip>
            </div>
            
            <div className="flex gap-2">
              <Button size="small" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                In hóa đơn
              </Button>
              {canReturn && !isCancelled && (
                <Button size="small" icon={<RollbackOutlined />} onClick={() => setReturnOpen(true)}>
                  Trả hàng
                </Button>
              )}
              {canCancel && !isCancelled && (
                <Button size="small" danger icon={<CloseCircleOutlined />} onClick={handleCancel}>
                  Hủy hóa đơn
                </Button>
              )}
            </div>
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
                <span className="text-slate-500 w-24">Thu ngân:</span> 
                <span className="font-semibold text-slate-800">{invoice.cashier}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 w-24">Thanh toán:</span> 
                <span>
                  {invoice.paymentMethod ? (
                    <Tag color="blue" className="!mr-0">
                      {PAYMENT_ICON[invoice.paymentMethod] ?? <CreditCardOutlined />}{' '}
                      {invoice.paymentMethod}
                    </Tag>
                  ) : '—'}
                </span>
              </div>
            </div>

            {/* Cột 2: Đối tác */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Khách hàng & Ưu đãi</h4>
              <div className="flex gap-2">
                <span className="text-slate-500 w-24">Khách hàng:</span> 
                <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">{invoice.customer}</span>
              </div>
              {invoice.customerPhone && (
                <div className="flex gap-2">
                  <span className="text-slate-500 w-24">Điện thoại:</span> 
                  <span className="font-medium text-slate-700">{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.promotionCode && (
                <div className="flex gap-2 items-center">
                  <span className="text-slate-500 w-24">Mã giảm giá:</span> 
                  <Tag color="green" icon={<GiftOutlined />} className="!mr-0">{invoice.promotionCode}</Tag>
                </div>
              )}
              {(invoice.loyaltyPointsRedeemed ?? 0) > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-slate-500 w-24">Điểm đổi:</span> 
                  <Tag color="purple" icon={<StarOutlined />} className="!mr-0">-{invoice.loyaltyPointsRedeemed} điểm</Tag>
                </div>
              )}
            </div>

            {/* Cột 3: Thời gian & Tiến độ */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian & Trạng thái</h4>
              <div className="flex gap-2">
                <span className="text-slate-500 w-24">Thời gian tạo:</span> 
                <span className="font-medium text-slate-800">{invoice.time}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-24">Trạng thái:</span> 
                <span className={`font-medium ${isCancelled ? 'text-red-500' : 'text-emerald-600'}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Thống kê nhanh phía trên bảng */}
          <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium">
            <div>Danh mục: <strong className="text-slate-800">{lineItems?.length ?? 0} mặt hàng</strong></div>
            <div>Tạm tính: <strong className="text-slate-800">{money(subtotal)}</strong></div>
            <div>Giảm giá: <strong className="text-emerald-600">{discount > 0 ? `-${money(discount)}` : '0đ'}</strong></div>
            <div className="text-sm">Tổng thanh toán: <strong className="text-emerald-700 text-base">{money(invoice.amount)}</strong></div>
          </div>

          {/* Khu vực 3: Bảng chi tiết hàng hóa */}
          <div className="space-y-3">
            <Table
              dataSource={lineItems || []}
              pagination={false}
              size="small"
              rowKey={(r, idx) => `item_${idx}`}
              scroll={{ x: 'max-content' }}
              columns={[
                { 
                  title: 'STT', 
                  width: 50, 
                  render: (_, __, idx) => idx + 1 
                },
                { 
                  title: 'Tên sản phẩm', 
                  dataIndex: 'name',
                  minWidth: 200,
                  render: (v, r) => (
                    <div>
                      <div className="font-medium">{v}</div>
                      {r.lotNumber && <div className="text-[10px] text-slate-400">Lô: {r.lotNumber}</div>}
                    </div>
                  )
                },
                { 
                  title: 'Đơn giá', 
                  dataIndex: 'price', 
                  width: 120,
                  align: 'right',
                  render: (v) => money(v)
                },
                { 
                  title: 'Số lượng', 
                  dataIndex: 'qty', 
                  width: 100,
                  align: 'right',
                  render: (v) => <span className="font-semibold text-slate-700">{v}</span>
                },
                { 
                  title: 'Thành tiền', 
                  width: 130,
                  align: 'right',
                  render: (_, record) => (
                    <span className="font-bold text-slate-800">
                      {money((record.qty || 0) * (record.price || 0))}
                    </span>
                  )
                }
              ]}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Trả hàng — Chọn sản phẩm"
        open={returnOpen}
        onCancel={() => setReturnOpen(false)}
        onOk={handleReturn}
        okText="Xác nhận trả"
        width={520}
      >
        <Input.TextArea
          placeholder="Lý do trả hàng (bắt buộc nếu trả một phần)"
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          rows={2}
          className="mb-4"
        />
        <div className="space-y-2">
          {lineItems?.map((it, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <Checkbox
                checked={returnLines[idx]?.checked}
                onChange={(e) =>
                  setReturnLines({
                    ...returnLines,
                    [idx]: { checked: e.target.checked, qty: returnLines[idx]?.qty || it.qty },
                  })
                }
              />
              <span className="flex-1 text-sm font-medium">{it.name}</span>
              <span className="text-xs text-slate-400">tối đa {it.qty}</span>
              <InputNumber
                min={1}
                max={it.qty}
                value={returnLines[idx]?.qty}
                size="small"
                disabled={!returnLines[idx]?.checked}
                onChange={(v) =>
                  setReturnLines({
                    ...returnLines,
                    [idx]: { checked: returnLines[idx]?.checked ?? false, qty: Number(v) || 1 },
                  })
                }
                style={{ width: 70 }}
              />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
