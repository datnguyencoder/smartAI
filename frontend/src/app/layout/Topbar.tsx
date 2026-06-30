import { Button, Input } from 'antd';
import { ChevronRight, Home, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import { SystemActivityBell } from '@/app/layout/SystemActivityBell';
import { canQuickCreate, roleLabel } from '@/lib/permissions';
import type { UserDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

export function Topbar({
  title,
  description,
  authUser,
  page,
  setModalOpen,
  openMobileNav,
  globalSearch,
  setGlobalSearch,
  onToggleTheme,
  themeMode,
  setPage,
}: {
  title: string;
  description: string;
  authUser: UserDto;
  page: PageKey;
  setPage: (page: PageKey) => void;
  setModalOpen: (open: boolean) => void;
  openMobileNav: () => void;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  onToggleTheme: () => void;
  themeMode: 'light' | 'dark';
}) {
  const showQuickCreate = canQuickCreate(authUser.role, page);
  return (
    <header className="z-20 shrink-0 border-b border-line/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Button className="md:hidden" icon={<Menu size={17} />} onClick={openMobileNav} aria-label="Mở menu" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Home size={14} className="text-primary" /> SmartMart AI <ChevronRight size={14} className="text-slate-300" /> <span className="text-slate-600">{title}</span>
          </div>
          <h1 className="smart-card-header text-[22px] font-bold tracking-tight text-ink sm:text-[24px]">{title}</h1>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <div className="hidden min-w-[480px] items-center justify-end gap-3 lg:flex">
          <Input
            prefix={<Search size={16} />}
            placeholder="Tìm kiếm sản phẩm, hóa đơn, cảnh báo..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            allowClear
          />
          <Button
            icon={themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            onClick={onToggleTheme}
            aria-label="Đổi giao diện"
          />
          <SystemActivityBell authUser={authUser} setPage={setPage} />
          {showQuickCreate && (
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Tạo nhanh
            </Button>
          )}
          <span className="text-xs font-medium text-muted hidden xl:inline">{roleLabel(authUser.role)}</span>
        </div>
        {showQuickCreate && (
          <Button className="lg:hidden" type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            Tạo
          </Button>
        )}
      </div>
    </header>
  );
}
