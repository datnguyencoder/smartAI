import type { ItemDto } from '@/types/api';

export type Product = {
  key: string;
  name: string;
  sku: string;
  category: string;
  categoryId: number;
  stock: number;
  sold: number;
  price: number;
  cost: number;
  supplier: string;
  status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng' | 'Nguy cơ';
  expiry: string;
  imageUrl?: string;
  purchaseRatio: number;
  minimumStock: number;
  baseUomName?: string;
  purchaseUomName?: string;
  originalPrice?: number;
  discountPercent?: number;
  /** Giá đã bị trừ 1 số tiền cố định (đã bake vào price) — dùng để hiện badge riêng, khác badge % ở trên. */
  fixedAmountOff?: number;
  bogoBuyQuantity?: number;
  bogoFreeQuantity?: number;
  bogoPlanName?: string;
  /** Giảm % hoặc số tiền cố định CẦN đủ số lượng tối thiểu mới áp dụng — tính động theo số
   * lượng thực tế trong giỏ (khác với discountPercent ở trên vốn áp dụng ngay từ 1 sản phẩm). */
  deferredDiscountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  deferredDiscountValue?: number;
  deferredDiscountMinQty?: number;
  deferredDiscountPlanName?: string;
};

function defaultProductImageUrl(itemCode?: string | null) {
  const slug = itemCode?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug ? `/media/items/${slug}.svg` : undefined;
}

function resolveProductImageUrl(item: ItemDto) {
  const imageUrl = item.imageUrl?.trim();
  if (!imageUrl || imageUrl.startsWith('/media/categories/')) {
    return defaultProductImageUrl(item.itemCode);
  }
  return imageUrl;
}

export function itemToProduct(item: ItemDto): Product {
  const qty = Number(item.totalAvailableQty ?? 0);
  const min = item.minimumStock ?? 0;
  let status: Product['status'] = 'Còn hàng';
  if (qty === 0) status = 'Hết hàng';
  else if (qty <= min) status = 'Sắp hết';

  let purchaseRatio = item.purchaseRatio ?? item.purchaseConversionRatio ?? 1;

  return {
    key: String(item.id),
    name: item.itemName,
    sku: item.itemCode,
    category: item.categoryName ?? 'Khác',
    categoryId: item.categoryId ?? 0,
    stock: qty,
    sold: Number(item.soldQty ?? 0),
    price: Number(item.sellingPrice),
    cost: Number(item.costPrice ?? 0),
    imageUrl: resolveProductImageUrl(item),
    supplier: '-',
    status,
    expiry: item.hasExpiry ? '-' : 'Không áp dụng',
    purchaseRatio,
    minimumStock: item.minimumStock ?? 0,
    baseUomName: item.baseUomName,
    purchaseUomName: item.purchaseUomName,
  };
}

export function statusTone(status: Product['status']): 'success' | 'warning' | 'danger' {
  if (status === 'Còn hàng') return 'success';
  if (status === 'Sắp hết') return 'warning';
  return 'danger';
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value) + 'đ';
