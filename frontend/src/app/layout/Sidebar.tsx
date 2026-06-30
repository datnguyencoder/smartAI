import { Store, LogOut } from 'lucide-react';
import type { NavGroup } from '@/app/config/navItems';
import { NavMenu } from '@/app/layout/NavMenu';
import { roleLabel } from '@/lib/permissions';
import type { UserDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

export function Sidebar({
  page,
  setPage,
  navGroups: groups,
  authUser,
  onLogout,
}: {
  page: PageKey;
  setPage: (page: PageKey) => void;
  navGroups: NavGroup[];
  authUser: UserDto;
  onLogout: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-[260px] flex-col overflow-hidden border-r border-slate-800 bg-navy md:flex">
      <div className="h-0.5 shrink-0 bg-gradient-to-r from-primary via-emerald to-indigo/70" />
      <div className="shrink-0 px-4 pb-4 pt-4">
        <div className="flex items-center gap-3 px-1">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald text-white shadow-[0_8px_20px_rgba(0,108,73,0.35)] ring-1 ring-white/10">
          <Store size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight text-white">SmartMart AI</h1>
          <p className="truncate text-xs text-slate-400">Quản lý siêu thị mini</p>
        </div>
        </div>
      </div>
      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        <NavMenu groups={groups} page={page} setPage={setPage} layoutIdPrefix="sidebar" />
      </nav>
      <div className="mx-3 mb-4 mt-3 shrink-0 rounded-xl border border-slate-700/80 bg-slate-800/60 p-3 ring-1 ring-emerald-500/10">
        <p className="mb-1 truncate px-1 text-sm font-medium text-slate-300">
          {authUser.fullName ?? authUser.username}
        </p>
        <p className="mb-3 truncate px-1 text-xs text-slate-500">{roleLabel(authUser.role)}</p>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          onClick={onLogout}
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
