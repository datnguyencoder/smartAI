import { Image } from 'antd';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/mediaUrl';

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
};

export function ProductThumbnail({ name, imageUrl, size = 48, className }: Props) {
  const src = resolveMediaUrl(imageUrl);
  const initial = (name.trim()[0] ?? '?').toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        preview={false}
        className={cn('rounded-lg object-cover bg-slate-100', className)}
        style={{ width: size, height: size }}
        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23e2e8f0' width='64' height='64'/%3E%3C/svg%3E"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-emerald-50 text-primary font-bold shrink-0',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.35) }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function ProductThumbnailIcon({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-lg bg-slate-100 text-slate-400', className)}
      style={{ width: size, height: size }}
    >
      <Package size={size * 0.45} />
    </div>
  );
}
