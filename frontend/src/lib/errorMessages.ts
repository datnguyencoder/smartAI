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
    UNAUTHORIZED: 'Bạn cần đăng nhập để tiếp tục',
    ACCOUNT_INACTIVE: 'Tài khoản không hoạt động hoặc đã bị khóa',
    REFRESH_TOKEN_INVALID: 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại',
    REFRESH_TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
    USERNAME_ALREADY_EXISTS: 'Tên đăng nhập đã tồn tại',
    EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
    DEFAULT_ADMIN_CANNOT_BE_DEACTIVATED: 'Không thể khóa tài khoản admin mặc định',
    USER_MUST_BE_LOCKED_BEFORE_INACTIVE: 'Tài khoản phải bị khóa trước khi chuyển sang không hoạt động',
    VALIDATION_FAILED: 'Dữ liệu không hợp lệ',
  };
  if (code && map[code]) return map[code];
  return fallback ?? 'Đã xảy ra lỗi';
}
