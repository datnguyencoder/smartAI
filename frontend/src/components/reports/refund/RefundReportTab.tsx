import React, { useMemo } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ChartTooltip } from 'recharts';
import { Card, CardHeader } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { RefundReportDto, ReturnOrderDto } from '@/types/api';
import { StatCard } from '../StatCard';
import dayjs from 'dayjs';

type RefundReportTabProps = {
  refundData: RefundReportDto | null;
  loading: boolean;
  debouncedSearchText: string;
};

export function RefundReportTab({ refundData, loading, debouncedSearchText }: RefundReportTabProps) {
  // Classification check helper for local Tag rendering
  const getReasonCategory = (reasonText: string = '') => {
    const text = reasonText.toLowerCase();
    if (
      text.includes('hư hại') || text.includes('hỏng') || text.includes('lỗi') ||
      text.includes('móp') || text.includes('nứt') || text.includes('vỡ') ||
      text.includes('rách') || text.includes('bể') || text.includes('defect') ||
      text.includes('damage')
    ) {
      return { label: 'Hư hỏng / Lỗi', color: 'red', type: 'DAMAGED' };
    }
    if (
      text.includes('hết hạn') || text.includes('hết date') ||
      text.includes('quá hạn') || text.includes('quá date') ||
      text.includes('expired') || text.includes('outdate')
    ) {
      return { label: 'Hết hạn sử dụng', color: 'orange', type: 'EXPIRED' };
    }
    return { label: 'Lý do khác', color: 'blue', type: 'OTHER' };
  };

  const filteredOrders = useMemo(() => {
    if (!refundData || !refundData.refundOrders) return [];
    return refundData.refundOrders.filter((r) => {
      if (!debouncedSearchText) return true;
      const search = debouncedSearchText.toLowerCase();
      const code = `RO-${r.id}`.toLowerCase();
      const origCode = (r.originalOrderCode || '').toLowerCase();
      const reason = (r.reason || '').toLowerCase();
      const note = (r.note || '').toLowerCase();
      return code.includes(search) || origCode.includes(search) || reason.includes(search) || note.includes(search);
    });
  }, [refundData, debouncedSearchText]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!refundData) return [];
    return [
      { name: 'Hư hại / Lỗi', value: refundData.damagedRefundAmount, color: '#ef4444' },
      { name: 'Hết hạn sử dụng', value: refundData.expiredRefundAmount, color: '#f59e0b' },
      { name: 'Lý do khác', value: refundData.otherRefundAmount, color: '#3b82f6' },
    ].filter(item => item.value > 0);
  }, [refundData]);

  const columns: ColumnsType<ReturnOrderDto> = [
    {
      title: 'Mã phiếu trả',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (v) => <span className="font-semibold text-slate-800">RO-{v}</span>,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Hóa đơn gốc',
      dataIndex: 'originalOrderCode',
      key: 'originalOrderCode',
      width: 140,
      render: (v) => <span className="text-slate-600">{v || '—'}</span>,
    },
    {
      title: 'Ngày trả',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 150,
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.returnDate).unix() - dayjs(b.returnDate).unix(),
    },
    {
      title: 'Phân loại',
      dataIndex: 'reason',
      key: 'category',
      width: 140,
      render: (v) => {
        const cat = getReasonCategory(v);
        return <Tag color={cat.color}>{cat.label}</Tag>;
      },
    },
    {
      title: 'Lý do chi tiết',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (v, r) => (
        <Tooltip title={v}>
          <span>{v || '—'}</span>
          {r.note && <span className="text-slate-400 text-xs block">Ghi chú: {r.note}</span>}
        </Tooltip>
      ),
    },
    {
      title: 'Tiền hoàn trả',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 140,
      align: 'right',
      render: (v) => <span className="font-bold text-red-600">{money(v)}</span>,
      sorter: (a, b) => a.refundAmount - b.refundAmount,
    },
  ];

  const totalRefundsCount = refundData?.totalRefundOrders || 0;
  const totalRefundAmount = refundData?.totalRefundAmount || 0;
  const damagedRefundAmount = refundData?.damagedRefundAmount || 0;
  const expiredRefundAmount = refundData?.expiredRefundAmount || 0;
  const otherRefundAmount = refundData?.otherRefundAmount || 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Tổng tiền hoàn trả" value={money(totalRefundAmount)} color="text-red-600" />
        <StatCard
          label="Hoàn trả do hư hại"
          value={money(damagedRefundAmount)}
          color="text-slate-800"
        />
        <StatCard
          label="Hoàn trả do hết hạn"
          value={money(expiredRefundAmount)}
          color="text-slate-800"
        />
        <StatCard
          label="Lý do khác"
          value={money(otherRefundAmount)}
          color="text-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Danh sách phiếu hoàn hàng"
              description={`Hiển thị ${filteredOrders.length} / ${totalRefundsCount} phiếu hoàn hàng`}
            />
            <div className="px-4 pb-4">
              <Table
                loading={loading}
                dataSource={filteredOrders.map(o => ({ ...o, key: o.id }))}
                columns={columns}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                size="small"
                scroll={{ x: 'max-content' }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <p className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wide">Chi tiết sản phẩm hoàn trả</p>
                      <Table
                        rowKey="itemId"
                        size="small"
                        pagination={false}
                        dataSource={record.items || []}
                        columns={[
                          { title: 'Sản phẩm', dataIndex: 'itemName', key: 'itemName' },
                          { title: 'Số lượng trả', dataIndex: 'quantity', key: 'quantity', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') },
                          { title: 'Đơn giá bán', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (v) => money(v) },
                          { title: 'Tổng hoàn tiền', dataIndex: 'subtotal', key: 'subtotal', align: 'right', render: (v) => <span className="font-semibold text-slate-800">{money(v)}</span> },
                          {
                            title: 'Xử lý tồn kho',
                            dataIndex: 'handlingAction',
                            key: 'handlingAction',
                            render: (v) => v === 'RESTOCK' ? (
                              <Tag color="green">Nhập lại kho</Tag>
                            ) : (
                              <Tag color="red">Hủy hàng (Discard)</Tag>
                            )
                          },
                        ]}
                      />
                    </div>
                  ),
                  rowExpandable: (record) => !!record.items && record.items.length > 0,
                }}
              />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader
              title="Cơ cấu tiền hoàn"
              description="Biểu đồ tỷ lệ theo nguyên nhân đổi trả"
            />
            <div className="px-4 pb-4 flex flex-col items-center justify-center min-h-[300px]">
              {chartData.length === 0 ? (
                <div className="text-slate-400 text-sm flex flex-col items-center justify-center space-y-2 py-10">
                  <span className="material-symbols-rounded text-4xl">pie_chart</span>
                  <span>Không có dữ liệu biểu đồ</span>
                </div>
              ) : (
                <div className="w-full h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(value: number) => [money(value), 'Tiền hoàn']}
                        contentStyle={{ borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
