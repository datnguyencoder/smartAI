import { Bell, MoreHorizontal, User, Package, ShoppingCart, FileText, AlertTriangle } from 'lucide-react';
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
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
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
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread'>('all');
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
    if (!nextOpen && activities[0]) {
      // Mark as read when closing the dropdown, so dots remain while it is open.
      if (!readAt || activities[0].createdAt > readAt) {
        const latest = activities[0].createdAt;
        localStorage.setItem(storageKey, latest);
        setReadAt(latest);
      }
    }
  };

  const handleNotificationClick = (activity: AuditLogDto) => {
    if (activity.entityType === 'ORDER') {
      setPage('invoices');
    } else if (activity.entityType === 'PURCHASE_ORDER') {
      setPage('import-slips');
    } else if (activity.action?.includes('STOCK') || activity.action?.includes('INVENTORY')) {
      setPage('inventory-logs');
    } else if (activity.action?.includes('ITEM') || activity.entityType === 'ITEM') {
      setPage('products');
    } else {
      setPage('dashboard');
    }
    handleOpenChange(false);
  };

  const filteredActivities = activities.filter(a => activeTab === 'all' || (!readAt || a.createdAt > readAt));

  const content = (
    <div className="w-[360px] max-w-[calc(100vw-32px)] bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-2xl font-bold text-slate-900">Thông báo</h2>
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      <div className="px-4 pb-2 flex gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={cn("px-3 py-1.5 rounded-full text-[15px] font-semibold transition-colors", 
            activeTab === 'all' ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-100 text-slate-700"
          )}
        >
          Tất cả
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={cn("px-3 py-1.5 rounded-full text-[15px] font-semibold transition-colors", 
            activeTab === 'unread' ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-100 text-slate-700"
          )}
        >
          Chưa đọc
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px]">
        {loading ? (
          <p className="py-8 text-center text-[15px] text-muted">Đang tải...</p>
        ) : filteredActivities.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-muted">Chưa có thông báo.</p>
        ) : (
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-[17px] font-semibold text-slate-900">Mới</span>
              <button 
                onClick={() => { setPage('audit-logs'); handleOpenChange(false); }}
                className="text-[15px] text-indigo-600 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors"
              >
                Xem tất cả
              </button>
            </div>
            {filteredActivities.map((activity) => {
              const isUnread = !readAt || activity.createdAt > readAt;
              let Icon = User;
              let iconColor = "bg-slate-100 text-slate-600";
              
              if (activity.entityType === 'ORDER') {
                Icon = ShoppingCart;
                iconColor = "bg-blue-500 text-white";
              } else if (activity.entityType === 'PURCHASE_ORDER') {
                Icon = FileText;
                iconColor = "bg-emerald-500 text-white";
              } else if (activity.action?.includes('STOCK')) {
                Icon = AlertTriangle;
                iconColor = "bg-red-500 text-white";
              }

              // Try to format detail string (e.g., "Tạo hóa đơn: HD-1234") into something nicer
              let detailText = activity.detail || activity.action;
              let isSpecialFormat = false;
              let actionPart = '';
              let idPart = '';
              
              if (detailText.includes(': ')) {
                const parts = detailText.split(': ');
                actionPart = parts[0];
                idPart = parts.slice(1).join(': ');
                isSpecialFormat = true;
              }

              return (
                <div 
                  key={activity.id}
                  onClick={() => handleNotificationClick(activity)}
                  className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors relative"
                >
                  <div className="relative shrink-0">
                    <div className="w-[56px] h-[56px] rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <User size={30} className="text-slate-500" />
                    </div>
                    <div className={cn("absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-[3px] border-white flex items-center justify-center", iconColor)}>
                      <Icon size={14} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-[15px] leading-snug text-slate-900">
                      <strong>{activity.username}</strong>{' '}
                      {isSpecialFormat ? (
                        <>
                          đã {actionPart.toLowerCase()}{' '}
                          <strong>{idPart}</strong>
                        </>
                      ) : (
                        <span>đã thực hiện {detailText.toLowerCase()}</span>
                      )}
                    </p>
                    <p className={cn("text-[13px] mt-1 font-semibold", isUnread ? "text-blue-600" : "text-slate-500")}>
                      {formatActivityTime(activity.createdAt)}
                    </p>
                  </div>
                  
                  {isUnread && (
                    <div className="absolute right-4 w-3 h-3 bg-blue-600 rounded-full shrink-0 shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => handleOpenChange(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none"
        aria-label="Xem hoạt động hệ thống"
      >
        <Bell size={20} className="text-slate-900" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-bold text-white bg-[#e41e3f] rounded-full translate-x-1 -translate-y-1">
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
          <div className="absolute right-0 top-full mt-2 z-50">
            {content}
          </div>
        </>
      )}
    </div>
  );
}

