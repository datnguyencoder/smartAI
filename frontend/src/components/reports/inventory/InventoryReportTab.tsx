import React, { useMemo } from 'react';
import { Table, Tag, Tooltip as AntdTooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Card, CardHeader } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { InventoryReportDto, InventoryItemDto } from '@/types/api';
import type { Product } from '@/lib/itemMapper';
import { StatCard } from '../StatCard';

type InventoryReportTabProps = {
  inventoryData: InventoryReportDto[];
  inventoryLots: InventoryItemDto[];
  loading: boolean;
  debouncedSearchText: string;
  productsList: Product[];
  selectedCategory: string;
  selectedExpiryStatus: string;
  visibleColumns: string[];
};

export function InventoryReportTab({
  inventoryData,
  inventoryLots,
  loading,
  debouncedSearchText,
  productsList,
  selectedCategory,
  selectedExpiryStatus,
  visibleColumns,
}: InventoryReportTabProps) {
  const filteredInventoryData = useMemo(() => {
    return inventoryData.filter((r) => {
      const matchText = !debouncedSearchText ||
        r.itemName.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
        r.itemCode.toLowerCase().includes(debouncedSearchText.toLowerCase());
      const matchCat = selectedCategory === 'all' || r.categoryName === selectedCategory;
      
      let matchExpiry = true;
      if (selectedExpiryStatus === 'nearExpiry') {
        matchExpiry = r.daysUntilExpiry != null && r.daysUntilExpiry <= 30;
      } else if (selectedExpiryStatus === 'normal') {
        matchExpiry = r.daysUntilExpiry == null || r.daysUntilExpiry > 30;
      }

      return matchText && matchCat && matchExpiry;
    });
  }, [inventoryData, debouncedSearchText, selectedCategory, selectedExpiryStatus]);

  const inventoryTotals = useMemo(() => {
    const totalStock = inventoryData.reduce((s, r) => s + r.currentStock, 0);
    const totalShrinkage = inventoryData.reduce((s, r) => s + r.shrinkage, 0);
    const nearExpiry = inventoryData.filter((r) => r.daysUntilExpiry != null && r.daysUntilExpiry <= 30).length;
    const avgTurnover = inventoryData.length
      ? inventoryData.reduce((s, r) => s + r.turnoverRate, 0) / inventoryData.length
      : 0;
    return { totalStock, totalShrinkage, nearExpiry, avgTurnover };
  }, [inventoryData]);

  const allInventoryColumns: (ColumnsType<InventoryReportDto>[number] & { key: string })[] = [
    {
      key: 'itemCode',
      title: 'Mã SP',
      dataIndex: 'itemCode',
      width: 120,
      fixed: 'left',
      sorter: (a, b) => (a.itemCode || '').localeCompare(b.itemCode || ''),
    },
    {
      key: 'itemName',
      title: 'Tên sản phẩm',
      dataIndex: 'itemName',
      width: 200,
      sorter: (a, b) => (a.itemName || '').localeCompare(b.itemName || ''),
    },
    {
      key: 'categoryName',
      title: 'Danh mục',
      dataIndex: 'categoryName',
      width: 140,
      sorter: (a, b) => (a.categoryName || '').localeCompare(b.categoryName || ''),
    },
    {
      key: 'currentStock',
      title: 'Tồn hiện tại',
      dataIndex: 'currentStock',
      width: 120,
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (v: number) => (
        <span className="font-extrabold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-100">
          {Math.round(v).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'inventoryValue',
      title: 'Giá trị tồn (VNĐ)',
      width: 160,
      sorter: (a, b) => {
        const costA = productsList.find((p) => p.sku === a.itemCode)?.cost || 0;
        const costB = productsList.find((p) => p.sku === b.itemCode)?.cost || 0;
        return a.currentStock * costA - b.currentStock * costB;
      },
      render: (_, r) => {
        const matchingProduct = productsList.find((p) => p.sku === r.itemCode);
        const cost = matchingProduct?.cost || 0;
        return money(r.currentStock * cost);
      },
    },
    {
      key: 'minStock',
      title: 'Tồn tối thiểu',
      width: 130,
      sorter: (a, b) => {
        const minA = productsList.find((p) => p.sku === a.itemCode)?.minimumStock || 0;
        const minB = productsList.find((p) => p.sku === b.itemCode)?.minimumStock || 0;
        return minA - minB;
      },
      render: (_, r) => {
        const matchingProduct = productsList.find((p) => p.sku === r.itemCode);
        const minStock = matchingProduct?.minimumStock || 0;
        const isLow = r.currentStock <= minStock;
        return (
          <span className={isLow ? 'text-red-500 font-bold animate-pulse' : ''}>
            {minStock.toLocaleString('vi-VN')} {isLow && '⚠️'}
          </span>
        );
      },
    },
    {
      key: 'location',
      title: 'Vị trí',
      width: 150,
      render: (_, r) => {
        const matchingLots = inventoryLots.filter((lot) => lot.itemId === r.itemId || lot.itemCode === r.itemCode);
        const locationsStr = Array.from(new Set(matchingLots.map((l) => l.locationName))).join(', ');
        return locationsStr || '—';
      },
    },
    {
      key: 'totalPurchased',
      title: 'Đã nhập',
      dataIndex: 'totalPurchased',
      width: 110,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.totalPurchased - b.totalPurchased,
    },
    {
      key: 'totalSold',
      title: 'Đã bán',
      dataIndex: 'totalSold',
      width: 110,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.totalSold - b.totalSold,
    },
    {
      key: 'totalScrapped',
      title: 'Đã hủy',
      dataIndex: 'totalScrapped',
      width: 110,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.totalScrapped - b.totalScrapped,
    },
    {
      key: 'shrinkage',
      title: (
        <span>
          Hao hụt (mất mát){' '}
          <AntdTooltip title="Hao hụt = Chênh lệch giữa nhập - bán - hủy - tồn">
            <span className="text-slate-400 cursor-help text-xs font-normal">ⓘ</span>
          </AntdTooltip>
        </span>
      ),
      dataIndex: 'shrinkage',
      width: 145,
      render: (v: number) => (
        <span className={v > 0 ? 'text-red-600 font-semibold' : ''}>
          {Math.round(v).toLocaleString('vi-VN')}
        </span>
      ),
      sorter: (a, b) => a.shrinkage - b.shrinkage,
    },
    {
      key: 'turnoverRate',
      title: (
        <span>
          Quay vòng{' '}
          <AntdTooltip title="Số lần hàng được bán hết và nhập lại trong kỳ">
            <span className="text-slate-400 cursor-help text-xs font-normal">ⓘ</span>
          </AntdTooltip>
        </span>
      ),
      dataIndex: 'turnoverRate',
      width: 120,
      render: (v: number) => (v != null ? v.toFixed(2) : '—'),
      sorter: (a, b) => (a.turnoverRate || 0) - (b.turnoverRate || 0),
    },
    {
      key: 'nearestExpiryDate',
      title: 'Hạn gần nhất',
      dataIndex: 'nearestExpiryDate',
      width: 130,
      render: (v: string) => v ?? '—',
      sorter: (a, b) => (a.nearestExpiryDate || '').localeCompare(b.nearestExpiryDate || ''),
    },
    {
      key: 'daysUntilExpiry',
      title: 'Còn (ngày)',
      dataIndex: 'daysUntilExpiry',
      width: 110,
      render: (v: number | undefined) => (
        v != null ? (
          <Tag color={v <= 7 ? 'red' : v <= 30 ? 'orange' : 'green'}>
            {v} ngày
          </Tag>
        ) : '—'
      ),
      sorter: (a, b) => (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999),
    },
  ];

  const inventoryColumns = allInventoryColumns.filter((c) => visibleColumns.includes(c.key));

  const renderInventorySummary = (pageData: readonly InventoryReportDto[]) => {
    let totalStockVal = 0;
    let totalInvValue = 0;
    let totalPurchasedVal = 0;
    let totalSoldVal = 0;
    let totalScrappedVal = 0;
    let totalShrink = 0;

    pageData.forEach((r) => {
      totalStockVal += r.currentStock;
      const cost = productsList.find((p) => p.sku === r.itemCode)?.cost || 0;
      totalInvValue += r.currentStock * cost;
      totalPurchasedVal += r.totalPurchased;
      totalSoldVal += r.totalSold;
      totalScrappedVal += r.totalScrapped;
      totalShrink += r.shrinkage;
    });

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row className="bg-slate-50 font-bold">
          {inventoryColumns.map((col, index) => {
            const key = col.key as string;
            if (index === 0) {
              return <Table.Summary.Cell index={index} key={key}>Tổng cộng</Table.Summary.Cell>;
            }
            if (key === 'currentStock') {
              return (
               <Table.Summary.Cell index={index} key={key}>
                  <span className="text-indigo-600">
                    {Math.round(totalStockVal).toLocaleString('vi-VN')}
                  </span>
                </Table.Summary.Cell>
              );
            }
            if (key === 'inventoryValue') {
              return <Table.Summary.Cell index={index} key={key}>{money(totalInvValue)}</Table.Summary.Cell>;
            }
            if (key === 'totalPurchased') {
              return <Table.Summary.Cell index={index} key={key}>{Math.round(totalPurchasedVal).toLocaleString('vi-VN')}</Table.Summary.Cell>;
            }
            if (key === 'totalSold') {
              return <Table.Summary.Cell index={index} key={key}>{Math.round(totalSoldVal).toLocaleString('vi-VN')}</Table.Summary.Cell>;
            }
            if (key === 'totalScrapped') {
              return <Table.Summary.Cell index={index} key={key}>{Math.round(totalScrappedVal).toLocaleString('vi-VN')}</Table.Summary.Cell>;
            }
            if (key === 'shrinkage') {
              return (
                <Table.Summary.Cell index={index} key={key}>
                  <span className={totalShrink > 0 ? 'text-red-600' : ''}>
                    {Math.round(totalShrink).toLocaleString('vi-VN')}
                  </span>
                </Table.Summary.Cell>
              );
            }
            return <Table.Summary.Cell index={index} key={key} />;
          })}
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Tổng tồn kho" value={Math.round(inventoryTotals.totalStock).toLocaleString('vi-VN')} />
        <StatCard
          label="Tổng hao hụt"
          value={Math.round(inventoryTotals.totalShrinkage).toLocaleString('vi-VN')}
          color={inventoryTotals.totalShrinkage > 0 ? 'text-red-600' : 'text-slate-800'}
        />
        <StatCard
          label="Cận hạn (≤30 ngày)"
          value={inventoryTotals.nearExpiry}
          color={inventoryTotals.nearExpiry > 0 ? 'text-amber-600' : 'text-slate-800'}
        />
        <StatCard label="Quay vòng TB" value={inventoryTotals.avgTurnover.toFixed(2)} />
      </div>
      <Card>
        <CardHeader title="Chi tiết tồn kho" description={`${filteredInventoryData.length} sản phẩm hiển thị`} />
        <div className="px-4 pb-4">
          <Table
            loading={loading}
            dataSource={filteredInventoryData.map((r) => ({ ...r, key: r.itemId }))}
            columns={inventoryColumns}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ y: 400, x: 'max-content' }}
            size="small"
            summary={renderInventorySummary}
          />
        </div>
      </Card>
    </div>
  );
}
