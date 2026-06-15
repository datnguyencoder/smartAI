import * as React from 'react';
import { Button, Table, Tabs, Tag, message as antdMessage } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import ReactSelect from 'react-select';
import { Card, CardHeader } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { Product } from '@/lib/itemMapper';
import {
  exportComprehensiveReport,
  exportReport,
  fetchInventoryReport,
  fetchPurchaseReport,
  fetchSalesReport,
} from '@/services/wmsApi';
import type { InventoryReportDto, PurchaseReportDto, SalesReportDto } from '@/types/api';

type Props = {
  productsList: Product[];
  invoicesList: any[];
};

export default function ReportsPage({ productsList: _productsList, invoicesList: _invoicesList }: Props) {
  const [activeTab, setActiveTab] = React.useState('sales');
  const [dateRange, setDateRange] = React.useState<[any, any] | null>(null);
  const [groupBy, setGroupBy] = React.useState<string>('day');
  const [loading, setLoading] = React.useState(false);

  const [salesData, setSalesData] = React.useState<SalesReportDto[]>([]);
  const [purchaseData, setPurchaseData] = React.useState<PurchaseReportDto[]>([]);
  const [inventoryData, setInventoryData] = React.useState<InventoryReportDto[]>([]);

  const formatRange = (): { from?: string; to?: string } => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return {};
    return {
      from: dateRange[0].format('YYYY-MM-DD'),
      to: dateRange[1].format('YYYY-MM-DD'),
    };
  };

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    const { from, to } = formatRange();
    try {
      if (activeTab === 'sales') {
        const data = await fetchSalesReport(from, to, groupBy);
        setSalesData(data);
      } else if (activeTab === 'purchase') {
        const data = await fetchPurchaseReport(from, to);
        setPurchaseData(data);
      } else {
        const data = await fetchInventoryReport(from, to);
        setInventoryData(data);
      }
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được báo cáo');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, groupBy]);

  React.useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const { from, to } = formatRange();
      const type = activeTab as 'sales' | 'purchase' | 'inventory';
      const blob = await exportReport(type, format, from, to, type === 'sales' ? groupBy : undefined);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `${type}-report-${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      antdMessage.success(`Xuất báo cáo ${format.toUpperCase()} thành công!`);
    } catch (e) {
      antdMessage.error('Lỗi khi xuất báo cáo: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleExportComprehensive = async (format: 'pdf' | 'excel' = 'pdf') => {
    try {
      const { from, to } = formatRange();
      const blob = await exportComprehensiveReport(format, from, to);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `comprehensive-report-${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      antdMessage.success(`Xuất Báo Cáo Tổng Hợp (${format.toUpperCase()}) thành công!`);
    } catch (e) {
      antdMessage.error('Lỗi khi xuất báo cáo tổng hợp: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const salesTotals = React.useMemo(() => {
    const totalRevenue = salesData.reduce((s, r) => s + r.totalRevenue, 0);
    const totalOrders = salesData.reduce((s, r) => s + r.totalOrders, 0);
    const grossProfit = salesData.reduce((s, r) => s + r.grossProfit, 0);
    const totalItemsSold = salesData.reduce((s, r) => s + r.totalItemsSold, 0);
    return { totalRevenue, totalOrders, grossProfit, totalItemsSold };
  }, [salesData]);

  const purchaseTotals = React.useMemo(() => {
    const totalAmount = purchaseData.reduce((s, r) => s + r.totalAmount, 0);
    const totalOrders = purchaseData.reduce((s, r) => s + r.totalOrders, 0);
    const totalQuantity = purchaseData.reduce((s, r) => s + r.totalQuantity, 0);
    return { totalAmount, totalOrders, totalQuantity, supplierCount: purchaseData.length };
  }, [purchaseData]);

  const inventoryTotals = React.useMemo(() => {
    const totalStock = inventoryData.reduce((s, r) => s + r.currentStock, 0);
    const totalShrinkage = inventoryData.reduce((s, r) => s + r.shrinkage, 0);
    const nearExpiry = inventoryData.filter((r) => r.daysUntilExpiry != null && r.daysUntilExpiry <= 30).length;
    const avgTurnover = inventoryData.length
      ? inventoryData.reduce((s, r) => s + r.turnoverRate, 0) / inventoryData.length
      : 0;
    return { totalStock, totalShrinkage, nearExpiry, avgTurnover };
  }, [inventoryData]);

  const salesColumns: ColumnsType<SalesReportDto> = [
    { title: 'Kỳ báo cáo', dataIndex: 'period', width: 130, fixed: 'left' },
    { title: 'Tổng đơn', dataIndex: 'totalOrders', width: 100, sorter: (a, b) => a.totalOrders - b.totalOrders },
    { title: 'Đơn hủy', dataIndex: 'cancelledOrders', width: 100 },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      width: 150,
      render: (v: number) => money(v),
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
    },
    { title: 'Giá vốn', dataIndex: 'totalCost', width: 150, render: (v: number) => money(v) },
    {
      title: 'Lợi nhuận gộp',
      dataIndex: 'grossProfit',
      width: 150,
      render: (v: number) => (
        <span className={v >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{money(v)}</span>
      ),
      sorter: (a, b) => a.grossProfit - b.grossProfit,
    },
    { title: 'SP bán ra', dataIndex: 'totalItemsSold', width: 110 },
    {
      title: 'Top sản phẩm',
      dataIndex: 'topProducts',
      width: 220,
      render: (tops: SalesReportDto['topProducts']) =>
        tops?.length ? tops.slice(0, 3).map((t) => t.itemName).join(', ') : '—',
    },
  ];

  const purchaseColumns: ColumnsType<PurchaseReportDto> = [
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', width: 200, fixed: 'left' },
    { title: 'Số đơn nhập', dataIndex: 'totalOrders', width: 120, sorter: (a, b) => a.totalOrders - b.totalOrders },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalAmount',
      width: 160,
      render: (v: number) => money(v),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    { title: 'Loại SP nhập', dataIndex: 'totalItemTypes', width: 120 },
    { title: 'Tổng SL nhập', dataIndex: 'totalQuantity', width: 130, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
  ];

  const inventoryColumns: ColumnsType<InventoryReportDto> = [
    { title: 'Mã SP', dataIndex: 'itemCode', width: 120, fixed: 'left' },
    { title: 'Tên sản phẩm', dataIndex: 'itemName', width: 200 },
    { title: 'Danh mục', dataIndex: 'categoryName', width: 140 },
    {
      title: 'Tồn hiện tại',
      dataIndex: 'currentStock',
      width: 120,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.currentStock - b.currentStock,
    },
    { title: 'Đã nhập', dataIndex: 'totalPurchased', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'Đã bán', dataIndex: 'totalSold', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    { title: 'Đã hủy', dataIndex: 'totalScrapped', width: 110, render: (v: number) => Math.round(v).toLocaleString('vi-VN') },
    {
      title: 'Hao hụt',
      dataIndex: 'shrinkage',
      width: 110,
      render: (v: number) => (
        <span className={v > 0 ? 'text-red-600 font-semibold' : ''}>{Math.round(v).toLocaleString('vi-VN')}</span>
      ),
    },
    {
      title: 'Quay vòng',
      dataIndex: 'turnoverRate',
      width: 110,
      render: (v: number) => v?.toFixed(2) ?? '—',
      sorter: (a, b) => a.turnoverRate - b.turnoverRate,
    },
    { title: 'Hạn gần nhất', dataIndex: 'nearestExpiryDate', width: 130, render: (v: string) => v ?? '—' },
    {
      title: 'Còn (ngày)',
      dataIndex: 'daysUntilExpiry',
      width: 110,
      render: (v: number | undefined) =>
        v != null ? <Tag color={v <= 7 ? 'red' : v <= 30 ? 'orange' : 'green'}>{v} ngày</Tag> : '—',
      sorter: (a, b) => (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999),
    },
  ];

  const StatCard = ({
    label,
    value,
    color = 'text-slate-800',
  }: {
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={'text-xl font-extrabold ' + (color || 'text-slate-800')}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="flex flex-wrap items-center gap-2">
              <MuiDatePicker
                label="Từ ngày"
                format="DD/MM/YYYY"
                value={dateRange && dateRange[0] ? dateRange[0] : null}
                onChange={(val) => {
                  setDateRange((prev) => [val, prev ? prev[1] : null]);
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    style: { width: 150 },
                    onKeyDown: (e) => e.preventDefault(),
                    slotProps: {
                      htmlInput: {
                        readOnly: true,
                      },
                    },
                  },
                  popper: {
                    style: { zIndex: 9999 },
                  },
                }}
              />
              <span className="text-slate-400">—</span>
              <MuiDatePicker
                label="Đến ngày"
                format="DD/MM/YYYY"
                value={dateRange && dateRange[1] ? dateRange[1] : null}
                onChange={(val) => {
                  setDateRange((prev) => [prev ? prev[0] : null, val]);
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    style: { width: 150 },
                    onKeyDown: (e) => e.preventDefault(),
                    slotProps: {
                      htmlInput: {
                        readOnly: true,
                      },
                    },
                  },
                  popper: {
                    style: { zIndex: 9999 },
                  },
                }}
              />
            </div>
          </LocalizationProvider>
          {activeTab === 'sales' && (
            <ReactSelect
              value={[
                { value: 'day', label: 'Theo ngày' },
                { value: 'month', label: 'Theo tháng' },
                { value: 'year', label: 'Theo năm' },
              ].find((opt) => opt.value === groupBy)}
              onChange={(newValue) => {
                if (newValue) {
                  setGroupBy(newValue.value);
                }
              }}
              styles={{
                control: (base, state) => ({
                  ...base,
                  width: 160,
                  minHeight: '40px',
                  height: '40px',
                  borderRadius: '0.75rem',
                  borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
                  boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
                  '&:hover': {
                    borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
                  },
                  fontSize: '14px',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#f3f4f6' : 'transparent',
                  color: state.isSelected ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  cursor: 'pointer',
                  '&:active': {
                    backgroundColor: '#e0e7ff',
                  },
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  zIndex: 9999,
                }),
              }}
              options={[
                { value: 'day', label: 'Theo ngày' },
                { value: 'month', label: 'Theo tháng' },
                { value: 'year', label: 'Theo năm' },
              ]}
            />
          )}
          <Button type="primary" onClick={loadReport} loading={loading}>
            Tải báo cáo
          </Button>
          <div className="flex-1" />
          <Button
            onClick={() => handleExport('excel')}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-emerald-600">table_view</span>}
            className="hover:border-emerald-500 hover:text-emerald-600"
          >
            Xuất Excel (Tab hiện tại)
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-red-500">picture_as_pdf</span>}
            className="hover:border-red-500 hover:text-red-600"
          >
            Xuất PDF (Tab hiện tại)
          </Button>
          <Button
            onClick={() => handleExportComprehensive('excel')}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-emerald-600">border_all</span>}
            className="border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 font-medium"
          >
            Xuất Excel Tổng Hợp (3 Sheet)
          </Button>
          <Button
            onClick={() => handleExportComprehensive('pdf')}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-red-500">picture_as_pdf</span>}
            className="border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 font-medium"
          >
            In Báo Cáo Tổng Hợp (PDF)
          </Button>
        </div>
      </Card>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'sales',
            label: 'Báo cáo bán hàng',
            children: (
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
                  <CardHeader title="Chi tiết báo cáo bán hàng" description={`${salesData.length} kỳ báo cáo`} />
                  <div className="px-4 pb-4">
                    <Table
                      loading={loading}
                      dataSource={salesData.map((r, i) => ({ ...r, key: i }))}
                      columns={salesColumns}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1200 }}
                      size="small"
                    />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'purchase',
            label: 'Báo cáo nhập hàng',
            children: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Tổng chi nhập" value={money(purchaseTotals.totalAmount)} color="text-blue-600" />
                  <StatCard label="Số đơn nhập" value={purchaseTotals.totalOrders.toLocaleString('vi-VN')} />
                  <StatCard label="Tổng SL nhập" value={Math.round(purchaseTotals.totalQuantity).toLocaleString('vi-VN')} />
                  <StatCard label="Nhà cung cấp" value={purchaseTotals.supplierCount} />
                </div>
                <Card>
                  <CardHeader title="Chi tiết nhập hàng theo NCC" description={`${purchaseData.length} nhà cung cấp`} />
                  <div className="px-4 pb-4">
                    <Table
                      loading={loading}
                      dataSource={purchaseData.map((r) => ({ ...r, key: r.supplierId }))}
                      columns={purchaseColumns}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 800 }}
                      size="small"
                    />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'inventory',
            label: 'Báo cáo tồn kho',
            children: (
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
                  <CardHeader title="Chi tiết tồn kho" description={`${inventoryData.length} sản phẩm`} />
                  <div className="px-4 pb-4">
                    <Table
                      loading={loading}
                      dataSource={inventoryData.map((r) => ({ ...r, key: r.itemId }))}
                      columns={inventoryColumns}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1500 }}
                      size="small"
                    />
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
