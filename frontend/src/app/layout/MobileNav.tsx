import { Drawer } from 'antd';
import { LogOut, Store } from 'lucide-react';
import type { NavGroup } from '@/app/config/navItems';
import { NavMenu } from '@/app/layout/NavMenu';
import type { PageKey } from '@/types/pages';

export function MobileNav({
  open,
  onClose,
  page,
  setPage,
  navGroups: groups,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  page: PageKey;
  setPage: (page: PageKey) => void;
  navGroups: NavGroup[];
  onLogout: () => void;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      width={288}
      className="mobile-nav-drawer"
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex h-full min-h-[100dvh] flex-col overflow-hidden bg-navy">
        <div className="shrink-0 px-5 pb-4 pt-4">
          <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald text-white shadow-[0_8px_20px_rgba(0,108,73,0.35)]">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-white">SmartMart AI</h1>
            <p className="text-[11px] text-slate-400">Siêu thị mini · WMS</p>
          </div>
          </div>
        </div>
        <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
          <NavMenu
            groups={groups}
            page={page}
            setPage={setPage}
            onNavigate={onClose}
            layoutIdPrefix="mobile"
          />
        </nav>
        <div className="shrink-0 px-4 pb-4 pt-3">
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
