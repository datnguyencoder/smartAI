import { motion } from 'framer-motion';
import type { NavGroup } from '@/app/config/navItems';
import { cn } from '@/lib/utils';
import type { PageKey } from '@/types/pages';

type Props = {
  groups: NavGroup[];
  page: PageKey;
  setPage: (page: PageKey) => void;
  onNavigate?: () => void;
  layoutIdPrefix?: string;
};

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="mb-1 mt-4 flex items-center gap-2 px-3 first:mt-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="h-px flex-1 bg-slate-700/80" />
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-0.5 mt-2 px-3 pl-5 text-[11px] font-semibold text-slate-500">{label}</p>
  );
}

function NavLink({
  item,
  active,
  onClick,
  layoutIdPrefix,
}: {
  item: NavGroup['items'][number];
  active: boolean;
  onClick: () => void;
  layoutIdPrefix: string;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
        active ? 'text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
      )}
    >
      {active && (
        <motion.div
          layoutId={`${layoutIdPrefix}ActiveBg`}
          className="absolute inset-0 rounded-lg border-l-[3px] border-emerald bg-primary/90 shadow-[0_2px_12px_rgba(16,185,129,0.15)]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex min-w-0 items-center gap-3">
        <Icon size={18} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </span>
    </button>
  );
}

/** Menu nhóm — luôn hiển thị đủ mục con, không thu gọn accordion. */
export function NavMenu({ groups, page, setPage, onNavigate, layoutIdPrefix = 'sidebar' }: Props) {
  const navigate = (key: PageKey) => {
    setPage(key);
    onNavigate?.();
  };

  return (
    <div className="pb-2">
      {groups.map((group) => (
        <section key={group.id}>
          <GroupHeader label={group.label} />
          {group.items.map((item) => (
            <div key={item.key}>
              {item.section ? <SectionLabel label={item.section} /> : null}
              <NavLink
                item={item}
                active={page === item.key}
                onClick={() => navigate(item.key)}
                layoutIdPrefix={layoutIdPrefix}
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
