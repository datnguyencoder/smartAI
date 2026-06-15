import React, { useState } from 'react';
import { Drawer, Button, message as antdMessage, Modal, InputNumber, Input, Checkbox, Space } from 'antd';
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
  amount: number;
  cashier: string;
  status: string;
  time: string;
  subtotal?: number;
  discount?: number;
  vat?: number;
  items?: Array<{ name: string; qty: number; price: number; itemId?: number; lotId?: number }>;
};

type Props = {
  invoice: InvoiceView | null;
  authUser: UserDto;
  onClose: () => void;
  onCancelled?: () => void;
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
      const lines = data.items.map((it) =>
        `<tr><td>${it.itemName}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${money(it.unitPrice)}</td><td style="text-align:right">${money(it.lineTotal)}</td></tr>`
      ).join('');
      const html = `<html><head><title>${data.orderCode}</title></head><body style="font-family:monospace;padding:16px">
        <h2>SMARTMART AI</h2><p>Mã HĐ: ${data.orderCode}</p><p>KH: ${data.customerName}</p><p>NV: ${data.staffName}</p>
        <table width="100%" border="1" cellpadding="4"><tr><th>SP</th><th>SL</th><th>ĐG</th><th>TT</th></tr>${lines}</table>
        <p><strong>Tổng: ${money(data.totalAmount)}</strong></p></body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
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
        quantity: returnLines[idx]?.qty || it.qty,
      }))
      .filter((l) => l.itemId > 0 && l.quantity > 0);

    if (items.length === 0) {
      antdMessage.warning('Chọn ít nhất 1 sản phẩm để trả');
      return;
    }
    try {
      await createReturnOrder({
        originalOrderId: invoice.orderId,
        reason: returnReason,
        items,
      });
      antdMessage.success('Tạo phiếu trả hàng thành công');
      setReturnOpen(false);
      onCancelled?.();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Trả hàng thất bại');
    }
  };

  return (
    <>
      <Drawer open={Boolean(invoice)} onClose={onClose} title="Chi tiết hóa đơn bán hàng" width={450}>
        {invoice ? (
          <div ref={bodyRef} className="space-y-5">
            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-4">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <strong className="text-slate-800 text-lg">{invoice.key}</strong>
                <StatusChip tone={invoice.status.includes('toán') ? 'success' : 'warning'}>{invoice.status}</StatusChip>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600">
                <span>Khách hàng:</span><span className="font-bold text-slate-800 text-right">{invoice.customer}</span>
                <span>Thời gian:</span><span className="text-slate-800 text-right">{invoice.time}</span>
                <span>Thu ngân:</span><span className="text-slate-800 text-right">{invoice.cashier}</span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-700 uppercase">Chi tiết sản phẩm</h4>
              {invoice.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm border border-slate-100">
                  <div><strong>{it.name}</strong><br /><span className="text-xs text-slate-400">{it.qty} x {money(it.price)}</span></div>
                  <strong>{money(it.qty * it.price)}</strong>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-base font-extrabold border-t pt-3">
              <span>Tổng:</span><span className="text-primary">{money(invoice.amount)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePrint}>In hóa đơn</Button>
              {canReturn && invoice.status !== 'Đã hủy' && (
                <Button onClick={() => setReturnOpen(true)}>Trả hàng</Button>
              )}
              {canCancel && invoice.status !== 'Đã hủy' && (
                <Button danger onClick={handleCancel}>Hủy hóa đơn</Button>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>
      <Modal title="Trả hàng (partial return)" open={returnOpen} onCancel={() => setReturnOpen(false)} onOk={handleReturn} width={520}>
        <Input.TextArea placeholder="Lý do trả hàng" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="mb-4" />
        {invoice?.items?.map((it, idx) => (
          <div key={idx} className="flex items-center gap-3 mb-2">
            <Checkbox checked={returnLines[idx]?.checked}
              onChange={(e) => setReturnLines({ ...returnLines, [idx]: { ...returnLines[idx], checked: e.target.checked, qty: returnLines[idx]?.qty || it.qty } })} />
            <span className="flex-1 text-sm">{it.name}</span>
            <InputNumber min={1} max={it.qty} value={returnLines[idx]?.qty}
              onChange={(v) => setReturnLines({ ...returnLines, [idx]: { checked: returnLines[idx]?.checked ?? false, qty: Number(v) || 1 } })} />
          </div>
        ))}
      </Modal>
    </>
  );
}
