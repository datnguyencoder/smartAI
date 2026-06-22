import { fetchOrders } from '@/services/wmsApi';
import { PAYMENT_LABEL } from '@/lib/constants/paymentLabels';

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  PENDING: 'Chờ xử lý',
};

export function ordersToInvoices(orders: Awaited<ReturnType<typeof fetchOrders>>) {
  return orders.map((o) => {
    const itemsSubtotal = (o.items ?? []).reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
      0,
    );
    const discount = Number(o.discountAmount || 0);
    const total = Number(o.totalAmount);
    // Prefer backend-computed subtotalBeforeDiscount to avoid miscalculation when loyalty points are redeemed
    const subtotal =
      o.subtotalBeforeDiscount != null
        ? Number(o.subtotalBeforeDiscount)
        : itemsSubtotal > 0
          ? itemsSubtotal
          : total + discount;

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
        lotId: i.lotId,
        lotNumber: i.lotNumber,
      })),
    };
  });
}
