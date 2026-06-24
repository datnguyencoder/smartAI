import React from 'react';

export type StatCardProps = {
  label: string;
  value: string | number;
  color?: string;
};

export function StatCard({ label, value, color = 'text-slate-800' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
