import type { ItemDto } from '../types/api';

export type Product = {
  key: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  sold: number;
  price: number;
  supplier: string;
  status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng' | 'Nguy cơ';
  expiry: string;
};

export function itemToProduct(item: ItemDto): Product {
  const qty = Number(item.totalAvailableQty ?? 0);
  const min = item.minimumStock ?? 0;
  let status: Product['status'] = 'Còn hàng';
  if (qty === 0) status = 'Hết hàng';
  else if (qty <= min) status = 'Sắp hết';
  return {
    key: String(item.id),
    name: item.itemName,
    sku: item.itemCode,
    category: item.categoryName ?? 'Khác',
    stock: qty,
    sold: 0,
    price: Number(item.sellingPrice),
    supplier: '-',
    status,
    expiry: item.hasExpiry ? '-' : 'Không áp dụng',
  };
}
