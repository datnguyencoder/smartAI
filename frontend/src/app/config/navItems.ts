import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileClock,
  FileInput,
  FileText,
  FolderClosed,
  LayoutDashboard,
  MonitorPlay,
  Package,
  Ruler,
  PlusCircle,
  ScrollText,
  Settings,
  Trash2,
  Users,
  UsersRound,
  Warehouse,
  BadgePercent,
  Inbox,
  RotateCcw,
  WalletCards,
  Printer,
  CalendarX,
  Tag,
  Globe,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import {
  CommentOutlined,
  GiftOutlined,
  LineChartOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { antdNavIcon } from '@/lib/antdNavIcon';
import { canAccessPage } from '@/lib/permissions';
import type { LucideIcon } from 'lucide-react';
import type { PageKey } from '@/types/pages';

export type NavIcon = LucideIcon | ReturnType<typeof antdNavIcon>;

export type NavItem = {
  key: PageKey;
  label: string;
  icon: NavIcon;
  /** Tiêu đề phụ trong nhóm (vd. Nhập hàng / Tồn kho). */
  section?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  flat?: boolean;
};

/** Các trang đã gỡ — lọc khi filter nav (tránh bundle/Docker cũ còn cache). */
const REMOVED_NAV_PAGES = new Set<string>(['scrap-create']);

/** 5 nhóm + 1 mục phẳng — gọn nhất, vẫn đủ 28 trang. */
export const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    flat: true,
    items: [{ key: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard }],
  },
  {
    id: 'apps',
    label: 'Ứng dụng',
    flat: true,
    items: [{ key: 'chat', label: 'Tin nhắn', icon: MessageSquare }],
  },
  {
    id: 'sales',
    label: 'Bán hàng',
    items: [
      { key: 'pos', label: 'Quầy POS', icon: MonitorPlay },
      { key: 'customers', label: 'Khách hàng', icon: Users },
      { key: 'customer-debts', label: 'Công nợ khách', icon: FileClock },
      { key: 'invoices', label: 'Hóa đơn', icon: FileInput },
      { key: 'return-orders', label: 'Trả hàng', icon: RotateCcw },
      { key: 'quotations', label: 'Báo giá', icon: FileText },
      { key: 'online-orders', label: 'Đơn online', icon: Globe },
      { key: 'shifts', label: 'Ca làm việc', icon: Clock },
    ],
  },
  {
    id: 'catalog',
    label: 'Danh mục',
    items: [
      { key: 'products', label: 'Sản phẩm', icon: Boxes },
      { key: 'categories', label: 'Loại hàng', icon: FolderClosed },
      { key: 'brands', label: 'Thương hiệu', icon: Tag },
      { key: 'suppliers', label: 'Nhà cung cấp', icon: Building2 },
      { key: 'locations', label: 'Vị trí kho', icon: Warehouse },
      { key: 'uoms', label: 'Đơn vị tính', icon: Ruler },
    ],
  },
  {
    id: 'warehouse',
    label: 'Quản lý kho',
    items: [
      { key: 'import-create', label: 'Tạo phiếu nhập', icon: PlusCircle, section: 'Nhập hàng' },
      { key: 'import-slips', label: 'Phiếu nhập kho', icon: ClipboardCheck },
      { key: 'purchase-suggestions', label: 'Gợi ý nhập hàng', icon: antdNavIcon(ShoppingCartOutlined) },
      { key: 'inventory', label: 'Tồn kho', icon: Inbox, section: 'Vận hành kho' },
      { key: 'barcode-print', label: 'In mã vạch', icon: Printer },
      { key: 'expired-products', label: 'Hàng cận hạn', icon: CalendarX },
      { key: 'item-lots', label: 'Lô hàng', icon: Package },
      { key: 'stocktake', label: 'Kiểm kê', icon: ClipboardList },
      { key: 'scrap-orders', label: 'Loại bỏ', icon: Trash2 },
      { key: 'inventory-alerts', label: 'Cảnh báo', icon: AlertTriangle },
      { key: 'inventory-logs', label: 'Biến động kho', icon: ScrollText },
    ],
  },
  {
    id: 'insights',
    label: 'AI & báo cáo',
    items: [
      { key: 'ai-forecast', label: 'Dự báo', icon: antdNavIcon(LineChartOutlined), section: 'AI' },
      { key: 'expiry-risk', label: 'Rủi ro HSD', icon: CalendarClock },
      { key: 'promotions', label: 'Đề xuất KM', icon: antdNavIcon(GiftOutlined) },
      { key: 'promotion-manage', label: 'Mã KM', icon: BadgePercent },
      { key: 'discount-plans', label: 'Kế hoạch giảm giá', icon: BadgePercent },
      { key: 'gift-cards', label: 'Thẻ quà tặng', icon: CreditCard },
      { key: 'ai-assistant', label: 'Trợ lý AI', icon: antdNavIcon(CommentOutlined) },
      { key: 'reports', label: 'Báo cáo', icon: BarChart3, section: 'Báo cáo' },
      { key: 'finance', label: 'Thu chi', icon: WalletCards },
    ],
  },
  {
    id: 'admin',
    label: 'Hệ thống',
    items: [
      { key: 'users', label: 'Người dùng', icon: UsersRound },
      { key: 'settings', label: 'Cài đặt', icon: Settings },
      { key: 'audit-logs', label: 'Nhật ký', icon: FileClock },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function filterNavGroups(role: string | undefined): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !REMOVED_NAV_PAGES.has(item.key) && canAccessPage(role, item.key)
      ),
    }))
    .filter((group) => group.items.length > 0)
    .map((group) => {
      if (group.flat || group.items.length === 1) return group;
      // Gỡ section header nếu mục đầu nhóm bị ẩn theo role
      const cleaned: NavItem[] = [];
      let lastSection: string | undefined;
      for (const item of group.items) {
        const section = item.section && item.section !== lastSection ? item.section : undefined;
        if (section) lastSection = item.section;
        cleaned.push(section ? { ...item, section } : { ...item, section: undefined });
      }
      return { ...group, items: cleaned };
    });
}

export function findNavGroupId(page: PageKey): string | undefined {
  return navGroups.find((g) => g.items.some((i) => i.key === page))?.id;
}
