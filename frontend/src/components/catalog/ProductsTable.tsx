import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Card, CardHeader, StatusChip } from '@/components/ui';
import { ProductThumbnail } from '@/components/catalog/ProductThumbnail';
import { formatMoney, statusTone, type Product } from '@/lib/itemMapper';

type Props = {
  title: string;
  rows: Product[];
  openProduct: (product: Product) => void;
};

export function ProductsTable({ title, rows, openProduct }: Props) {
  const columns: ColumnsType<Product> = [
    {
      title: '',
      dataIndex: 'imageUrl',
      width: 56,
      render: (_, row) => <ProductThumbnail name={row.name} imageUrl={row.imageUrl} size={40} />,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (v, row) => (
        <button
          className="text-left font-semibold text-ink hover:text-primary transition"
          onClick={() => openProduct(row)}
        >
          {v}
        </button>
      ),
    },
    { title: 'Danh mục', dataIndex: 'category' },
    { title: 'Đã bán', dataIndex: 'sold', sorter: (a, b) => a.sold - b.sold },
    { title: 'Tồn', dataIndex: 'stock' },
    { title: 'Doanh thu', dataIndex: 'price', render: (_, row) => formatMoney(row.price * row.sold) },
    { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusChip tone={statusTone(v)}>{v}</StatusChip> },
  ];
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} />
      <Table<Product> columns={columns} dataSource={rows} pagination={{ pageSize: 12 }} size="middle" rowKey="key" />
    </Card>
  );
}
