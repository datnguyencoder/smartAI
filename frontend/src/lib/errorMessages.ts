export function mapErrorCode(code?: string, fallback?: string): string {
  const map: Record<string, string> = {
    INSUFFICIENT_STOCK: 'Không đủ tồn kho để thực hiện giao dịch',
    PRODUCT_EXPIRED: 'Sản phẩm hoặc lô đã hết hạn — không thể bán',
    EXPIRY_DATE_REQUIRED: 'Vui lòng nhập hạn sử dụng khi nhận hàng có quản lý lô',
    INVALID_EXPIRY_DATE: 'Hạn sử dụng không hợp lệ',
    SUPPLIER_INACTIVE: 'Nhà cung cấp không hoạt động',
    AI_SERVICE_UNAVAILABLE: 'Dịch vụ AI tạm thời không khả dụng — thao tác kho vẫn bình thường',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
    INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng',
  };
  if (code && map[code]) return map[code];
  return fallback ?? 'Đã xảy ra lỗi';
}
