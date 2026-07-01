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
      <div
        className={cn('shrink-0 overflow-hidden rounded-lg bg-slate-100', className)}
        style={{ width: size, height: size }}
        title={name}
      >
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            const img = event.currentTarget;
            img.style.display = 'none';
            img.parentElement?.classList.add('product-thumb-fallback');
            img.parentElement?.setAttribute('data-initial', initial);
          }}
        />
      </div>
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
