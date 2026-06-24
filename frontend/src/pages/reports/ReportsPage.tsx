import * as React from 'react';
import { Tabs, Select, Checkbox, Popover, Button, message as antdMessage } from 'antd';
import dayjs from 'dayjs';

import type { Product } from '@/lib/itemMapper';
import type { UserDto, SalesReportDto, PurchaseReportDto, InventoryReportDto, InventoryItemDto } from '@/types/api';
import { fetchInventoryReport, fetchPurchaseReport, fetchSalesReport, fetchInventory } from '@/services/wmsApi';

// Hooks
import { useReportExport } from '@/components/reports/hooks/useReportExport';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';

// Components
import { ReportFilters } from '@/components/reports/ReportFilters';
import { SalesReportTab } from '@/components/reports/sales/SalesReportTab';
import { PurchaseReportTab } from '@/components/reports/purchase/PurchaseReportTab';
import { InventoryReportTab } from '@/components/reports/inventory/InventoryReportTab';

type Props = {
  productsList: Product[];
  invoicesList: any[];
  authUser: UserDto;
};

export default function ReportsPage({ productsList, invoicesList: _invoicesList, authUser }: Props) {
  const [activeTab, setActiveTab] = React.useState('sales');
  const [dateRange, setDateRange] = React.useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(() => [
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [groupBy, setGroupBy] = React.useState<string>('day');
  const [loading, setLoading] = React.useState(false);

  // Global search text handled by hook
  const { searchText, setSearchText, debouncedSearchText } = useDebouncedSearch('', 300);

  // Filters specific to Inventory
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = React.useState<string>('all');
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>([
    'itemCode', 'itemName', 'categoryName', 'currentStock', 'inventoryValue',
    'minStock', 'location', 'totalPurchased', 'totalSold', 'daysUntilExpiry',
  ]);

  // Data states
  const [salesData, setSalesData] = React.useState<SalesReportDto[]>([]);
  const [purchaseData, setPurchaseData] = React.useState<PurchaseReportDto[]>([]);
  const [inventoryData, setInventoryData] = React.useState<InventoryReportDto[]>([]);
  const [inventoryLots, setInventoryLots] = React.useState<InventoryItemDto[]>([]);
  const [loadingLots, setLoadingLots] = React.useState(false);

  // Unique categories for the dropdown
  const uniqueCategories = React.useMemo(() => {
    const cats = inventoryData.map((r) => r.categoryName).filter(Boolean);
    return Array.from(new Set(cats));
  }, [inventoryData]);

  // Data fetching
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
  }, [loadReport]);

  React.useEffect(() => {
    if (activeTab === 'inventory') {
      setLoadingLots(true);
      fetchInventory()
        .then(setInventoryLots)
        .catch((e) => antdMessage.error('Không tải được vị trí kho: ' + (e instanceof Error ? e.message : String(e))))
        .finally(() => setLoadingLots(false));
    }
  }, [activeTab]);

  // Export Logic (Server-side Export)
  const canExport = authUser.role === 'ROLE_ADMIN' || authUser.role === 'ROLE_MANAGER';
  const {
    exportingExcel, exportingPdf, exportingComp,
    handleExport, handleExportComprehensive
  } = useReportExport({ canExport, activeTab, dateRange, groupBy });

  // Filtered Datasets for local CSV export
  const filteredSalesData = React.useMemo(() => {
    return salesData.filter((r) => {
      if (!debouncedSearchText) return true;
      return r.period.toLowerCase().includes(debouncedSearchText.toLowerCase());
    });
  }, [salesData, debouncedSearchText]);

  const filteredPurchaseData = React.useMemo(() => {
    return purchaseData.filter((r) => {
      if (!debouncedSearchText) return true;
      return r.supplierName.toLowerCase().includes(debouncedSearchText.toLowerCase());
    });
  }, [purchaseData, debouncedSearchText]);

  const filteredInventoryData = React.useMemo(() => {
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

  const handleExportFilteredCSV = () => {
    if (!canExport) {
      antdMessage.warning('Bạn không có quyền thực hiện chức năng này.');
      return;
    }
    let csvContent = '\uFEFF';
    let filename = '';

    if (activeTab === 'sales') {
      const headers = ['Kỳ báo cáo', 'Tổng đơn', 'Đơn hủy', 'Doanh thu (VNĐ)', 'Giá vốn (VNĐ)', 'Lợi nhuận gộp (VNĐ)', 'SP bán ra'];
      csvContent += headers.join(',') + '\n';
      filteredSalesData.forEach((r) => {
        csvContent += [`"${r.period}"`, r.totalOrders, r.cancelledOrders, r.totalRevenue, r.totalCost, r.grossProfit, r.totalItemsSold].join(',') + '\n';
      });
      filename = `sales-report-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'purchase') {
      const headers = ['Nhà cung cấp', 'Số đơn nhập', 'Tổng giá trị (VNĐ)', 'Số mặt hàng đã nhập', 'Tổng SL nhập'];
      csvContent += headers.join(',') + '\n';
      filteredPurchaseData.forEach((r) => {
        csvContent += [`"${r.supplierName}"`, r.totalOrders, r.totalAmount, r.totalItemTypes, r.totalQuantity].join(',') + '\n';
      });
      filename = `purchase-report-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Mã SP', 'Tên sản phẩm', 'Danh mục', 'Tồn hiện tại', 'Giá trị tồn (VNĐ)', 'Tồn tối thiểu', 'Vị trí', 'Đã nhập', 'Đã bán', 'Đã hủy', 'Hao hụt', 'Quay vòng', 'Hạn gần nhất', 'Còn (ngày)'];
      csvContent += headers.join(',') + '\n';
      filteredInventoryData.forEach((r) => {
        const matchingProduct = productsList.find((p) => p.sku === r.itemCode);
        const cost = matchingProduct?.cost || 0;
        const minStock = matchingProduct?.minimumStock || 0;
        const matchingLots = inventoryLots.filter((lot) => lot.itemId === r.itemId || lot.itemCode === r.itemCode);
        const locationsStr = Array.from(new Set(matchingLots.map((l) => l.locationName))).join('; ');

        csvContent += [
          `"${r.itemCode}"`, `"${r.itemName}"`, `"${r.categoryName || ''}"`, r.currentStock, r.currentStock * cost,
          minStock, `"${locationsStr || ''}"`, r.totalPurchased, r.totalSold, r.totalScrapped, r.shrinkage,
          r.turnoverRate, `"${r.nearestExpiryDate || ''}"`, r.daysUntilExpiry ?? ''
        ].join(',') + '\n';
      });
      filename = `inventory-report-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    antdMessage.success('Xuất dữ liệu CSV thành công!');
  };

  // Extra Filters rendered in ReportFilters based on active tab
  const columnToggleMenu = (
    <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
      <div className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2 border-b pb-1">Hiển thị cột</div>
      {[
        { key: 'itemCode', label: 'Mã SP' }, { key: 'itemName', label: 'Tên sản phẩm' }, { key: 'categoryName', label: 'Danh mục' },
        { key: 'currentStock', label: 'Tồn hiện tại' }, { key: 'inventoryValue', label: 'Giá trị tồn (VNĐ)' },
        { key: 'minStock', label: 'Tồn tối thiểu' }, { key: 'location', label: 'Vị trí' },
        { key: 'totalPurchased', label: 'Đã nhập' }, { key: 'totalSold', label: 'Đã bán' },
        { key: 'totalScrapped', label: 'Đã hủy' }, { key: 'shrinkage', label: 'Hao hụt (mất mát)' },
        { key: 'turnoverRate', label: 'Quay vòng' }, { key: 'nearestExpiryDate', label: 'Hạn gần nhất' },
        { key: 'daysUntilExpiry', label: 'Còn (ngày)' }
      ].map((col) => (
        <div key={col.key} className="flex items-center gap-2">
          <Checkbox
            checked={visibleColumns.includes(col.key)}
            onChange={(e) => {
              if (e.target.checked) setVisibleColumns([...visibleColumns, col.key]);
              else setVisibleColumns(visibleColumns.filter((k) => k !== col.key));
            }}
          >
            {col.label}
          </Checkbox>
        </div>
      ))}
    </div>
  );

  const extraFilters = React.useMemo(() => {
    if (activeTab === 'sales') {
      return (
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="w-[140px] h-[40px] px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
        >
          <option value="day">Theo ngày</option>
          <option value="month">Theo tháng</option>
          <option value="year">Theo năm</option>
        </select>
      );
    } else if (activeTab === 'inventory') {
      return (
        <>
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 160, height: 40 }}
            placeholder="Chọn danh mục"
            options={[
              { value: 'all', label: 'Tất cả danh mục' },
              ...uniqueCategories.map((cat) => ({ value: cat, label: cat })),
            ]}
          />
          <Select
            value={selectedExpiryStatus}
            onChange={setSelectedExpiryStatus}
            style={{ width: 170, height: 40 }}
            placeholder="Chọn hạn dùng"
            options={[
              { value: 'all', label: 'Tất cả hạn dùng' },
              { value: 'nearExpiry', label: 'Cận hạn (≤ 30 ngày)' },
              { value: 'normal', label: 'Bình thường (> 30 ngày)' },
            ]}
          />
          <Popover content={columnToggleMenu} trigger="click" placement="bottomRight">
            <Button
              style={{ height: 40, borderRadius: '0.75rem' }}
              icon={<span className="material-symbols-rounded align-middle mr-1 text-slate-500">settings</span>}
            >
              Hiển thị cột
            </Button>
          </Popover>
        </>
      );
    }
    return null;
  }, [activeTab, groupBy, selectedCategory, selectedExpiryStatus, uniqueCategories, visibleColumns]);

  const hasActiveFilters = Boolean(searchText || selectedCategory !== 'all' || selectedExpiryStatus !== 'all');

  return (
    <div className="space-y-4">
      <ReportFilters
        activeTab={activeTab}
        dateRange={dateRange}
        setDateRange={setDateRange}
        searchText={searchText}
        setSearchText={setSearchText}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setSearchText('');
          setSelectedCategory('all');
          setSelectedExpiryStatus('all');
        }}
        onExportFilteredCSV={handleExportFilteredCSV}
        canExport={canExport}
        exportingExcel={exportingExcel}
        exportingPdf={exportingPdf}
        exportingComp={exportingComp}
        onExport={handleExport}
        onExportComp={handleExportComprehensive}
        extra={extraFilters}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'sales',
            label: 'Báo cáo bán hàng',
            children: (
              <SalesReportTab
                salesData={salesData}
                loading={loading}
                debouncedSearchText={debouncedSearchText}
              />
            ),
          },
          {
            key: 'purchase',
            label: 'Báo cáo nhập hàng',
            children: (
              <PurchaseReportTab
                purchaseData={purchaseData}
                loading={loading}
                debouncedSearchText={debouncedSearchText}
                dateRange={dateRange}
                onOrderChanged={loadReport}
              />
            ),
          },
          {
            key: 'inventory',
            label: 'Báo cáo tồn kho',
            children: (
              <InventoryReportTab
                inventoryData={inventoryData}
                inventoryLots={inventoryLots}
                loading={loading || loadingLots}
                debouncedSearchText={debouncedSearchText}
                productsList={productsList}
                selectedCategory={selectedCategory}
                selectedExpiryStatus={selectedExpiryStatus}
                visibleColumns={visibleColumns}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
