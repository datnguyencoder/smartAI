import * as React from 'react';
import {
  Button,
  Modal,
  Table,
  Tabs,
  Tag,
  message as antdMessage,
  Popover,
  Select,
  Input,
  Checkbox,
  Tooltip as AntdTooltip,
  Radio,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import ReactSelect from 'react-select';
import { Card, CardHeader, StatusChip } from '@/components/ui';
import { formatMoney as money } from '@/lib/itemMapper';
import type { Product } from '@/lib/itemMapper';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';
import {
  exportComprehensiveReport,
  exportReport,
  fetchInventoryReport,
  fetchPurchaseReport,
  fetchSalesReport,
  fetchInventory,
  fetchPurchaseOrdersPaged,
  fetchPurchaseOrderById,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from '@/services/wmsApi';
import type {
  InventoryReportDto,
  PurchaseReportDto,
  SalesReportDto,
  InventoryItemDto,
  UserDto,
} from '@/types/api';
import PurchaseOrderDetailModal from '@/components/purchase/PurchaseOrderDetailModal';

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

  // States for exports loading indicators
  const [exportingExcel, setExportingExcel] = React.useState(false);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [exportingComp, setExportingComp] = React.useState(false);

  const [salesData, setSalesData] = React.useState<SalesReportDto[]>([]);
  const [purchaseData, setPurchaseData] = React.useState<PurchaseReportDto[]>([]);
  const [inventoryData, setInventoryData] = React.useState<InventoryReportDto[]>([]);

  // Slips drill-down reporting states
  const [purchaseSubView, setPurchaseSubView] = React.useState<'supplier' | 'slips'>('supplier');
  const [slipsQuery, setSlipsQuery] = React.useState({
    supplierId: undefined as number | undefined,
    supplierName: undefined as string | undefined,
    page: 1,
    pageSize: 10,
  });
  const [slipsData, setSlipsData] = React.useState<any[]>([]);
  const [slipsTotal, setSlipsTotal] = React.useState(0);
  const [slipsLoading, setSlipsLoading] = React.useState(false);
  const [viewingSlipDetails, setViewingSlipDetails] = React.useState<any | null>(null);

  // Receive / Cancel action states for report detail modal
  const [receivingOrder, setReceivingOrder] = React.useState<any | null>(null);
  const [receiveLoading, setReceiveLoading] = React.useState(false);
  const [cancelingOrder, setCancelingOrder] = React.useState<any | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  // Search & filter states
  const [searchText, setSearchText] = React.useState('');
  const [debouncedSearchText, setDebouncedSearchText] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = React.useState<string>('all');

  // Location mapping
  const [inventoryLots, setInventoryLots] = React.useState<InventoryItemDto[]>([]);
  const [loadingLots, setLoadingLots] = React.useState(false);

  // Column visibility for Inventory Table
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>([
    'itemCode',
    'itemName',
    'categoryName',
    'currentStock',
    'inventoryValue',
    'minStock',
    'location',
    'totalPurchased',
    'totalSold',
    'daysUntilExpiry',
  ]);

  // Debounce effect for search text (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchText]);

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

  // Auto reload report when filters change
  React.useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange, groupBy]);

  const loadSlipsData = React.useCallback(async () => {
    setSlipsLoading(true);
    const { from, to } = formatRange();
    try {
      const res = await fetchPurchaseOrdersPaged(
        slipsQuery.page - 1,
        slipsQuery.pageSize,
        undefined,
        undefined,
        slipsQuery.supplierId,
        undefined,
        from,
        to
      );
      setSlipsData(res.content);
      setSlipsTotal(res.totalElements);
    } catch (e) {
      antdMessage.error('Không thể tải danh sách phiếu nhập');
    } finally {
      setSlipsLoading(false);
    }
  }, [slipsQuery.page, slipsQuery.pageSize, slipsQuery.supplierId, dateRange]);

  React.useEffect(() => {
    if (activeTab === 'purchase' && purchaseSubView === 'slips') {
      loadSlipsData();
    }
  }, [purchaseSubView, slipsQuery.page, slipsQuery.pageSize, slipsQuery.supplierId, dateRange, activeTab, loadSlipsData]);

  // Fetch actual shelf/storage locations when Inventory tab is active
  React.useEffect(() => {
    if (activeTab === 'inventory') {
      setLoadingLots(true);
      fetchInventory()
        .then(setInventoryLots)
        .catch((e) => antdMessage.error('Không tải được vị trí kho: ' + (e instanceof Error ? e.message : String(e))))
        .finally(() => setLoadingLots(false));
    }
  }, [activeTab]);

  // Receive all items for a purchase order (from reports detail modal)
  const handleReceiveAll = async (order: any) => {
    setReceiveLoading(true);
    try {
      await receivePurchaseOrder(order.id);
      antdMessage.success('Nhận hàng vào kho thành công');
      setReceivingOrder(null);
      setViewingSlipDetails(null);
      // Refresh both views
      loadSlipsData();
      loadReport();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Nhận hàng thất bại');
    } finally {
      setReceiveLoading(false);
    }
  };

  // Cancel a purchase order (from reports detail modal)
  const handleCancelOrder = async (order: any) => {
    setCancelLoading(true);
    try {
      await cancelPurchaseOrder(order.id);
      antdMessage.success('Hủy phiếu thành công');
      setCancelingOrder(null);
      setViewingSlipDetails(null);
      // Refresh both views
      loadSlipsData();
      loadReport();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Hủy phiếu thất bại');
    } finally {
      setCancelLoading(false);
    }
  };

  const canExport = authUser.role === 'ROLE_ADMIN' || authUser.role === 'ROLE_MANAGER';

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!canExport) {
      antdMessage.warning('Bạn không có quyền thực hiện chức năng này.');
      return;
    }
    if (format === 'excel') setExportingExcel(true);
    else setExportingPdf(true);

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
    } finally {
      setExportingExcel(false);
      setExportingPdf(false);
    }
  };

  const handleExportComprehensive = async (format: 'pdf' | 'excel' = 'pdf') => {
    if (!canExport) {
      antdMessage.warning('Bạn không có quyền thực hiện chức năng này.');
      return;
    }
    setExportingComp(true);
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
    } finally {
      setExportingComp(false);
    }
  };

  // KPI calculations based on loaded reports
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

  // Local filtering logic for datasets
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

  const uniqueCategories = React.useMemo(() => {
    const cats = inventoryData.map((r) => r.categoryName).filter(Boolean);
    return Array.from(new Set(cats));
  }, [inventoryData]);

  // Export filtered rows to CSV (local download)
  const handleExportFilteredCSV = () => {
    if (!canExport) {
      antdMessage.warning('Bạn không có quyền thực hiện chức năng này.');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    let filename = '';

    if (activeTab === 'sales') {
      const headers = ['Kỳ báo cáo', 'Tổng đơn', 'Đơn hủy', 'Doanh thu (VNĐ)', 'Giá vốn (VNĐ)', 'Lợi nhuận gộp (VNĐ)', 'SP bán ra'];
      csvContent += headers.join(',') + '\n';
      filteredSalesData.forEach((r) => {
        csvContent += [
          `"${r.period}"`,
          r.totalOrders,
          r.cancelledOrders,
          r.totalRevenue,
          r.totalCost,
          r.grossProfit,
          r.totalItemsSold,
        ].join(',') + '\n';
      });
      filename = `sales-report-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'purchase') {
      const headers = ['Nhà cung cấp', 'Số đơn nhập', 'Tổng giá trị (VNĐ)', 'Số mặt hàng đã nhập', 'Tổng SL nhập'];
      csvContent += headers.join(',') + '\n';
      filteredPurchaseData.forEach((r) => {
        csvContent += [
          `"${r.supplierName}"`,
          r.totalOrders,
          r.totalAmount,
          r.totalItemTypes,
          r.totalQuantity,
        ].join(',') + '\n';
      });
      filename = `purchase-report-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = [
        'Mã SP', 'Tên sản phẩm', 'Danh mục', 'Tồn hiện tại', 'Giá trị tồn (VNĐ)',
        'Tồn tối thiểu', 'Vị trí', 'Đã nhập', 'Đã bán', 'Đã hủy', 'Hao hụt', 'Quay vòng', 'Hạn gần nhất', 'Còn (ngày)'
      ];
      csvContent += headers.join(',') + '\n';
      filteredInventoryData.forEach((r) => {
        const matchingProduct = productsList.find((p) => p.sku === r.itemCode);
        const cost = matchingProduct?.cost || 0;
        const minStock = matchingProduct?.minimumStock || 0;
        const matchingLots = inventoryLots.filter((lot) => lot.itemId === r.itemId || lot.itemCode === r.itemCode);
        const locationsStr = Array.from(new Set(matchingLots.map((l) => l.locationName))).join('; ');

        csvContent += [
          `"${r.itemCode}"`,
          `"${r.itemName}"`,
          `"${r.categoryName || ''}"`,
          r.currentStock,
          r.currentStock * cost,
          minStock,
          `"${locationsStr || ''}"`,
          r.totalPurchased,
          r.totalSold,
          r.totalScrapped,
          r.shrinkage,
          r.turnoverRate,
          `"${r.nearestExpiryDate || ''}"`,
          r.daysUntilExpiry ?? '',
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

  // Columns specifications
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
    {
      title: 'Top sản phẩm',
      dataIndex: 'topProducts',
      width: 220,
      sorter: (a, b) => {
        const strA = a.topProducts?.length ? a.topProducts.slice(0, 3).map((t) => t.itemName).join(', ') : '';
        const strB = b.topProducts?.length ? b.topProducts.slice(0, 3).map((t) => t.itemName).join(', ') : '';
        return strA.localeCompare(strB);
      },
      render: (tops: SalesReportDto['topProducts']) => {
        if (!tops || tops.length === 0) return '—';
        const tooltipContent = (
          <div className="space-y-1.5 p-1 max-w-[280px]">
            <div className="font-bold border-b border-white/20 pb-1 mb-1">Top sản phẩm trong kỳ:</div>
            {tops.map((t, index) => (
              <div key={t.itemId} className="text-xs">
                {index + 1}. <strong>{t.itemName}</strong> <br />
                &nbsp;&nbsp;· Đã bán: {t.quantitySold.toLocaleString('vi-VN')} <br />
                &nbsp;&nbsp;· Doanh thu: {money(t.revenue)}
              </div>
            ))}
          </div>
        );
        return (
          <AntdTooltip title={tooltipContent} color="#1e293b" overlayInnerStyle={{ borderRadius: '0.75rem' }}>
            <span className="cursor-help border-b border-dashed border-slate-400">
              {tops.slice(0, 3).map((t) => t.itemName).join(', ')}
            </span>
          </AntdTooltip>
        );
      },
    },
  ];

  const purchaseColumns: ColumnsType<PurchaseReportDto> = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => (a.supplierName || '').localeCompare(b.supplierName || ''),
    },
    {
      title: 'Số đơn nhập',
      dataIndex: 'totalOrders',
      width: 150,
      sorter: (a, b) => a.totalOrders - b.totalOrders,
      render: (v: number, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSlipsQuery({
              supplierId: record.supplierId,
              supplierName: record.supplierName,
              page: 1,
              pageSize: 10,
            });
            setPurchaseSubView('slips');
          }}
          className="p-0 font-semibold flex items-center gap-1 hover:text-indigo-600"
        >
          <span>{v.toLocaleString('vi-VN')} đơn</span>
          <span className="material-symbols-rounded text-sm">search</span>
        </Button>
      ),
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalAmount',
      width: 160,
      render: (v: number) => money(v),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Đơn giá TB',
      width: 140,
      sorter: (a, b) => a.totalAmount / (a.totalQuantity || 1) - b.totalAmount / (b.totalQuantity || 1),
      render: (_, r) => money(Math.round(r.totalAmount / (r.totalQuantity || 1))),
    },
    {
      title: 'Số mặt hàng đã nhập',
      dataIndex: 'totalItemTypes',
      width: 180,
      sorter: (a, b) => a.totalItemTypes - b.totalItemTypes,
    },
    {
      title: 'Tổng SL nhập',
      dataIndex: 'totalQuantity',
      width: 130,
      render: (v: number) => Math.round(v).toLocaleString('vi-VN'),
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
    },
  ];

  const slipsColumns = [
    { 
      title: 'Mã phiếu', 
      dataIndex: 'id', 
      width: 100, 
      render: (id: number) => `PN-${id}` 
    },
    { 
      title: 'Nhà cung cấp', 
      dataIndex: 'supplierName', 
      width: 180 
    },
    { 
      title: 'Kho nhận', 
      dataIndex: 'locationName', 
      width: 150 
    },
    { 
      title: 'Tổng tiền', 
      dataIndex: 'totalAmount', 
      width: 130, 
      align: 'right' as const,
      render: (v: number) => money(v) 
    },
    { 
      title: 'Ngày nhập', 
      dataIndex: 'purchaseDate', 
      width: 130,
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => (
        <StatusChip tone={v === 'PENDING' ? 'warning' : v === 'CANCELLED' ? 'danger' : 'success'}>
          {v === 'PENDING' ? 'Chờ nhận' : v === 'CANCELLED' ? 'Đã hủy' : 'Đã nhận'}
        </StatusChip>
      ),
    },
    {
      title: 'Hành động',
      width: 100,
      render: (_: any, row: any) => (
        <Button size="small" onClick={() => setViewingSlipDetails(row)}>
          Chi tiết
        </Button>
      ),
    },
  ];

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

  // Table summary rendering helpers
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
          <Table.Summary.Cell index={7} />
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  const renderPurchaseSummary = (pageData: readonly PurchaseReportDto[]) => {
    let totalOrd = 0;
    let totalAmt = 0;
    let totalQty = 0;

    pageData.forEach((r) => {
      totalOrd += r.totalOrders;
      totalAmt += r.totalAmount;
      totalQty += r.totalQuantity;
    });

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row className="bg-slate-50 font-bold">
          <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
          <Table.Summary.Cell index={1}>{totalOrd.toLocaleString('vi-VN')}</Table.Summary.Cell>
          <Table.Summary.Cell index={2}>{money(totalAmt)}</Table.Summary.Cell>
          <Table.Summary.Cell index={3}>—</Table.Summary.Cell>
          <Table.Summary.Cell index={4}>—</Table.Summary.Cell>
          <Table.Summary.Cell index={5}>{Math.round(totalQty).toLocaleString('vi-VN')}</Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

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

  const columnToggleMenu = (
    <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
      <div className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2 border-b pb-1">Hiển thị cột</div>
      {[
        { key: 'itemCode', label: 'Mã SP' },
        { key: 'itemName', label: 'Tên sản phẩm' },
        { key: 'categoryName', label: 'Danh mục' },
        { key: 'currentStock', label: 'Tồn hiện tại' },
        { key: 'inventoryValue', label: 'Giá trị tồn (VNĐ)' },
        { key: 'minStock', label: 'Tồn tối thiểu' },
        { key: 'location', label: 'Vị trí' },
        { key: 'totalPurchased', label: 'Đã nhập' },
        { key: 'totalSold', label: 'Đã bán' },
        { key: 'totalScrapped', label: 'Đã hủy' },
        { key: 'shrinkage', label: 'Hao hụt (mất mát)' },
        { key: 'turnoverRate', label: 'Quay vòng' },
        { key: 'nearestExpiryDate', label: 'Hạn gần nhất' },
        { key: 'daysUntilExpiry', label: 'Còn (ngày)' },
      ].map((col) => (
        <div key={col.key} className="flex items-center gap-2">
          <Checkbox
            checked={visibleColumns.includes(col.key)}
            onChange={(e) => {
              if (e.target.checked) {
                setVisibleColumns([...visibleColumns, col.key]);
              } else {
                setVisibleColumns(visibleColumns.filter((k) => k !== col.key));
              }
            }}
          >
            {col.label}
          </Checkbox>
        </div>
      ))}
    </div>
  );

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
                    style: { width: 140 },
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
                    style: { width: 140 },
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
                  width: 140,
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

          {/* Local search bar */}
          <Input
            placeholder={
              activeTab === 'sales'
                ? 'Tìm theo kỳ...'
                : activeTab === 'purchase'
                  ? 'Tìm theo nhà cung cấp...'
                  : 'Tìm theo tên, mã sản phẩm...'
            }
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220, height: 40, borderRadius: '0.75rem' }}
            allowClear
            prefix={<Search size={15} className="text-slate-400 mr-1" />}
          />

          {/* Local category dropdown for Inventory */}
          {activeTab === 'inventory' && (
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
          )}

          {/* Local expiry filter for Inventory */}
          {activeTab === 'inventory' && (
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
          )}

          {/* Column Toggle Popover for Inventory */}
          {activeTab === 'inventory' && (
            <Popover
              content={columnToggleMenu}
              trigger="click"
              placement="bottomRight"
            >
              <Button
                style={{ height: 40, borderRadius: '0.75rem' }}
                icon={<span className="material-symbols-rounded align-middle mr-1 text-slate-500">settings</span>}
              >
                Hiển thị cột
              </Button>
            </Popover>
          )}

          {/* Clear Filter button */}
          {(searchText || selectedCategory !== 'all' || selectedExpiryStatus !== 'all') && (
            <Button
              onClick={() => {
                setSearchText('');
                setSelectedCategory('all');
                setSelectedExpiryStatus('all');
              }}
              style={{ height: 40, borderRadius: '0.75rem' }}
            >
              Xóa bộ lọc
            </Button>
          )}

          <div className="flex-1" />
          <Button
            onClick={handleExportFilteredCSV}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-indigo-600">download</span>}
            className="hover:border-indigo-500 hover:text-indigo-600 font-semibold"
            style={{ height: 40, borderRadius: '0.75rem' }}
          >
            Xuất CSV (Dữ liệu lọc)
          </Button>
        </div>

        {/* Excel/PDF original export actions, guarded for Manager/Admin roles */}
        {canExport && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 justify-end">
            <span className="text-xs text-slate-400 mr-2">Xuất dữ liệu gốc từ máy chủ:</span>
            <Button
              onClick={() => handleExport('excel')}
              loading={exportingExcel}
              disabled={exportingPdf || exportingComp}
              icon={<span className="material-symbols-rounded align-middle mr-1 text-emerald-600">table_view</span>}
              className="hover:border-emerald-500 hover:text-emerald-600"
            >
              Xuất Excel (Tab hiện tại)
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              loading={exportingPdf}
              disabled={exportingExcel || exportingComp}
              icon={<span className="material-symbols-rounded align-middle mr-1 text-red-500">picture_as_pdf</span>}
              className="hover:border-red-500 hover:text-red-600"
            >
              Xuất PDF (Tab hiện tại)
            </Button>
            <Button
              onClick={() => handleExportComprehensive('excel')}
              loading={exportingComp}
              disabled={exportingExcel || exportingPdf}
              icon={<span className="material-symbols-rounded align-middle mr-1 text-emerald-600">border_all</span>}
              className="border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 font-medium"
            >
              Xuất Excel Tổng Hợp (3 Sheet)
            </Button>
            <Button
              onClick={() => handleExportComprehensive('pdf')}
              loading={exportingComp}
              disabled={exportingExcel || exportingPdf}
              icon={<span className="material-symbols-rounded align-middle mr-1 text-red-500">picture_as_pdf</span>}
              className="border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 font-medium"
            >
              In Báo Cáo Tổng Hợp (PDF)
            </Button>
          </div>
        )}
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
                  <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-lg">Chi tiết nhập hàng</h2>
                      <p className="text-xs text-slate-400">
                        {purchaseSubView === 'supplier' 
                          ? 'Thống kê tổng hợp lượng tiền chi nhập hàng theo từng đối tác.' 
                          : 'Xem danh sách chi tiết các phiếu nhập kho đã phát sinh.'}
                      </p>
                    </div>
                    <Radio.Group 
                      value={purchaseSubView} 
                      onChange={e => {
                        setPurchaseSubView(e.target.value);
                        setSlipsQuery(prev => ({ ...prev, page: 1 }));
                      }}
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="supplier">Tổng hợp theo NCC</Radio.Button>
                      <Radio.Button value="slips">Danh sách phiếu nhập</Radio.Button>
                    </Radio.Group>
                  </div>

                  <div className="px-4 py-4 space-y-4">
                    {purchaseSubView === 'supplier' ? (
                      <Table
                        loading={loading}
                        dataSource={filteredPurchaseData.map((r) => ({ ...r, key: r.supplierId }))}
                        columns={purchaseColumns}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ y: 400, x: 'max-content' }}
                        size="small"
                        summary={renderPurchaseSummary}
                      />
                    ) : (
                      <div className="space-y-4">
                        {slipsQuery.supplierId && (
                          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-rounded text-indigo-600 text-lg">filter_alt</span>
                              <span className="text-sm text-indigo-900 font-medium">
                                Đang lọc theo nhà cung cấp: <strong className="text-indigo-950 underline">{slipsQuery.supplierName}</strong>
                              </span>
                            </div>
                            <Button 
                              type="dashed" 
                              size="small" 
                              onClick={() => setSlipsQuery(prev => ({ ...prev, supplierId: undefined, supplierName: undefined, page: 1 }))}
                              className="border-indigo-300 hover:border-indigo-400 text-indigo-700 font-semibold"
                            >
                              Xóa bộ lọc NCC
                            </Button>
                          </div>
                        )}
                        
                        <Table
                          loading={slipsLoading}
                          dataSource={slipsData.map((item) => ({ ...item, key: item.id }))}
                          columns={slipsColumns}
                          pagination={{
                            current: slipsQuery.page,
                            pageSize: slipsQuery.pageSize,
                            total: slipsTotal,
                            showSizeChanger: true,
                            onChange: (p, s) => setSlipsQuery(prev => ({ ...prev, page: p, pageSize: s || 10 }))
                          }}
                          scroll={{ y: 400, x: 'max-content' }}
                          size="small"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Reusable detail modal with action buttons */}
                <PurchaseOrderDetailModal
                  open={Boolean(viewingSlipDetails)}
                  order={viewingSlipDetails}
                  onClose={() => setViewingSlipDetails(null)}
                  onReceive={(order) => setReceivingOrder(order)}
                  onCancel={(order) => setCancelingOrder(order)}
                />

                {/* Receive confirmation modal */}
                <Modal
                  open={Boolean(receivingOrder)}
                  onCancel={() => setReceivingOrder(null)}
                  title={`Nhận hàng — PN-${receivingOrder?.id}`}
                  footer={[
                    <Button key="cancel" onClick={() => setReceivingOrder(null)}>Đóng</Button>,
                    <Button
                      key="ok"
                      type="primary"
                      className="!bg-[#006c49] hover:!bg-[#005237] border-none"
                      loading={receiveLoading}
                      onClick={() => receivingOrder && handleReceiveAll(receivingOrder)}
                    >
                      Xác nhận nhận hàng
                    </Button>,
                  ]}
                >
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-500 mb-3">Xác nhận nhận toàn bộ hàng hóa trong phiếu nhập này:</p>
                    {(receivingOrder?.items ?? []).map((i: any) => (
                      <div key={i.id} className="flex justify-between border-b border-slate-100 py-2">
                        <span className="font-medium">{i.itemName}</span>
                        <span className="text-slate-500">Đặt {i.orderedQty} · Đã nhận {i.receivedQty}</span>
                      </div>
                    ))}
                  </div>
                </Modal>

                {/* Cancel confirmation modal */}
                <Modal
                  open={Boolean(cancelingOrder)}
                  onCancel={() => setCancelingOrder(null)}
                  title={`Xác nhận hủy phiếu PN-${cancelingOrder?.id}?`}
                  onOk={() => cancelingOrder && handleCancelOrder(cancelingOrder)}
                  confirmLoading={cancelLoading}
                  okButtonProps={{ danger: true }}
                  okText="Hủy phiếu"
                >
                  <p>Hành động này không thể hoàn tác. Các sản phẩm trong phiếu sẽ không được nhập vào kho.</p>
                </Modal>
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
                  <CardHeader title="Chi tiết tồn kho" description={`${filteredInventoryData.length} sản phẩm hiển thị`} />
                  <div className="px-4 pb-4">
                    <Table
                      loading={loading || loadingLots}
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
            ),
          },
        ]}
      />
    </div>
  );
}
