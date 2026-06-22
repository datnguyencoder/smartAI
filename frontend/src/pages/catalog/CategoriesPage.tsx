import * as React from 'react';
import { Input, Modal } from 'antd';
import { motion } from 'framer-motion';
import { Search, Tags } from 'lucide-react';
import { AiSummary } from '@/components/ai/AiSummary';
import { Card, StatusChip } from '@/components/ui';
import { ProductsTable } from '@/components/catalog/ProductsTable';
import type { Product } from '@/lib/itemMapper';
import type { CategoryDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

type Props = {
  categories: CategoryDto[];
  productsList: Product[];
  setPage: (page: PageKey) => void;
  openProduct: (product: Product) => void;
};

export default function CategoriesPage({ categories, productsList, setPage, openProduct }: Props) {
  const [selectedCat, setSelectedCat] = React.useState<any | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const rows =
    categories.length > 0
      ? categories
      : Array.from(new Set(productsList.map((p) => p.category))).map((name, i) => ({
          id: i,
          categoryName: name,
          active: true,
        }));
  const filtered = rows.filter(
    (c) => !searchQuery || c.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-semibold text-lg">Danh mục hàng hóa</h2>
          <Input
            className="w-64"
            prefix={<Search size={16} />}
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {filtered.map((cat) => {
            const count = productsList.filter((p) => p.category === cat.categoryName).length;
            return (
              <motion.div
                whileHover={{ y: -3 }}
                onClick={() => setSelectedCat(cat)}
                className="cursor-pointer rounded-xl border border-line bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                key={cat.id}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-primary">
                    <Tags size={18} />
                  </div>
                  <StatusChip tone={cat.active ? 'success' : 'warning'}>
                    {cat.active ? 'Đang bán' : 'Ngưng'}
                  </StatusChip>
                </div>
                <strong className="text-ink text-base">{cat.categoryName}</strong>
                <p className="mt-1 text-sm text-muted">{count} sản phẩm đang bày bán</p>
              </motion.div>
            );
          })}
        </div>
      </Card>
      <AiSummary setPage={setPage} />
      <Modal
        title={`Sản phẩm trong danh mục: ${selectedCat?.categoryName}`}
        open={!!selectedCat}
        onCancel={() => setSelectedCat(null)}
        footer={null}
        width={900}
      >
        {selectedCat && (
          <ProductsTable
            title=""
            rows={productsList.filter((p) => p.category === selectedCat.categoryName)}
            openProduct={openProduct}
          />
        )}
      </Modal>
    </div>
  );
}
