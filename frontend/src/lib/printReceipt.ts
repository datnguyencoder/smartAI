import type { fetchOrderPrint } from '@/services/wmsApi';
import { PAYMENT_LABEL } from '@/lib/constants/paymentLabels';

export function buildPrintHtml(data: Awaited<ReturnType<typeof fetchOrderPrint>>) {
  const fmt = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
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
