import * as React from 'react';
import { ProductsTable } from '@/components/catalog/ProductsTable';
import { type Product } from '@/lib/itemMapper';
import { fetchInventory } from '@/services/wmsApi';

export default function InventoryPage({ openProduct, productsList }: { openProduct: (product: Product) => void; productsList: Product[] }) {
  const [rows, setRows] = React.useState(productsList);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    fetchInventory()
      .then((inv) => {
        const mapped: Product[] = inv.map((row) => {
          const stock = Math.round(Number(row.availableQuantity));
          const matchingProduct = productsList.find((p) => p.sku === row.itemCode);
          const minStock = matchingProduct ? matchingProduct.minimumStock : 0;
          return {
            key: String(row.itemId),
            sku: row.itemCode,
            name: row.itemName,
            category: row.locationName,
            categoryId: 0,
            price: 0,
            cost: 0,
            stock,
            sold: 0,
            supplier: '-',
            status: stock === 0 ? 'Hết hàng' : stock <= minStock ? 'Sắp hết' : 'Còn hàng',
            expiry: row.expiryDate ?? 'Không áp dụng',
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
      <ProductsTable title="Tồn kho theo vị trí / lô" rows={rows} openProduct={openProduct} />
    </div>
  );
}
