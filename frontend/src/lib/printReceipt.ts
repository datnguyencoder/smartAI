import type { fetchOrderPrint } from '@/services/wmsApi';
import { PAYMENT_LABEL } from '@/lib/constants/paymentLabels';

export function buildPrintHtml(data: Awaited<ReturnType<typeof fetchOrderPrint>>) {
  const escapeHtml = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const fmt = (n: number) =>
    Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const date = new Date(data.orderDate).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const payLabel = PAYMENT_LABEL[data.paymentMethod] ?? data.paymentMethod;
  const subtotal = data.subtotalAmount ?? data.items.reduce((s, i) => s + i.lineTotal, 0);
  const discount = data.discountAmount ?? 0;
  const vat = data.vatAmount ?? 0;
  const itemCount = data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const rows = data.items
    .map(
      (it) => `
      <div class="item">
        <div class="item-name">${escapeHtml(it.itemName)}</div>
        <div class="item-meta">
          <span>${escapeHtml(it.itemCode)} | ${it.quantity} x ${fmt(it.unitPrice)}</span>
          <strong>${fmt(it.lineTotal)}</strong>
        </div>
      </div>`,
    )
    .join('');

  const loyaltySection =
    (data.loyaltyPointsRedeemed ?? 0) > 0
      ? `<div class="summary-row"><span>Điểm đã đổi</span><span>-${data.loyaltyPointsRedeemed} điểm</span></div>`
      : '';

  const promotionSection = data.promotionCode
    ? `<div class="summary-row"><span>Giảm giá (${escapeHtml(data.promotionCode)})</span><span>-${fmt(discount)}</span></div>`
    : discount > 0
    ? `<div class="summary-row"><span>Giảm giá</span><span>-${fmt(discount)}</span></div>`
    : '';
  const vatSection = vat > 0 ? `<div class="summary-row"><span>VAT</span><span>${fmt(vat)}</span></div>` : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hoa don ${escapeHtml(data.orderCode)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
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
      width: 80mm;
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
    .footer { margin-top: 10px; text-align: center; font-size: 11px; }
    .barcode {
      margin: 10px auto 2px;
      width: 58mm;
      height: 28px;
      background: repeating-linear-gradient(90deg, #111 0 1px, #fff 1px 3px, #111 3px 5px, #fff 5px 7px);
    }
    @media print {
      html, body { width: 80mm; background: #fff; }
      .receipt { width: 80mm; min-height: 0; margin: 0; padding: 4mm 3mm 6mm; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="store-name">SMARTMART AI</div>
      <div class="store-meta">Sieu thi mini van hanh thong minh</div>
      <div class="store-meta">TP. Ho Chi Minh - Hotline: 1900 xxxx</div>
      <div class="title">HOA DON BAN HANG</div>
    </div>
    <div class="line"></div>
    <div class="row"><span>So HD</span><span>${escapeHtml(data.orderCode)}</span></div>
    <div class="row"><span>Ngay</span><span>${escapeHtml(date)}</span></div>
    <div class="row"><span>Thu ngan</span><span>${escapeHtml(data.staffName || '-')}</span></div>
    <div class="row"><span>Khach hang</span><span>${escapeHtml(data.customerName || 'Khach le')}</span></div>
    ${data.customerPhone ? `<div class="row"><span>Dien thoai</span><span>${escapeHtml(data.customerPhone)}</span></div>` : ''}
    <div class="line"></div>
    <div class="section-label"><span>SAN PHAM</span><span>THANH TIEN</span></div>
    ${rows}
    <div class="line"></div>
    <div class="summary">
      <div class="summary-row"><span>So luong</span><span>${itemCount}</span></div>
      <div class="summary-row"><span>Tạm tính</span><span>${fmt(subtotal)}</span></div>
      ${promotionSection}
      ${loyaltySection}
      ${vatSection}
      <div class="summary-row total"><span>TONG CONG</span><span>${fmt(data.totalAmount)}</span></div>
    </div>
    <div class="payment row"><span>Thanh toan</span><span>${escapeHtml(payLabel)}</span></div>
    <div class="footer">
      Cam on quy khach va hen gap lai<br />
      Vui long kiem tra hang truoc khi roi quay<br />
      Doi tra trong 7 ngay neu con hoa don
      <div class="barcode"></div>
      ${escapeHtml(data.orderCode)}
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
}
