import * as React from 'react';
import { message as antdMessage } from 'antd';
import dayjs from 'dayjs';
import { exportReport, exportComprehensiveReport } from '@/services/wmsApi';

type UseReportExportProps = {
  canExport: boolean;
  activeTab: string;
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  groupBy?: string; // used for sales
};

export function useReportExport({ canExport, activeTab, dateRange, groupBy }: UseReportExportProps) {
  const [exportingExcel, setExportingExcel] = React.useState(false);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [exportingComp, setExportingComp] = React.useState(false);

  const formatRange = (): { from?: string; to?: string } => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return {};
    return {
      from: dateRange[0].format('YYYY-MM-DD'),
      to: dateRange[1].format('YYYY-MM-DD'),
    };
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!canExport) {
      antdMessage.warning('Bạn không có quyền thực hiện chức năng này.');
      return;
    }
    if (format === 'excel') setExportingExcel(true);
    else setExportingPdf(true);

    try {
      const { from, to } = formatRange();
      const type = activeTab as 'sales' | 'purchase' | 'inventory' | 'nxt' | 'best-sellers' | 'customer-due' | 'supplier-due' | 'product-expiry' | 'cash-flow' | 'profit-loss';
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

  return {
    exportingExcel,
    exportingPdf,
    exportingComp,
    handleExport,
    handleExportComprehensive,
  };
}
