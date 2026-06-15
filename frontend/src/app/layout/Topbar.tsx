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
    <header className="sticky top-0 z-20 border-b border-line bg-[#f8fafc]/88 backdrop-blur">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Button className="md:hidden" icon={<Menu size={17} />} onClick={openMobileNav} aria-label="Mở menu" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted">
            <Home size={14} /> SmartMart AI <ChevronRight size={14} /> {title}
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
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
