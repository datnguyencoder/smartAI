import { fetchOrders } from '@/services/wmsApi';

export function ordersToInvoices(orders: Awaited<ReturnType<typeof fetchOrders>>) {
  return orders.map((o) => ({
    key: o.orderCode,
    orderId: o.id,
    rawStatus: o.status,
    customer: o.customerName,
    amount: Number(o.totalAmount),
    cashier: o.cashierName || 'Hệ thống',
    status: o.status === 'CANCELLED' ? 'Đã hủy' : 'Đã thanh toán',
    time: new Date(o.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    subtotal: Number(o.totalAmount) / 1.08,
    discount: Number(o.discountAmount || 0),
    vat: Number(o.totalAmount) * 0.08 / 1.08,
    items: (o.items ?? []).map((i) => ({
      name: i.itemName,
      qty: Number(i.quantity),
      price: Number(i.unitPrice),
      itemId: i.itemId,
    })),
  }));
}
