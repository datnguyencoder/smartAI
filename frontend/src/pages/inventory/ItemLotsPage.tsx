import React, { useEffect, useState } from 'react';
import { Input, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Card, CardHeader } from '@/components/ui';
import { fetchItemLots } from '@/services/wmsApi';
import type { ItemLotDto } from '@/types/api';

export default function ItemLotsPage() {
  const [lots, setLots] = useState<ItemLotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [lotSearch, setLotSearch] = useState('');

  const load = async (lotNumber?: string) => {
    setLoading(true);
    try {
      setLots(await fetchItemLots(undefined, lotNumber || undefined));
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Lỗi tải lô hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { title: 'Mã lô', dataIndex: 'lotNumber', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Sản phẩm', dataIndex: 'itemName' },
    { title: 'Item ID', dataIndex: 'itemId', width: 90 },
    {
      title: 'HSD',
      dataIndex: 'expiryDate',
      render: (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Quản lý lô hàng"
        description="Danh sách lô hàng theo sản phẩm — tra cứu HSD và mã lô"
      />
      <div className="px-5 pb-5">
        <Input.Search
          className="mb-4 max-w-sm"
          placeholder="Tìm theo mã lô..."
          allowClear
          onSearch={(v) => load(v.trim() || undefined)}
          onChange={(e) => setLotSearch(e.target.value)}
          value={lotSearch}
        />
        <Table rowKey="id" loading={loading} dataSource={lots} columns={columns} />
      </div>
    </Card>
  );
}
