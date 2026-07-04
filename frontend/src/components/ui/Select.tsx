import React from 'react';

type Option = { label: React.ReactNode; value: string | number };

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Option[];
  allowClear?: boolean;
  value?: any;
  onChange?: (value: any) => void;
  className?: string;
  [key: string]: any;
}

export function Select({
  options,
  allowClear,
  placeholder,
  value,
  onChange,
  className = '',
  children,
  showSearch,
  optionFilterProp,
  dropdownRender,
  getPopupContainer,
  filterOption,
  optionRender,
  mode,
  ...props
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '') {
      if (onChange) onChange(undefined);
      return;
    }
    
    // Try to infer correct type
    let finalVal: string | number = val;
    if (options) {
      const opt = options.find((o) => String(o.value) === val);
      if (opt) finalVal = opt.value;
    } else if (!isNaN(Number(val))) {
      // Very basic fallback if no options provided
      finalVal = Number(val);
    }

    if (onChange) onChange(finalVal);
  };

  const isError = props['aria-invalid'] === true || props['aria-invalid'] === 'true' || props['status'] === 'error';
  const borderClass = isError 
    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-100 text-red-700' 
    : 'border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100';

  return (
    <select
      value={value ?? ''}
      onChange={handleChange}
      className={`h-[34px] px-3 text-sm border rounded-md focus:outline-none bg-white transition-all ${borderClass} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled hidden={!allowClear}>
          {placeholder}
        </option>
      )}
      {allowClear && !placeholder && (
        <option value="">-- Bỏ chọn --</option>
      )}
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
}

Select.Option = ({ value, children }: any) => {
  return <option value={value}>{children}</option>;
};
