import * as React from 'react';
import { Button, Input } from 'antd';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';

type ReportFiltersProps = {
  activeTab: string;
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  setDateRange: (range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onExportFilteredCSV: () => void;
  canExport: boolean;
  exportingExcel: boolean;
  exportingPdf: boolean;
  exportingComp: boolean;
  onExport: (format: 'excel' | 'pdf') => void;
  onExportComp: (format: 'excel' | 'pdf') => void;
  extra?: React.ReactNode;
};

export function ReportFilters({
  activeTab,
  dateRange,
  setDateRange,
  searchText,
  setSearchText,
  onClearFilters,
  hasActiveFilters,
  onExportFilteredCSV,
  canExport,
  exportingExcel,
  exportingPdf,
  exportingComp,
  onExport,
  onExportComp,
  extra,
}: ReportFiltersProps) {
  const [exportOption, setExportOption] = React.useState('excel_current');

  const handleExport = () => {
    switch (exportOption) {
      case 'excel_current':
        onExport('excel');
        break;
      case 'pdf_current':
        onExport('pdf');
        break;
      case 'excel_all':
        onExportComp('excel');
        break;
      case 'pdf_all':
        onExportComp('pdf');
        break;
    }
  };

  const isExporting = exportingExcel || exportingPdf || exportingComp;

  return (
    <div className="p-4 bg-white rounded-xl space-y-3 mb-4 shadow-sm border border-slate-100">
      <div className="flex flex-wrap items-center gap-3">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="flex flex-wrap items-center gap-2">
            <MuiDatePicker
              label="Từ ngày"
              format="DD/MM/YYYY"
              value={dateRange && dateRange[0] ? dateRange[0] : null}
              onChange={(val) => setDateRange([val, dateRange ? dateRange[1] : null])}
              slotProps={{
                textField: {
                  size: 'small',
                  style: { width: 140 },
                  onKeyDown: (e) => e.preventDefault(),
                  slotProps: { htmlInput: { readOnly: true } },
                },
                popper: { style: { zIndex: 9999 } },
              }}
            />
            <span className="text-slate-400">—</span>
            <MuiDatePicker
              label="Đến ngày"
              format="DD/MM/YYYY"
              value={dateRange && dateRange[1] ? dateRange[1] : null}
              onChange={(val) => setDateRange([dateRange ? dateRange[0] : null, val])}
              slotProps={{
                textField: {
                  size: 'small',
                  style: { width: 140 },
                  onKeyDown: (e) => e.preventDefault(),
                  slotProps: { htmlInput: { readOnly: true } },
                },
                popper: { style: { zIndex: 9999 } },
              }}
            />
          </div>
        </LocalizationProvider>

        {extra}

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

        {hasActiveFilters && (
          <Button onClick={onClearFilters} style={{ height: 40, borderRadius: '0.75rem' }}>
            Xóa bộ lọc
          </Button>
        )}

        <div className="flex-1" />
        <Button
          onClick={onExportFilteredCSV}
          className="hover:border-indigo-500 hover:text-indigo-600 font-semibold"
          style={{ height: 40, borderRadius: '0.75rem' }}
        >
          Xuất CSV (Dữ liệu lọc)
        </Button>
      </div>

      {canExport && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 justify-end">
          <span className="text-xs text-slate-400 mr-2">Xuất dữ liệu gốc từ máy chủ:</span>
          <select
            value={exportOption}
            onChange={(e) => setExportOption(e.target.value)}
            disabled={isExporting}
            className="h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="excel_current">Xuất Excel (Tab hiện tại)</option>
            <option value="pdf_current">Xuất PDF (Tab hiện tại)</option>
            <option value="excel_all">Xuất Excel Tổng Hợp (4 Sheet)</option>
            <option value="pdf_all">In Báo Cáo Tổng Hợp (PDF)</option>
          </select>
          <Button
            onClick={handleExport}
            loading={isExporting}
            type="primary"
            className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
            style={{ height: 40, borderRadius: '0.75rem' }}
          >
            Tải xuống
          </Button>
        </div>
      )}
    </div>
  );
}
