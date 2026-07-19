import * as React from 'react';
import { ProductsTable } from '@/components/catalog/ProductsTable';
import { type Product } from '@/lib/itemMapper';
import { fetchInventory } from '@/services/wmsApi';
import type { InventoryItemDto } from '@/types/api';

export default function InventoryPage({ openProduct, productsList }: { openProduct: (product: Product) => void; productsList: Product[] }) {
  const [rows, setRows] = React.useState(productsList);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    fetchInventory()
      .then((inv) => {
        // Mỗi dòng backend trả về là 1 tổ hợp item + vị trí + lô — phải CỘNG DỒN
        // availableQuantity theo itemId trước khi hiển thị, nếu không cột "Tồn"
        // chỉ hiện đúng 1 lô do bảng antd loại bỏ dòng trùng rowKey.
        const byItem = new Map<number, InventoryItemDto[]>();
        inv.forEach((row) => {
          const list = byItem.get(row.itemId) ?? [];
          list.push(row);
          byItem.set(row.itemId, list);
        });

        const mapped: Product[] = Array.from(byItem.values()).map((lots) => {
          const first = lots[0];
          const stock = Math.round(lots.reduce((sum, r) => sum + Number(r.availableQuantity || 0), 0));
          const matchingProduct = productsList.find((p) => p.sku === first.itemCode);
          const minStock = matchingProduct ? matchingProduct.minimumStock : 0;

          // HSD hiển thị = lô gần hết hạn nhất trong số các lô còn hàng (thông tin
          // hữu ích nhất để quyết định đẩy bán/khuyến mãi), không phải lô bất kỳ.
          const nearestExpiryLot = lots
            .filter((r) => r.expiryDate)
            .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())[0];

          return {
            key: String(first.itemId),
            sku: first.itemCode,
            name: first.itemName,
            category: matchingProduct?.category ?? 'Khác',
            categoryId: 0,
            price: 0,
            cost: 0,
            stock,
            sold: 0,
            supplier: '-',
            status: stock === 0 ? 'Hết hàng' : stock <= minStock ? 'Sắp hết' : 'Còn hàng',
            expiry: nearestExpiryLot?.expiryDate ?? 'Không áp dụng',
            purchaseRatio: 1,
            minimumStock: minStock,
          };
        });
        setRows(mapped.length ? mapped : productsList);
      })
      .catch(() => setRows(productsList))
      .finally(() => setLoading(false));
  }, [productsList]);
  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-muted">Đang tải tồn kho từ API…</p>}
      <ProductsTable title="Tồn kho theo sản phẩm" rows={rows} openProduct={openProduct} />
    </div>
  );
}
