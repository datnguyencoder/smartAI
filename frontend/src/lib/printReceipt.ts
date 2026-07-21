import type { fetchOrderPrint } from '@/services/wmsApi';
import { PAYMENT_LABEL } from '@/lib/constants/paymentLabels';

function stripAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function buildPrintHtml(data: Awaited<ReturnType<typeof fetchOrderPrint>>) {
  const escapeHtml = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const clean = (value: unknown) => {
    return escapeHtml(stripAccents(String(value ?? '')));
  };

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString('vi-VN') + 'd';

  const date = new Date(data.orderDate).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paperWidth = data.paperWidth || '80mm';
  const storeName = data.storeName || 'SMARTMART AI';
  const storeAddress = data.storeAddress || '';
  const storePhone = data.storePhone || '';
  const receiptFooter = data.receiptFooter || 'Cam on quy khach va hen gap lai';

  const paymentLines = (data.payments && data.payments.length > 0)
    ? data.payments
    : [{ paymentMethod: data.paymentMethod, amount: data.totalAmount }];

  const paymentSection = paymentLines
    .map((p) => {
      const label = PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod;
      return `<div class="summary-row payment-line"><span>${clean(label)}</span><span>${fmt(p.amount)}</span></div>`;
    })
    .join('');

  const subtotal = data.subtotalAmount ?? data.items.reduce((s, i) => s + i.lineTotal, 0);
  const discount = data.discountAmount ?? 0;
  const vat = data.vatAmount ?? 0;
  const itemCount = data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  // Giảm giá per-line (BOGO/qua tang) da hien rieng o tung dong ben duoi, nen phan
  // "Giam gia" tong o cuoi hoa don CHI con lai phan ma KM + diem doi (tranh tinh 2 lan).
  const productDiscountTotal = data.items.reduce((s, i) => s + Number(i.discountAmount ?? 0), 0);
  const otherDiscount = Math.max(0, discount - productDiscountTotal);

  const rows = data.items
    .map((it) => {
      const lineDiscount = Number(it.discountAmount ?? 0);
      const netAmount = it.netAmount ?? it.lineTotal - lineDiscount;
      const giftTag = lineDiscount > 0
        ? `<div class="item-gift-tag">${clean(it.discountReason || 'Khuyen mai')}${netAmount <= 0 ? ' - MIEN PHI' : ''}</div>`
        : '';
      const amountCell = lineDiscount > 0
        ? `<span class="item-amount-cell"><span class="item-strike">${fmt(it.lineTotal)}</span><strong>${fmt(netAmount)}</strong></span>`
        : `<strong>${fmt(it.lineTotal)}</strong>`;
      return `
      <div class="item">
        <div class="item-name">${clean(it.itemName)}</div>
        <div class="item-meta">
          <span>${clean(it.itemCode)} | ${it.quantity} x ${fmt(it.unitPrice)}</span>
          ${amountCell}
        </div>
        ${giftTag}
      </div>`;
    })
    .join('');

  const loyaltySection =
    (data.loyaltyPointsRedeemed ?? 0) > 0
      ? `<div class="summary-row"><span>Diem da doi</span><span>-${data.loyaltyPointsRedeemed} diem</span></div>`
      : '';

  const productDiscountSection = productDiscountTotal > 0
    ? `<div class="summary-row"><span>Giam gia SP (BOGO/qua tang)</span><span>-${fmt(productDiscountTotal)}</span></div>`
    : '';

  const promotionSection = data.promotionCode
    ? `<div class="summary-row"><span>Giam gia (${clean(data.promotionCode)})</span><span>-${fmt(otherDiscount)}</span></div>`
    : otherDiscount > 0
    ? `<div class="summary-row"><span>Giam gia</span><span>-${fmt(otherDiscount)}</span></div>`
    : '';
  const vatSection = vat > 0 ? `<div class="summary-row"><span>VAT</span><span>${fmt(vat)}</span></div>` : '';
  const shiftSection = data.shiftId
    ? `<div class="row"><span>Ca</span><span>#${data.shiftId}</span></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hoa don ${clean(data.orderCode)}</title>
  <style>
    @page { size: ${paperWidth} auto; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #f3f4f6; color: #111; }
    body {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt {
      width: ${paperWidth};
      min-height: 100vh;
      margin: 0 auto;
      padding: 5mm 4mm 7mm;
      background: #fff;
    }
    .center { text-align: center; }
    .store-name { font-size: 20px; font-weight: 800; letter-spacing: .5px; line-height: 1.1; }
    .store-meta { margin-top: 3px; font-size: 11px; }
    .title { margin-top: 10px; font-size: 15px; font-weight: 800; }
    .line { border-top: 1px dashed #111; margin: 8px 0; }
    .row, .summary-row, .item-meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .row span:first-child, .summary-row span:first-child { white-space: nowrap; }
    .row span:last-child, .summary-row span:last-child {
      text-align: right;
      overflow-wrap: anywhere;
    }
    .section-label {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .item { padding: 5px 0; border-bottom: 1px dotted #999; }
    .item-name { font-weight: 700; overflow-wrap: anywhere; }
    .item-meta { margin-top: 2px; font-size: 11px; }
    .item-meta strong { font-size: 12px; white-space: nowrap; }
    .item-amount-cell { white-space: nowrap; }
    .item-meta .item-strike { font-size: 11px; color: #888; text-decoration: line-through; margin-right: 4px; }
    .item-gift-tag { margin-top: 2px; font-size: 10.5px; font-weight: 700; color: #b45309; }
    .summary-row { margin: 3px 0; }
    .total {
      align-items: baseline;
      margin-top: 7px;
      padding-top: 7px;
      border-top: 1px dashed #111;
      font-size: 15px;
      font-weight: 800;
    }
    .payment {
      margin-top: 8px;
      padding: 6px 0;
      border-top: 1px dashed #111;
      border-bottom: 1px dashed #111;
      font-weight: 700;
    }
    .payment-line { font-weight: 600; }
    .footer { margin-top: 10px; text-align: center; font-size: 11px; }
    .barcode {
      margin: 10px auto 2px;
      width: 58mm;
      height: 28px;
      background: repeating-linear-gradient(90deg, #111 0 1px, #fff 1px 3px, #111 3px 5px, #fff 5px 7px);
    }
    @media print {
      html, body { width: ${paperWidth}; background: #fff; margin: 0; padding: 0; }
      .receipt { width: ${paperWidth}; min-height: 0; margin: 0; padding: 4mm; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="store-name">${clean(storeName)}</div>
      ${storeAddress ? `<div class="store-meta">${clean(storeAddress)}</div>` : ''}
      ${storePhone ? `<div class="store-meta">Hotline: ${clean(storePhone)}</div>` : ''}
      <div class="title">HOA DON BAN HANG</div>
    </div>
    <div class="line"></div>
    <div class="row"><span>So HD</span><span>${clean(data.orderCode)}</span></div>
    <div class="row"><span>Ngay</span><span>${clean(date)}</span></div>
    <div class="row"><span>Thu ngan</span><span>${clean(data.staffName || '-')}</span></div>
    ${shiftSection}
    <div class="row"><span>Khach hang</span><span>${clean(data.customerName || 'Khach le')}</span></div>
    ${data.customerPhone ? `<div class="row"><span>Dien thoai</span><span>${clean(data.customerPhone)}</span></div>` : ''}
    <div class="line"></div>
    <div class="section-label"><span>SAN PHAM</span><span>THANH TIEN</span></div>
    ${rows}
    <div class="line"></div>
    <div class="summary">
      <div class="summary-row"><span>So luong</span><span>${itemCount}</span></div>
      <div class="summary-row"><span>Tam tinh</span><span>${fmt(subtotal)}</span></div>
      ${productDiscountSection}
      ${promotionSection}
      ${loyaltySection}
      ${vatSection}
      <div class="summary-row total"><span>TONG CONG</span><span>${fmt(data.totalAmount)}</span></div>
    </div>
    <div class="payment">
      <div class="summary-row"><span>Thanh toan</span><span></span></div>
      ${paymentSection}
    </div>
    <div class="footer">
      ${clean(receiptFooter).replace(/\n/g, '<br />')}<br />
      Vui long kiem tra hang truoc khi roi quay
      <div class="barcode"></div>
      ${clean(data.orderCode)}
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      const receipt = document.querySelector('.receipt');
      if (receipt) {
        const height = receipt.offsetHeight;
        const style = document.createElement('style');
        style.innerHTML = '@page { size: ${paperWidth} ' + height + 'px; margin: 0; }';
        document.head.appendChild(style);
      }
      setTimeout(() => {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
}
