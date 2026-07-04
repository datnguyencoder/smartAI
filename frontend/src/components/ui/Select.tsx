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

  return (
    <select
      value={value ?? ''}
      onChange={handleChange}
      className={`h-[34px] px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white ${className}`}
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
