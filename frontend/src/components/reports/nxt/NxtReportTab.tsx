import React, { useMemo } from 'react';
import { Table, Tooltip as AntdTooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Card, CardHeader } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { InventoryNxtReportDto } from '@/types/api';
import { StatCard } from '../StatCard';

type NxtReportTabProps = {
  nxtData: InventoryNxtReportDto[];
  loading: boolean;
  debouncedSearchText: string;
};

export function NxtReportTab({
  nxtData,
  loading,
  debouncedSearchText,
}: NxtReportTabProps) {
  const filteredData = useMemo(() => {
    return nxtData.filter((r) => {
      const matchText = !debouncedSearchText ||
        r.itemName.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
        r.itemCode.toLowerCase().includes(debouncedSearchText.toLowerCase());
      return matchText;
    });
  }, [nxtData, debouncedSearchText]);

  const totals = useMemo(() => {
    const totalOpening = nxtData.reduce((s, r) => s + r.openingValue, 0);
    const totalImported = nxtData.reduce((s, r) => s + r.importedValue, 0);
    const totalExported = nxtData.reduce((s, r) => s + r.exportedValue, 0);
    const totalClosing = nxtData.reduce((s, r) => s + r.closingValue, 0);
    return { totalOpening, totalImported, totalExported, totalClosing };
  }, [nxtData]);

  const columns: ColumnsType<InventoryNxtReportDto> = [
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
      key: 'unitName',
      title: 'Đơn vị',
      dataIndex: 'unitName',
      width: 100,
    },
    {
      key: 'openingQty',
      title: 'Tồn đầu (SL)',
      dataIndex: 'openingQty',
      width: 120,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.openingQty - b.openingQty,
    },
    {
      key: 'importedQty',
      title: 'Nhập (SL)',
      dataIndex: 'importedQty',
      width: 120,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.importedQty - b.importedQty,
    },
    {
      key: 'exportedQty',
      title: 'Xuất (SL)',
      dataIndex: 'exportedQty',
      width: 120,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.exportedQty - b.exportedQty,
    },
    {
      key: 'closingQty',
      title: 'Tồn cuối (SL)',
      dataIndex: 'closingQty',
      width: 120,
      sorter: (a, b) => a.closingQty - b.closingQty,
      render: (v: number) => {
        const isNegative = v < 0;
        return (
          <span className={`font-extrabold px-2 py-0.5 rounded border ${isNegative ? 'text-red-600 bg-red-50 border-red-200' : 'text-indigo-600 bg-indigo-50 border-indigo-100'}`}>
            {Math.round(v).toLocaleString('vi-VN')} {isNegative && '⚠️'}
          </span>
        );
      },
    },
    {
      key: 'fluctuation',
      title: (
        <span>
          Tỷ lệ xuất{' '}
          <AntdTooltip title="(Xuất / (Tồn đầu + Nhập)) * 100%">
            <span className="text-slate-400 cursor-help text-xs font-normal">ⓘ</span>
          </AntdTooltip>
        </span>
      ),
      width: 120,
      render: (_, r) => {
        const base = r.openingQty + r.importedQty;
        if (base === 0) return '—';
        const pct = (r.exportedQty / base) * 100;
        return (
          <span className={pct > 80 ? 'text-orange-500 font-semibold' : ''}>
            {pct.toFixed(1)}%
          </span>
        );
      },
      sorter: (a, b) => {
        const baseA = a.openingQty + a.importedQty;
        const pctA = baseA === 0 ? 0 : (a.exportedQty / baseA) * 100;
        const baseB = b.openingQty + b.importedQty;
        const pctB = baseB === 0 ? 0 : (b.exportedQty / baseB) * 100;
        return pctA - pctB;
      }
    },
  ];

  const renderSummary = (pageData: readonly InventoryNxtReportDto[]) => {
    let sumOp = 0, sumIm = 0, sumEx = 0, sumCl = 0;
    pageData.forEach((r) => {
      sumOp += r.openingQty;
      sumIm += r.importedQty;
      sumEx += r.exportedQty;
      sumCl += r.closingQty;
    });

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row className="bg-slate-50 font-bold">
          <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
          <Table.Summary.Cell index={1}></Table.Summary.Cell>
          <Table.Summary.Cell index={2}></Table.Summary.Cell>
          <Table.Summary.Cell index={3}>{Math.round(sumOp).toLocaleString('vi-VN')}</Table.Summary.Cell>
          <Table.Summary.Cell index={4}>{Math.round(sumIm).toLocaleString('vi-VN')}</Table.Summary.Cell>
          <Table.Summary.Cell index={5}>{Math.round(sumEx).toLocaleString('vi-VN')}</Table.Summary.Cell>
          <Table.Summary.Cell index={6}>
             <span className={sumCl < 0 ? 'text-red-600' : 'text-indigo-600'}>
               {Math.round(sumCl).toLocaleString('vi-VN')}
             </span>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={7}></Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Tồn đầu (VNĐ)" value={money(totals.totalOpening)} />
        <StatCard label="Nhập trong kỳ (VNĐ)" value={money(totals.totalImported)} />
        <StatCard label="Xuất trong kỳ (VNĐ)" value={money(totals.totalExported)} />
        <StatCard label="Tồn cuối (VNĐ)" value={money(totals.totalClosing)} color={totals.totalClosing < 0 ? 'text-red-600' : 'text-slate-800'} />
      </div>
      <Card>
        <CardHeader title="Bảng Tổng hợp Nhập Xuất Tồn" description={`${filteredData.length} sản phẩm hiển thị`} />
        <div className="px-4 pb-4">
          <Table
            loading={loading}
            dataSource={filteredData.map((r) => ({ ...r, key: r.itemCode }))}
            columns={columns}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ y: 400, x: 'max-content' }}
            size="small"
            summary={renderSummary}
          />
        </div>
      </Card>
    </div>
  );
}
