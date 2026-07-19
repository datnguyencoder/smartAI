import * as React from 'react';
import { Button, Input } from 'antd';
import { Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui';
import { ProductsTable } from '@/components/catalog/ProductsTable';
import type { Product } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import type { UserDto } from '@/types/api';

type Props = {
  authUser: UserDto;
  openProduct: (product: Product) => void;
  openModal: () => void;
  productsList: Product[];
};

export default function ProductsPage({ authUser, openProduct, openModal, productsList }: Props) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState('all');
  const role = normalizeRole(authUser.role);
  const canCreateProduct = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'].includes(role);

  const filtered = productsList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const uniqueCategories = React.useMemo(() => {
    return Array.from(new Set(productsList.map((p) => p.category).filter(Boolean)));
  }, [productsList]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Input
          className="max-w-sm"
          prefix={<Search size={16} />}
          placeholder="Tìm theo tên, SKU, mã vạch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-48 h-8 px-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-primary bg-white"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
        >
          <option value="all">Tất cả danh mục</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {canCreateProduct && (
        <Button className="ml-auto" type="primary" icon={<Plus size={16} />} onClick={openModal}>
          Thêm mới sản phẩm
        </Button>
        )}
      </Card>
      <ProductsTable title="Danh sách sản phẩm" rows={filtered} openProduct={openProduct} />
    </div>
  );
}
