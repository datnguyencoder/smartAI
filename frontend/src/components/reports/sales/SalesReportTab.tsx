import React, { useMemo } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Card, CardHeader } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { SalesReportDto } from '@/types/api';
import { StatCard } from '../StatCard';
import { fuzzySearch } from '@/lib/fuzzySearch';

type SalesReportTabProps = {
  salesData: SalesReportDto[];
  loading: boolean;
  debouncedSearchText: string;
};

export function SalesReportTab({ salesData, loading, debouncedSearchText }: SalesReportTabProps) {
  const filteredSalesData = useMemo(() => {
    return fuzzySearch(salesData, ['period'], debouncedSearchText);
  }, [salesData, debouncedSearchText]);

  const salesTotals = useMemo(() => {
    const totalRevenue = salesData.reduce((s, r) => s + r.totalRevenue, 0);
    const totalOrders = salesData.reduce((s, r) => s + r.totalOrders, 0);
    const grossProfit = salesData.reduce((s, r) => s + r.grossProfit, 0);
    const totalItemsSold = salesData.reduce((s, r) => s + r.totalItemsSold, 0);
    return { totalRevenue, totalOrders, grossProfit, totalItemsSold };
  }, [salesData]);

  const salesColumns: ColumnsType<SalesReportDto> = [
    {
      title: 'Kỳ báo cáo',
      dataIndex: 'period',
      width: 130,
      fixed: 'left',
      sorter: (a, b) => (a.period || '').localeCompare(b.period || ''),
    },
    {
      title: 'Tổng đơn',
      dataIndex: 'totalOrders',
      width: 100,
      sorter: (a, b) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Đơn hủy',
      dataIndex: 'cancelledOrders',
      width: 165,
      sorter: (a, b) => a.cancelledOrders - b.cancelledOrders,
      render: (v: number, r) => {
        const aov = r.totalOrders > 0 ? r.totalRevenue / r.totalOrders : 0;
        const estValue = Math.round(v * aov);
        return (
          <span>
            {v.toLocaleString('vi-VN')} đơn{' '}
            <span className="text-slate-400 text-xs font-normal">
              (~{money(estValue)} ước tính)
            </span>
          </span>
        );
      },
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      width: 150,
      render: (v: number) => money(v),
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
    },
    {
      title: 'Giá vốn',
      dataIndex: 'totalCost',
      width: 150,
      render: (v: number) => money(v),
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
    {
      title: 'Lợi nhuận gộp',
      dataIndex: 'grossProfit',
      width: 150,
      render: (v: number) => (
        <span className={v >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
          {money(v)}
        </span>
      ),
      sorter: (a, b) => a.grossProfit - b.grossProfit,
    },
    {
      title: 'SP bán ra',
      dataIndex: 'totalItemsSold',
      width: 110,
      sorter: (a, b) => a.totalItemsSold - b.totalItemsSold,
    },
  ];

  const renderSalesSummary = (pageData: readonly SalesReportDto[]) => {
    let totalOrd = 0;
    let totalCancel = 0;
    let totalRev = 0;
    let totalCostVal = 0;
    let totalProf = 0;
    let totalSoldVal = 0;

    pageData.forEach((r) => {
      totalOrd += r.totalOrders;
      totalCancel += r.cancelledOrders;
      totalRev += r.totalRevenue;
      totalCostVal += r.totalCost;
      totalProf += r.grossProfit;
      totalSoldVal += r.totalItemsSold;
    });

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row className="bg-slate-50 font-bold">
          <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
          <Table.Summary.Cell index={1}>{totalOrd.toLocaleString('vi-VN')}</Table.Summary.Cell>
          <Table.Summary.Cell index={2}>{totalCancel.toLocaleString('vi-VN')} đơn</Table.Summary.Cell>
          <Table.Summary.Cell index={3}>{money(totalRev)}</Table.Summary.Cell>
          <Table.Summary.Cell index={4}>{money(totalCostVal)}</Table.Summary.Cell>
          <Table.Summary.Cell index={5}>
            <span className={totalProf >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {money(totalProf)}
            </span>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={6}>{totalSoldVal.toLocaleString('vi-VN')}</Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Doanh thu" value={money(salesTotals.totalRevenue)} color="text-emerald-600" />
        <StatCard label="Tổng đơn hàng" value={salesTotals.totalOrders.toLocaleString('vi-VN')} />
        <StatCard
          label="Lợi nhuận gộp"
          value={money(salesTotals.grossProfit)}
          color={salesTotals.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />
        <StatCard label="SP bán ra" value={salesTotals.totalItemsSold.toLocaleString('vi-VN')} />
      </div>
      <Card>
        <CardHeader title="Chi tiết báo cáo bán hàng" description={`${filteredSalesData.length} kỳ báo cáo hiển thị`} />
        <div className="px-4 pb-4">
          <Table
            loading={loading}
            dataSource={filteredSalesData.map((r, i) => ({ ...r, key: i }))}
            columns={salesColumns}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ y: 400, x: 'max-content' }}
            size="small"
            summary={renderSalesSummary}
          />
        </div>
      </Card>
    </div>
  );
}
