import { motion } from 'framer-motion';
import { LogOut, Sparkles, Store } from 'lucide-react';
import type { NavItem } from '@/app/config/navItems';
import { UiButton } from '@/components/ui';
import { roleLabel } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import type { UserDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

export function Sidebar({
  page,
  setPage,
  navItems: items,
  authUser,
  onLogout,
}: {
  page: PageKey;
  setPage: (page: PageKey) => void;
  navItems: NavItem[];
  authUser: UserDto;
  onLogout: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-slate-800 bg-navy py-4 md:flex">
      <div className="mb-7 flex items-center gap-3 px-6">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-emerald to-indigo text-white shadow-pop">
          <Store size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-white">SmartMart AI</h1>
          <p className="text-xs text-slate-300">Quản lý siêu thị mini bằng AI</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={cn(
                'relative mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-300 ease-out',
                active ? 'text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebarActiveBg"
                  className="absolute inset-0 rounded-lg border-l-4 border-emerald bg-primary/90 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon size={18} className={cn('transition-transform duration-300', active && 'scale-110')} />
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mx-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        <UiButton variant="secondary" className="mb-4 w-full bg-indigo">
          <Sparkles size={16} /> Nâng cấp AI Pro
        </UiButton>
        <p className="mb-2 px-2 text-xs text-slate-400 truncate">
          {authUser.fullName ?? authUser.username} · {roleLabel(authUser.role)}
        </p>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={onLogout}
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
