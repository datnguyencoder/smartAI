import { fetchOrders } from '@/services/wmsApi';

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  PENDING: 'Chờ xử lý',
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Tiền mặt',
  CARD: 'Thẻ ngân hàng',
  TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
  MIXED: 'Kết hợp',
};

export function ordersToInvoices(orders: Awaited<ReturnType<typeof fetchOrders>>) {
  return orders.map((o) => {
    const itemsSubtotal = (o.items ?? []).reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
      0,
    );
    const discount = Number(o.discountAmount || 0);
    const total = Number(o.totalAmount);
    const subtotal = itemsSubtotal > 0 ? itemsSubtotal : total + discount;

    return {
      key: o.orderCode,
      orderId: o.id,
      rawStatus: o.status,
      customer: o.customerName || 'Khách lẻ',
      customerPhone: o.customerPhone,
      amount: total,
      cashier: o.cashierName || 'Hệ thống',
      status: STATUS_LABEL[o.status] ?? o.status,
      time: new Date(o.orderDate).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      paymentMethod: PAYMENT_LABEL[o.paymentMethod ?? ''] ?? o.paymentMethod ?? 'Tiền mặt',
      promotionCode: o.promotionCode,
      loyaltyPointsRedeemed: o.loyaltyPointsRedeemed,
      loyaltyPointsEarned: o.loyaltyPointsEarned,
      subtotal,
      discount,
      items: (o.items ?? []).map((i) => ({
        name: i.itemName,
        qty: Number(i.quantity),
        price: Number(i.unitPrice),
        itemId: i.itemId,
      })),
    };
  });
}
