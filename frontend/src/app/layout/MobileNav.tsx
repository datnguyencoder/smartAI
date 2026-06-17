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
      <div className="min-h-full bg-navy py-4">
        <div className="mb-4 flex items-center gap-3 px-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-emerald to-indigo text-white">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-white">SmartMart AI</h1>
            <p className="text-[11px] text-slate-400">Siêu thị mini · WMS</p>
          </div>
        </div>
        <nav className="max-h-[calc(100vh-180px)] overflow-y-auto px-2">
          <NavMenu
            groups={groups}
            page={page}
            setPage={setPage}
            onNavigate={onClose}
            layoutIdPrefix="mobile"
          />
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
