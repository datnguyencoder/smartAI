type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
};

export default function SmartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-pop backdrop-blur-md transition-all duration-200">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground text-slate-400">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div className="flex min-w-[170px] items-center justify-between gap-6 text-sm" key={`${entry.dataKey}-${entry.name}`}>
            <span className="flex items-center gap-2.5 text-slate-600 font-medium">
              <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: entry.color || '#10b981' }} />
              {entry.name}
            </span>
            <strong className="text-slate-900 font-bold text-base">
              {entry.dataKey === 'revenue' ? `${entry.value} triệu` : entry.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
