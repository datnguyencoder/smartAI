import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn('rounded-2xl border border-line bg-white shadow-card transition duration-300 ease-out', className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pb-3 pt-5', className)}>
      <div>
        <h2 className="text-[18px] font-semibold leading-6 text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function UiButton({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald/40 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-white hover:bg-emerald',
        variant === 'secondary' && 'bg-indigo text-white hover:bg-[#5b5eea]',
        variant === 'ghost' && 'border border-line bg-white text-ink hover:bg-slate-50',
        variant === 'danger' && 'bg-danger text-white hover:bg-red-700',
        className,
      )}
      {...props}
    />
  );
}

export function StatusChip({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'ai' | 'neutral'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
        tone === 'success' && 'bg-emerald-50 text-emerald-700',
        tone === 'warning' && 'bg-amber-50 text-amber-700',
        tone === 'danger' && 'bg-red-50 text-red-700',
        tone === 'ai' && 'bg-indigo-50 text-indigo',
        tone === 'neutral' && 'bg-slate-100 text-slate-600',
      )}
    >
      {children}
    </span>
  );
}
