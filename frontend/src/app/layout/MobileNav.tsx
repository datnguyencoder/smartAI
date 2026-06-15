import { Drawer } from 'antd';
import { motion } from 'framer-motion';
import { LogOut, Store } from 'lucide-react';
import type { NavItem } from '@/app/config/navItems';
import { cn } from '@/lib/utils';
import type { PageKey } from '@/types/pages';

export function MobileNav({
  open,
  onClose,
  page,
  setPage,
  navItems: items,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  page: PageKey;
  setPage: (page: PageKey) => void;
  navItems: NavItem[];
  onLogout: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} placement="left" width={300} className="mobile-nav-drawer" styles={{ body: { padding: 0 } }}>
      <div className="min-h-full bg-navy py-4">
        <div className="mb-5 flex items-center gap-3 px-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-emerald to-indigo text-white">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">SmartMart AI</h1>
            <p className="text-xs text-slate-300">Quản lý siêu thị mini bằng AI</p>
          </div>
        </div>
        <nav className="px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setPage(item.key);
                  onClose();
                }}
                className={cn(
                  'relative mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-300 ease-out',
                  active ? 'text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobileActiveBg"
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
        <div className="mt-4 px-4">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>
    </Drawer>
  );
}
