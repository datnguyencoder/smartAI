import React, { useState } from 'react';
import { Drawer, Button, message as antdMessage, Modal, InputNumber, Input, Checkbox, Tag, Divider } from 'antd';
import {
  PrinterOutlined,
  RollbackOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  GiftOutlined,
  StarOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { animateDrawer } from '@/lib/gsapAnimations';
import { formatMoney as money } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import { buildPrintHtml } from '@/lib/printReceipt';
import { cancelOrder, createReturnOrder, fetchOrderPrint } from '@/services/wmsApi';
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
  items?: Array<{ name: string; qty: number; price: number; itemId?: number; lotId?: number }>;
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

  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (invoice) animateDrawer(bodyRef.current, true);
  }, [invoice]);

  React.useEffect(() => {
    if (invoice?.items) {
      const init: Record<number, { checked: boolean; qty: number }> = {};
      invoice.items.forEach((it, idx) => {
        init[idx] = { checked: false, qty: it.qty };
      });
      setReturnLines(init);
    }
  }, [invoice]);

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
    if (!invoice?.orderId || !invoice.items) return;
    const items = invoice.items
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

  return (
    <>
      <Drawer
        open={Boolean(invoice)}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-800">Chi tiết hóa đơn</span>
            {invoice && (
              <StatusChip tone={isCancelled ? 'danger' : 'success'}>{invoice.status}</StatusChip>
            )}
          </div>
        }
        width={480}
        bodyStyle={{ padding: 0 }}
      >
        {invoice ? (
          <div ref={bodyRef} className="flex h-full flex-col">
            {/* Receipt-style header */}
            <div className="border-b border-slate-100 bg-gradient-to-b from-emerald-50 to-white px-6 py-5">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-lg font-extrabold tracking-wide text-emerald-700">
                  {invoice.key}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CalendarOutlined /> {invoice.time}
                </span>
                <span className="flex items-center justify-end gap-1.5 text-slate-500">
                  <TeamOutlined /> {invoice.cashier}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <UserOutlined /> <strong>{invoice.customer}</strong>
                </span>
                {invoice.customerPhone && (
                  <span className="flex items-center justify-end gap-1.5 text-slate-500">
                    <PhoneOutlined /> {invoice.customerPhone}
                  </span>
                )}
              </div>
              {(invoice.paymentMethod || invoice.promotionCode) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {invoice.paymentMethod && (
                    <Tag color="blue">
                      {PAYMENT_ICON[invoice.paymentMethod] ?? <CreditCardOutlined />}{' '}
                      {invoice.paymentMethod}
                    </Tag>
                  )}
                  {invoice.promotionCode && (
                    <Tag color="green" icon={<GiftOutlined />}>
                      {invoice.promotionCode}
                    </Tag>
                  )}
                  {(invoice.loyaltyPointsRedeemed ?? 0) > 0 && (
                    <Tag color="purple" icon={<StarOutlined />}>
                      -{invoice.loyaltyPointsRedeemed} điểm
                    </Tag>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Chi tiết sản phẩm ({invoice.items?.length ?? 0} dòng)
              </p>
              <div className="space-y-2">
                {invoice.items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{it.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {it.qty} × {money(it.price)}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 font-bold text-slate-700">
                      {money(it.qty * it.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-5 space-y-1.5 rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tạm tính</span>
                  <span>{money(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Giảm giá{invoice.promotionCode ? ` (${invoice.promotionCode})` : ''}</span>
                    <span>-{money(discount)}</span>
                  </div>
                )}
                {(invoice.loyaltyPointsRedeemed ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Điểm tích lũy dùng</span>
                    <span>-{invoice.loyaltyPointsRedeemed} điểm</span>
                  </div>
                )}
                <Divider className="!my-2" />
                <div className="flex justify-between text-base font-extrabold text-slate-800">
                  <span>Tổng thanh toán</span>
                  <span className="text-emerald-700">{money(invoice.amount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 bg-white px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                  In hóa đơn
                </Button>
                {canReturn && !isCancelled && (
                  <Button icon={<RollbackOutlined />} onClick={() => setReturnOpen(true)}>
                    Trả hàng
                  </Button>
                )}
                {canCancel && !isCancelled && (
                  <Button danger icon={<CloseCircleOutlined />} onClick={handleCancel}>
                    Hủy hóa đơn
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

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
          {invoice?.items?.map((it, idx) => (
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
