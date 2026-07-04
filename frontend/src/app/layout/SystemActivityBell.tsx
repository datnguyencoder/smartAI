import { Bell } from 'lucide-react';
import * as React from 'react';
import { API_BASE_URL } from '@/lib/env';
import { cn } from '@/lib/utils';
import { fetchRecentAuditLogs } from '@/services/wmsApi';
import type { AuditLogDto, UserDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

function formatActivityTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export function SystemActivityBell({
  authUser,
  setPage,
}: {
  authUser: UserDto;
  setPage: (page: PageKey) => void;
}) {
  const [activities, setActivities] = React.useState<AuditLogDto[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const storageKey = `smartmart_activity_read_at:${authUser.id}`;
  const [readAt, setReadAt] = React.useState(() => localStorage.getItem(storageKey) ?? '');

  const loadActivities = React.useCallback(async () => {
    try {
      setActivities(await fetchRecentAuditLogs(20));
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadActivities();
    const timer = window.setInterval(loadActivities, 15_000);
    const token = sessionStorage.getItem('smartmart_token');
    let es: EventSource | null = null;
    if (token) {
      es = new EventSource(`${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);
      es.addEventListener('inventory-alerts', () => loadActivities());
    }
    return () => {
      window.clearInterval(timer);
      es?.close();
    };
  }, [loadActivities]);

  const unreadCount = activities.filter((activity) => !readAt || activity.createdAt > readAt).length;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && activities[0]) {
      const latest = activities[0].createdAt;
      localStorage.setItem(storageKey, latest);
      setReadAt(latest);
    }
  };

  const content = (
    <div className="w-[360px] max-w-[calc(100vw-32px)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-3">
        <div>
          <strong className="text-sm text-ink">Hoạt động hệ thống</strong>
          <p className="text-xs text-muted">Tự động cập nhật mỗi 15 giây</p>
        </div>
        <button 
          type="button"
          onClick={() => setPage('inventory-alerts')}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Cảnh báo kho
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto py-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Đang tải hoạt động...</p>
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Chưa có hoạt động mới.</p>
        ) : (
          activities.map((activity) => (
            <div className="flex gap-3 border-b border-slate-100 px-1 py-3 last:border-0" key={activity.id}>
              <span
                className={cn(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                  activity.action.includes('CANCEL') || activity.action.includes('LOCK')
                    ? 'bg-red-500'
                    : activity.action.includes('PURCHASE') || activity.action.includes('ITEM')
                      ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{activity.detail || activity.action}</p>
                <p className="mt-1 text-xs text-muted">
                  {activity.username} · {formatActivityTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => handleOpenChange(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Xem hoạt động hệ thống"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => handleOpenChange(false)} 
            aria-hidden="true" 
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
            {content}
          </div>
        </>
      )}
    </div>
  );
}
