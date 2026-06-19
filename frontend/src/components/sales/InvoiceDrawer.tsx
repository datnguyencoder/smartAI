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

function buildPrintHtml(data: Awaited<ReturnType<typeof import('@/services/wmsApi').fetchOrderPrint>>) {
  const fmt = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  const date = new Date(data.orderDate).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const PAYMENT_LABEL: Record<string, string> = {
    CASH: 'Tiền mặt',
    CARD: 'Thẻ ngân hàng',
    TRANSFER: 'Chuyển khoản',
    MOMO: 'MoMo',
    VNPAY: 'VNPay',
    MIXED: 'Kết hợp',
  };

  const payLabel = PAYMENT_LABEL[data.paymentMethod] ?? data.paymentMethod;
  const subtotal = data.subtotalAmount ?? data.items.reduce((s, i) => s + i.lineTotal, 0);
  const discount = data.discountAmount ?? 0;

  const rows = data.items
    .map(
      (it) => `
      <tr>
        <td style="padding:5px 4px;border-bottom:1px dashed #e2e8f0">
          <div style="font-weight:600;color:#1e293b">${it.itemName}</div>
          <div style="font-size:11px;color:#64748b">${it.itemCode}</div>
        </td>
        <td style="padding:5px 4px;border-bottom:1px dashed #e2e8f0;text-align:center;color:#475569">${it.quantity}</td>
        <td style="padding:5px 4px;border-bottom:1px dashed #e2e8f0;text-align:right;color:#475569">${fmt(it.unitPrice)}</td>
        <td style="padding:5px 4px;border-bottom:1px dashed #e2e8f0;text-align:right;font-weight:600;color:#1e293b">${fmt(it.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  const loyaltySection =
    (data.loyaltyPointsRedeemed ?? 0) > 0
      ? `<div style="display:flex;justify-content:space-between;margin:4px 0;font-size:13px;color:#7c3aed">
           <span>⭐ Điểm tích lũy dùng</span><span>-${data.loyaltyPointsRedeemed} điểm</span>
         </div>`
      : '';

  const promotionSection = data.promotionCode
    ? `<div style="display:flex;justify-content:space-between;margin:4px 0;font-size:13px;color:#059669">
         <span>🎁 Mã KM: ${data.promotionCode}</span><span>-${fmt(discount)}</span>
       </div>`
    : discount > 0
    ? `<div style="display:flex;justify-content:space-between;margin:4px 0;font-size:13px;color:#059669">
         <span>Giảm giá</span><span>-${fmt(discount)}</span>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hóa đơn ${data.orderCode}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; display: flex; justify-content: center; padding: 24px; }
    .receipt { background: #fff; width: 380px; padding: 24px 20px 32px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 16px; }
    .logo h1 { font-size: 22px; font-weight: 800; color: #006c49; letter-spacing: 1px; }
    .logo p { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .divider { border: none; border-top: 1px dashed #cbd5e1; margin: 12px 0; }
    .divider-solid { border: none; border-top: 2px solid #e2e8f0; margin: 12px 0; }
    .info-row { display: flex; justify-content: space-between; font-size: 12.5px; margin: 5px 0; }
    .info-label { color: #64748b; }
    .info-val { font-weight: 600; color: #1e293b; text-align: right; max-width: 200px; }
    .badge { display: inline-block; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 4px; padding: 1px 7px; font-size: 11px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 6px 4px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; border-bottom: 2px solid #e2e8f0; }
    th:last-child, th:nth-child(3) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .summary { margin-top: 12px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; color: #475569; }
    .summary-row.total { font-size: 17px; font-weight: 800; color: #1e293b; margin-top: 10px; }
    .summary-row.total span:last-child { color: #006c49; }
    .payment-box { margin-top: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 13px; display: flex; align-items: center; gap: 8px; color: #334155; }
    .footer { text-align: center; margin-top: 20px; font-size: 11.5px; color: #94a3b8; line-height: 1.6; }
    .footer strong { color: #475569; }
    @media print {
      body { background: none; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; width: 100%; max-width: 380px; margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      <h1>🛒 SMARTMART AI</h1>
      <p>Hệ thống quản lý bán lẻ thông minh</p>
      <p>📍 TP. Hồ Chí Minh &nbsp;|&nbsp; 📞 1900 xxxx</p>
    </div>
    <hr class="divider" />
    <div class="info-row"><span class="info-label">Mã hóa đơn</span><span class="info-val"><span class="badge">${data.orderCode}</span></span></div>
    <div class="info-row"><span class="info-label">📅 Thời gian</span><span class="info-val">${date}</span></div>
    <div class="info-row"><span class="info-label">👤 Khách hàng</span><span class="info-val">${data.customerName || 'Khách lẻ'}</span></div>
    ${data.customerPhone ? `<div class="info-row"><span class="info-label">📞 Điện thoại</span><span class="info-val">${data.customerPhone}</span></div>` : ''}
    <div class="info-row"><span class="info-label">🧾 Thu ngân</span><span class="info-val">${data.staffName}</span></div>
    <hr class="divider" />
    <table>
      <thead>
        <tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <hr class="divider-solid" />
    <div class="summary">
      <div class="summary-row"><span>Tạm tính</span><span>${fmt(subtotal)}</span></div>
      ${promotionSection}
      ${loyaltySection}
      <div class="summary-row total"><span>TỔNG CỘNG</span><span>${fmt(data.totalAmount)}</span></div>
    </div>
    <div class="payment-box">
      💳 <span>Thanh toán: <strong>${payLabel}</strong></span>
    </div>
    <hr class="divider" />
    <div class="footer">
      <strong>Cảm ơn quý khách đã mua hàng!</strong><br />
      Hàng mua vui lòng kiểm tra trước khi rời quầy.<br />
      Đổi trả trong vòng <strong>7 ngày</strong> kể từ ngày mua (còn tem nhãn).<br /><br />
      <em>Hotline: 1900 xxxx &nbsp;|&nbsp; smartmart.ai</em>
    </div>
  </div>
</body>
</html>`;
}

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
        setTimeout(() => w.print(), 400);
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
