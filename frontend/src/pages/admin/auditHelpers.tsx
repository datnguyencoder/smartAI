import * as React from 'react';

export function parseAuditData(value?: string | null) {
  if (!value || value === '-') return [];

  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [key, ...rest] = part.split('=');
      return {
        key: key.trim(),
        value: rest.join('=').trim(),
      };
    })
    .filter((item) => item.key);
}

export function auditFieldLabel(key: string) {
  const labels: Record<string, string> = {
    username: 'Tên đăng nhập',
    email: 'Email',
    fullName: 'Họ tên',
    role: 'Vai trò',
    status: 'Trạng thái',
    itemCode: 'Mã sản phẩm',
    itemName: 'Tên sản phẩm',
    itemType: 'Loại sản phẩm',
    categoryId: 'Danh mục',
    supplierName: 'Nhà cung cấp',
    contactPerson: 'Người liên hệ',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
    locationName: 'Tên kho',
    locationType: 'Loại kho',
    parentId: 'Phân cấp cha',
    uomName: 'Đơn vị tính',
    conversionRatio: 'Tỷ lệ quy đổi',
    baseUnit: 'Đơn vị cơ sở',
    costPrice: 'Giá nhập',
    sellingPrice: 'Giá bán',
    minimumStock: 'Tồn tối thiểu',
    hasExpiry: 'Có hạn sử dụng',
    active: 'Hoạt động',
    orderCode: 'Mã hóa đơn',
    customerName: 'Khách hàng',
    paymentMethod: 'Thanh toán',
    discountAmount: 'Giảm giá',
    totalAmount: 'Tổng tiền',
    loyaltyPoints: 'Điểm tích lÅ©y',
    tier: 'Hạng thành viên',
    alertType: 'Loại cảnh báo',
    severity: 'Mức độ',
    resolved: 'Đã xử lý',
    itemCount: 'Số mặt hàng',
    note: 'Ghi chú',
    reason: 'Lý do',
    name: 'Tên khuyến mãi',
    code: 'Mã khuyến mãi',
    type: 'Loại khuyến mãi',
    value: 'Giá trị',
    minOrder: 'Đơn hàng tối thiểu',
    startDate: 'Ngày bắt đầu',
    endDate: 'Ngày kết thúc',
  };

  return labels[key] ?? key;
}

export function formatAuditValue(value: string) {
  if (!value) return '-';

  const roleLabels: Record<string, string> = {
    ROLE_ADMIN: 'Admin',
    ROLE_MANAGER: 'Quản lý',
    ROLE_STAFF: 'Thu ngân',
    ROLE_WAREHOUSE: 'Kho',
    ROLE_ANALYST: 'Phân tích',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    LOCKED: 'Đã khóa',
    INACTIVE: 'Không hoạt động',
  };

  return roleLabels[value] ?? statusLabels[value] ?? value;
}

export function formatAuditModule(entityType?: string | null) {
  const labels: Record<string, string> = {
    AUTH: 'Đăng nhập và bảo mật',
    USER: 'Quản lý người dùng',
    CUSTOMER: 'Khách hàng',
    CATEGORY: 'Danh mục',
    ITEM: 'Sản phẩm',
    SUPPLIER: 'Nhà cung cấp',
    LOCATION: 'Kho và vị trí',
    UOM: 'Đơn vị tính',
    ORDER: 'Bán hàng và hóa đơn',
    PURCHASE_ORDER: 'Nhập hàng',
    SCRAP_ORDER: 'Hủy hàng',
    INVENTORY_ALERT: 'Cảnh báo tồn kho',
    PROMOTION: 'Khuyến mãi',
    SYSTEM: 'Hệ thống',
  };

  return entityType ? labels[entityType] ?? entityType : '-';
}

export function formatAuditAction(action?: string | null) {
  if (!action) return '-';

  const labels: Record<string, string> = {
    AUTH_LOGIN: 'Đăng nhập',
    AUTH_LOGOUT: 'Đăng xuất',
    AUTH_REFRESH: 'Làm mới phiên đăng nhập',
    CUSTOMER_CREATE: 'Tạo khách hàng',
    CUSTOMER_UPDATE: 'Cập nhật khách hàng',
    CUSTOMER_POINTS_EARNED: 'Cộng điểm khách hàng',
    USER_CREATE: 'Tạo người dùng',
    USER_UPDATE: 'Cập nhật người dùng',
    USER_LOCKED: 'Khóa tài khoản',
    USER_UNLOCKED: 'Mở khóa tài khoản',
    USER_SOFT_DELETE: 'Ngừng hoạt động tài khoản',
    SUPPLIER_CREATE: 'Tạo nhà cung cấp',
    SUPPLIER_UPDATE: 'Cập nhật nhà cung cấp',
    LOCATION_CREATE: 'Tạo kho',
    LOCATION_UPDATE: 'Cập nhật kho',
    UOM_CREATE: 'Tạo đơn vị tính',
    ORDER_CREATE: 'Tạo hóa đơn',
    ORDER_CANCEL: 'Hủy hóa đơn',
    INVENTORY_ALERT_CREATE: 'Tạo cảnh báo tồn kho',
    INVENTORY_ALERT_RESOLVE: 'Xử lý cảnh báo tồn kho',
    ITEM_CREATE: 'Tạo sản phẩm',
    ITEM_UPDATE: 'Cập nhật sản phẩm',
    ITEM_DELETE: 'Ngừng kinh doanh sản phẩm',
    PURCHASE_CREATE: 'Tạo phiếu nhập',
    PURCHASE_RECEIVE: 'Nhận hàng',
    PURCHASE_CANCEL: 'Hủy phiếu nhập',
    SCRAP_CREATE: 'Tạo phiếu hủy hàng',
    SCRAP_APPROVE: 'Duyệt phiếu hủy hàng',
    SCRAP_CANCEL: 'Từ chối phiếu hủy hàng',
    PROMOTION_CREATE: 'Tạo khuyến mãi',
    PROMOTION_UPDATE: 'Cập nhật khuyến mãi',
    PROMOTION_DELETE: 'Xóa khuyến mãi',
  };

  return labels[action] ?? action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AuditDataBlock({ title, value }: { title: string; value?: string | null }) {
  const items = parseAuditData(value);

  if (!items.length) {
    return (
      <div>
        <div className="mb-1 font-semibold text-slate-500">{title}</div>
        <span className="text-slate-400">Không có dữ liệu</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 font-semibold text-slate-500">{title}</div>
      <div className="space-y-1 rounded-lg bg-slate-50 p-2">
        {items.map((item) => (
          <div key={item.key} className="flex gap-2">
            <span className="min-w-[90px] font-medium text-slate-500">{auditFieldLabel(item.key)}:</span>
            <span className="break-all text-slate-800">{formatAuditValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const auditModuleOptions = [
  { value: 'AUTH', label: 'Đăng nhập và bảo mật' },
  { value: 'USER', label: 'Quản lý người dùng' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'CATEGORY', label: 'Danh mục' },
  { value: 'ITEM', label: 'Sản phẩm' },
  { value: 'SUPPLIER', label: 'Nhà cung cấp' },
  { value: 'LOCATION', label: 'Kho và vị trí' },
  { value: 'UOM', label: 'Đơn vị tính' },
  { value: 'ORDER', label: 'Bán hàng và hóa đơn' },
  { value: 'PURCHASE_ORDER', label: 'Nhập hàng' },
  { value: 'SCRAP_ORDER', label: 'Hủy hàng' },
  { value: 'INVENTORY_ALERT', label: 'Cảnh báo tồn kho' },
  { value: 'PROMOTION', label: 'Khuyến mãi' },
  { value: 'SYSTEM', label: 'Hệ thống' },
];
