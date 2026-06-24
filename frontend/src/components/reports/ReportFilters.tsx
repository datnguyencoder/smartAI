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
          icon={<span className="material-symbols-rounded align-middle mr-1 text-indigo-600">download</span>}
          className="hover:border-indigo-500 hover:text-indigo-600 font-semibold"
          style={{ height: 40, borderRadius: '0.75rem' }}
        >
          Xuất CSV (Dữ liệu lọc)
        </Button>
      </div>

      {canExport && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 justify-end">
          <span className="text-xs text-slate-400 mr-2">Xuất dữ liệu gốc từ máy chủ:</span>
          <Button
            onClick={() => onExport('excel')}
            loading={exportingExcel}
            disabled={exportingPdf || exportingComp}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-emerald-600">table_view</span>}
            className="hover:border-emerald-500 hover:text-emerald-600"
          >
            Xuất Excel (Tab hiện tại)
          </Button>
          <Button
            onClick={() => onExport('pdf')}
            loading={exportingPdf}
            disabled={exportingExcel || exportingComp}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-red-500">picture_as_pdf</span>}
            className="hover:border-red-500 hover:text-red-600"
          >
            Xuất PDF (Tab hiện tại)
          </Button>
          <Button
            onClick={() => onExportComp('excel')}
            loading={exportingComp}
            disabled={exportingExcel || exportingPdf}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-emerald-600">border_all</span>}
            className="border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 font-medium"
          >
            Xuất Excel Tổng Hợp (3 Sheet)
          </Button>
          <Button
            onClick={() => onExportComp('pdf')}
            loading={exportingComp}
            disabled={exportingExcel || exportingPdf}
            icon={<span className="material-symbols-rounded align-middle mr-1 text-red-500">picture_as_pdf</span>}
            className="border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 font-medium"
          >
            In Báo Cáo Tổng Hợp (PDF)
          </Button>
        </div>
      )}
    </div>
  );
}
