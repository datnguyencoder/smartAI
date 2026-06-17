# SmartMart AI - Hệ thống Quản lý Siêu thị Mini & Tối ưu Tồn kho bằng AI
## 04. THÔNG SỐ KỸ THUẬT API (API SPECIFICATION)

---

### 1. Tổng quan cấu trúc HTTP API
Hệ thống sử dụng chuẩn kiến trúc **RESTful API** cho việc giao tiếp giữa React Frontend và Spring Boot Backend, kết hợp với các cuộc gọi nội bộ (HTTP Client WebClient) từ Spring Boot sang FastAPI AI Service.

#### Base path & versioning
Toàn bộ REST API dùng prefix **`/api/v1`** (ví dụ `/api/v1/auth/login`, `/api/v1/items`). Các bảng endpoint bên dưới ghi `/api/...` cho gọn — khi triển khai luôn thêm tiền tố `/v1`.

**Ánh xạ triển khai hiện tại (2026):** Bán lẻ = `POST/GET /api/v1/orders` (không dùng `/api/sales-orders`). Đăng nhập body: `username` + `password` (không dùng `email`). Refresh: `POST /api/v1/auth/refresh`. Cảnh báo tồn: `GET /api/v1/inventory-alerts`, `PATCH /api/v1/inventory-alerts/{id}/resolve`.
POS phase 1 trừ tồn theo FEFO tại location **"Kho bán"**; hàng ở location khác không được tự động lấy sang POS.

#### Định dạng phản hồi chuẩn (Standard ApiResponse Wrapper)
Mọi API phản hồi từ Spring Boot Backend đều được bọc bởi cấu trúc dữ liệu thống nhất:

Thành công:

```json
{
  "success": true,
  "message": "Thành công",
  "data": { },
  "timestamp": "2026-06-02T10:00:00"
}
```

Lỗi:

```json
{
  "success": false,
  "message": "Số lượng hàng tồn kho không đủ",
  "errorCode": "INSUFFICIENT_STOCK",
  "timestamp": "2026-06-02T10:00:00"
}
```

Lỗi validation (`400`) kèm chi tiết theo field:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errorCode": "VALIDATION_FAILED",
  "errors": { "quantity": "Phải lớn hơn 0", "name": "Không được để trống" },
  "timestamp": "2026-06-02T10:00:00"
}
```

*   Thành công: HTTP `200 OK` / `201 Created`, `success = true`, `data` được điền, `errorCode` = null.
*   Lỗi: HTTP tương ứng, `success = false`, `data` = null (bỏ khỏi JSON), `message` + `errorCode` mô tả lỗi. Riêng validation có thêm `errors`.
*   `data`, `errorCode`, `errors` chỉ xuất hiện khi có giá trị (`@JsonInclude(NON_NULL)`).

#### Bảng mã lỗi (errorCode → HTTP)

| errorCode | HTTP | Ý nghĩa |
| :--- | :---: | :--- |
| `VALIDATION_FAILED` | 400 | Dữ liệu đầu vào sai (kèm `errors`) |
| `BAD_REQUEST` | 400 | Yêu cầu không hợp lệ |
| `INSUFFICIENT_STOCK` | 400 | Tồn kho không đủ để bán |
| `PRODUCT_EXPIRED` | 400 | Sản phẩm hết hạn |
| `INVALID_CREDENTIALS` | 401 | Sai email/mật khẩu |
| `TOKEN_EXPIRED` / `TOKEN_INVALID` | 401 | Token hết hạn / không hợp lệ |
| `UNAUTHORIZED` | 401 | Chưa xác thực |
| `ACCOUNT_INACTIVE` | 403 | Tài khoản bị khóa |
| `FORBIDDEN` | 403 | Không đủ quyền (RBAC) |
| `NOT_FOUND` | 404 | Không tìm thấy dữ liệu |
| `CONFLICT` | 409 | Trùng lặp (email, tên danh mục...) |
| `AI_SERVICE_UNAVAILABLE` | 503 | FastAPI/Gemini lỗi (SYS-10 fallback) |
| `SYSTEM_ERROR` | 500 | Lỗi không lường trước |

---

### 2. Danh mục các nhóm API Endpoint

#### 2.1. Phân hệ Xác thực (Auth API)
Quản lý vòng đời phiên đăng nhập của người dùng.

| Method | Endpoint | Quy định quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Công khai (Public) | Đăng nhập hệ thống bằng Email/Password, nhận về accessToken & refreshToken. |
| **POST** | `/api/auth/logout` | Đã xác thực | Đăng xuất hệ thống, đưa token hiện tại vào Blacklist của Redis. |
| **POST** | `/api/auth/refresh-token`| Công khai (Public) | Cấp mới accessToken khi token cũ hết hạn bằng refreshToken hợp lệ. |
| **GET** | `/api/auth/me` | Đã xác thực | Lấy thông tin chi tiết của người dùng đang đăng nhập dựa trên token. |

#### 2.2. Phân hệ Quản lý Người dùng (User API)
Dành riêng cho vai trò Admin để vận hành nhân sự.

| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/users` | `ADMIN` | Xem danh sách toàn bộ nhân viên (hỗ trợ phân trang, lọc theo role/status). |
| **POST** | `/api/users` | `ADMIN` | Tạo mới tài khoản nhân viên. |
| **GET** | `/api/users/{id}` | `ADMIN` | Xem thông tin chi tiết một nhân viên theo ID (BIGINT). |
| **PUT** | `/api/users/{id}` | `ADMIN` | Cập nhật thông tin cơ bản nhân viên (họ tên, email, vai trò). |
| **PATCH** | `/api/users/{id}/status` | `ADMIN` | Kích hoạt hoặc Khóa tài khoản nhân viên (`ACTIVE` / `INACTIVE`). |
| **DELETE** | `/api/users/{id}` | `ADMIN` | Xóa mềm tài khoản nhân viên khỏi hệ thống. |

#### 2.3. Phân hệ Danh mục sản phẩm (Category API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/categories` | Mọi vai trò đã đăng nhập | Lấy danh sách toàn bộ danh mục sản phẩm đang kinh doanh. |
| **POST** | `/api/categories` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Tạo mới danh mục sản phẩm. |
| **GET** | `/api/categories/{id}` | Mọi vai trò đã đăng nhập | Xem chi tiết danh mục theo ID. |
| **PUT** | `/api/categories/{id}` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Sửa thông tin danh mục. |
| **DELETE** | `/api/categories/{id}`| `ADMIN`, `MANAGER`, `WAREHOUSE` | Xóa mềm danh mục sản phẩm. |

#### 2.4. Phân hệ Nhà cung cấp (Supplier API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/suppliers` | Mọi vai trò đã đăng nhập | Xem danh sách toàn bộ các nhà cung cấp. |
| **POST** | `/api/suppliers` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Đăng ký nhà cung cấp mới. |
| **GET** | `/api/suppliers/{id}` | Mọi vai trò đã đăng nhập | Xem chi tiết nhà cung cấp theo ID. |
| **PUT** | `/api/suppliers/{id}` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Cập nhật thông tin liên hệ nhà cung cấp. |
| **DELETE** | `/api/suppliers/{id}`| `ADMIN`, `MANAGER`, `WAREHOUSE` | Xóa mềm nhà cung cấp. |
| **GET** | `/api/suppliers/{id}/purchase-history` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Xem lịch sử các đơn hàng đã nhập của nhà cung cấp này. |

#### 2.5. Phân hệ Hàng hóa & Sản phẩm (Product API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/items` | Đã đăng nhập | Danh sách SKU; `totalAvailableQty`, `soldQty`, `imageUrl` (resolve placeholder nếu thiếu). Query: `q`, `barcode`, `page`+`size` (phân trang). |
| **POST** | `/api/v1/items` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Tạo item (không ghi tồn). Body có thể gồm `imageUrl`. |
| **PUT** | `/api/v1/items/{id}` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Cập nhật item (giá, ảnh, danh mục…). |
| **GET** | `/api/v1/items/{id}` | Đã đăng nhập | Chi tiết item + tồn khả dụng. |
| **GET** | `/media/**` | Công khai | Ảnh tĩnh SKU/danh mục (classpath `static/media`). |
| **GET** | `/api/v1/inventory/logs` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Sổ kho `inventory_logs`. |
| **GET** | `/api/v1/inventory/near-expiry` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Lô cận hạn. |
| **GET** | `/api/v1/categories`, `/api/v1/uoms`, `/api/v1/locations`, `/api/v1/suppliers` | Master data WMS. |

#### 2.6. Phân hệ Giao dịch Bán hàng (Sales Order API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/sales-orders` | `ADMIN`, `MANAGER`, `STAFF` | Tạo hóa đơn bán hàng tại quầy (trừ kho trực tiếp, sinh sự kiện). |
| **GET** | `/api/sales-orders` | `ADMIN`, `MANAGER`, `STAFF` (giới hạn) | Lấy danh sách lịch sử hóa đơn bán lẻ. |
| **GET** | `/api/sales-orders/{id}`| Mọi vai trò đã đăng nhập | Xem chi tiết một hóa đơn cùng các mặt hàng đã mua. |
| **POST** | `/api/sales-orders/{id}/cancel` | `ADMIN`, `MANAGER` | Hủy hóa đơn (cộng trả hàng lại kho, sinh stock movement hồi trả). |
| **GET** | `/api/sales-orders/{id}/print` | Mọi vai trò đã đăng nhập | Xuất dữ liệu in hóa đơn dạng HTML/PDF chuẩn POS. |

#### 2.7. Phân hệ Nhập kho (Purchase Order API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/purchase-orders` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Tạo phiếu nhập kho (cộng dồn tồn kho thực tế, cập nhật giá nhập lẻ). |
| **GET** | `/api/purchase-orders` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Xem danh sách các phiếu nhập hàng. |
| **GET** | `/api/purchase-orders/{id}`| `ADMIN`, `MANAGER`, `WAREHOUSE` | Xem chi tiết danh mục hàng nhập và hạn sử dụng trong phiếu. |
| **POST** | `/api/purchase-orders/{id}/cancel` | `ADMIN`, `MANAGER` | Hủy phiếu nhập kho (trừ lại kho, hồi trả stock movement). |

#### 2.7.1. Phân hệ Công nợ Nhà cung cấp
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/supplier-debts?status=OVERDUE` | `ADMIN`, `MANAGER` | Danh sách công nợ, có thể lọc `UNPAID`, `PARTIAL`, `OVERDUE`, `PAID`. |
| **GET** | `/api/supplier-debts/supplier/{supplierId}` | `ADMIN`, `MANAGER` | Công nợ theo nhà cung cấp. |
| **GET** | `/api/supplier-debts/{id}` | `ADMIN`, `MANAGER` | Chi tiết công nợ và lịch sử thanh toán. |
| **POST** | `/api/supplier-debts/{id}/payments` | `ADMIN`, `MANAGER` | Ghi nhận thanh toán từng phần/toàn phần; chặn thanh toán vượt số còn lại. |
| **POST** | `/api/supplier-debts/from-purchase/{purchaseOrderId}` | `ADMIN`, `MANAGER` | Tạo công nợ thủ công từ phiếu nhập; nếu không truyền `dueDate` mặc định +30 ngày. |

#### 2.8. Phân hệ Tồn kho & Cảnh báo kho (Inventory API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/inventory` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Xem bảng đối soát tồn kho tổng thể. |
| **GET** | `/api/inventory/summary` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Lấy các con số tóm tắt (Tổng tồn, Tổng giá trị hàng trong kho). |
| **GET** | `/api/inventory/low-stock` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Lọc nhanh các sản phẩm đang có số lượng dưới mức tối thiểu. |
| **GET** | `/api/inventory/out-of-stock`| `ADMIN`, `MANAGER`, `WAREHOUSE` | Lọc nhanh các sản phẩm đã hết hàng sạch trong kho. |
| **GET** | `/api/inventory/high-risk` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Lọc các sản phẩm có rủi ro thiếu hàng (Tồn thực tế < AI dự báo 7 ngày). |
| **GET** | `/api/inventory/over-stock` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Lọc sản phẩm tồn kho quá cao (đọng vốn lớn). |
| **GET** | `/api/inventory/near-expiry` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Lọc sản phẩm sắp hết hạn sử dụng (trong vòng 30 ngày). |
| **GET** | `/api/inventory/alerts` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Xem toàn bộ danh sách các cảnh báo tồn kho tự động đang hoạt động. |
| **PATCH**| `/api/inventory/alerts/{id}/resolve`| `ADMIN`, `MANAGER`, `WAREHOUSE` | Đánh dấu xử lý thủ công / Hoàn thành cảnh báo kho. |

#### 2.9. Phân hệ Dự báo học máy (Forecast API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/forecast/train` | `ADMIN`, `MANAGER` | Gửi yêu cầu trích xuất dữ liệu bán hàng và huấn luyện lại mô hình ML. |
| **POST** | `/api/forecast/run` | `ADMIN`, `MANAGER` | Kích hoạt chạy dự báo bán lẻ 7/14/30 ngày cho tất cả sản phẩm. |
| **GET** | `/api/forecast/results` | `ADMIN`, `MANAGER` | Lấy danh sách kết quả dự báo tổng quan hệ thống. |
| **GET** | `/api/forecast/results/{productId}` | `ADMIN`, `MANAGER` | Xem chi tiết kết quả dự báo theo từng ngày tương lai của sản phẩm. |
| **GET** | `/api/forecast/recommendations` | `ADMIN`, `MANAGER`, `WAREHOUSE` | Xem gợi ý số lượng nhập hàng thông minh (Reorder Recommendations). |
| **GET** | `/api/forecast/model-history` | `ADMIN`, `MANAGER` | Xem lịch sử các phiên train mô hình AI kèm độ đo MAE/RMSE/MAPE. |

#### 2.10. Phân hệ Khuyến mãi đề xuất (Promotion API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/promotions/recommendations` | `ADMIN`, `MANAGER` | Xem danh sách các sản phẩm cận date/tồn cao được đề xuất khuyến mãi. |
| **POST**| `/api/promotions/recommendations/{id}/approve` | `ADMIN`, `MANAGER` | Phê duyệt áp dụng chương trình khuyến mãi (Cập nhật giá bán lẻ). |
| **POST**| `/api/promotions/recommendations/{id}/reject` | `ADMIN`, `MANAGER` | Từ chối áp dụng chương trình khuyến mãi. |
| **PUT** | `/api/promotions/recommendations/{id}` | `ADMIN`, `MANAGER` | Điều chỉnh thủ công tỷ lệ giảm giá đề xuất trước khi phê duyệt. |

#### 2.11. Phân hệ Dashboard thống kê
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/dashboard/summary` | `ADMIN`, `MANAGER` | Tổng hợp Doanh thu, Hóa đơn, Sản phẩm bán chạy nhất ngày (Cached). |
| **GET** | `/api/dashboard/revenue` | `ADMIN`, `MANAGER` | Dữ liệu vẽ biểu đồ doanh thu theo chu kỳ (7 ngày gần nhất, 30 ngày). |
| **GET** | `/api/dashboard/top-products` | `ADMIN`, `MANAGER` | Top 10 sản phẩm mang lại doanh thu và lợi nhuận cao nhất siêu thị. |
| **GET** | `/api/dashboard/inventory-alerts`| `ADMIN`, `MANAGER` | Đếm nhanh số lượng cảnh báo tồn kho theo từng nhóm nghiêm trọng. |
| **GET** | `/api/dashboard/forecast-summary` | `ADMIN`, `MANAGER` | Tóm tắt các con số dự báo AI sắp tới để hỗ trợ ra quyết định. |

#### 2.11.1. Phân hệ Ca bán & Đối soát tiền
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/shifts` | `ADMIN`, `MANAGER` | Danh sách toàn bộ ca làm việc. |
| **GET** | `/api/shifts/current` | `ADMIN`, `MANAGER`, `STAFF` | Ca đang mở của user hiện tại. |
| **POST** | `/api/shifts/open` | `ADMIN`, `MANAGER`, `STAFF` | Mở ca, body gồm `openingCash`, `note`. |
| **POST** | `/api/shifts/{id}/close` | `ADMIN`, `MANAGER`, `STAFF` | Đóng ca, body gồm `closingCash`, `varianceReason`, `note`. Nếu lệch tiền thì chuyển `PENDING_REVIEW`. |
| **POST** | `/api/shifts/{id}/review` | `ADMIN`, `MANAGER` | Duyệt ca lệch tiền, chuyển `PENDING_REVIEW` → `CLOSED`. |

#### 2.12. Phân hệ Xuất Báo cáo (Report API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/reports/sales` | `ADMIN`, `MANAGER` | Xuất dữ liệu thống kê bán lẻ chuyên sâu theo ngày/tháng/năm. |
| **GET** | `/api/reports/inventory` | `ADMIN`, `MANAGER` | Báo cáo chi tiết hao hụt kho, hàng cận date, tỷ lệ quay vòng kho. |
| **GET** | `/api/reports/purchase` | `ADMIN`, `MANAGER` | Thống kê số lượng tiền chi nhập hàng theo từng nhà cung cấp. |
| **GET** | `/api/reports/export/excel` | `ADMIN`, `MANAGER` | Tải về báo cáo định dạng Excel (.xlsx) chuẩn chỉnh có màu sắc. |
| **GET** | `/api/reports/export/pdf` | `ADMIN`, `MANAGER` | Tải về báo cáo định dạng PDF định dạng A4 sẵn sàng in ấn. |

#### 2.13. Phân hệ giải thích ngôn ngữ tự nhiên (AI Insight API)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **POST**| `/api/ai-insight/explain-forecast` | `ADMIN`, `MANAGER` | Gửi dữ liệu forecast sản phẩm sang Gemini để nhận đoạn tóm tắt tiếng Việt. |
| **POST**| `/api/ai-insight/explain-risk` | `ADMIN`, `MANAGER` | Yêu cầu Gemini phân tích sâu rủi ro đứt hàng và đưa ra lời khuyên nhập. |
| **POST**| `/api/ai-insight/chat` | Mọi vai trò đã đăng nhập | Hỏi đáp dữ liệu bán hàng, tồn kho trực tiếp với Chatbot thông minh. |

#### 2.14. Cuộc gọi nội bộ từ Backend sang FastAPI AI Service
Các API này không lộ ra ngoài Internet (chỉ chạy trong mạng nội bộ docker-compose).

| Method | Endpoint | Người gọi | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/ai/health` | Spring Boot | Kiểm tra trạng thái hoạt động của FastAPI container. |
| **POST** | `/ai/train` | Spring Boot | Gửi payload lịch sử bán hàng định dạng JSON để FastAPI huấn luyện model mới. |
| **POST** | `/ai/forecast/all` | Spring Boot | Gọi FastAPI lấy dữ liệu dự báo bán ra trong 30 ngày tới của tất cả sản phẩm. |
| **GET** | `/ai/model/metrics` | Spring Boot | Lấy thông số đánh giá sai số (MAE, RMSE, MAPE) của model vừa train thành công. |

---

### 3. Mô tả chi tiết các Payload API mẫu (JSON Payloads)

#### 3.1. API Đăng nhập hệ thống (`POST /api/auth/login`)
*   **Request Body:**
```json
{
  "email": "manager@smartmart.com",
  "password": "strongpassword123"
}
```
*   **Response Body (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyQHNtYXJ0bWFydC5jb20iLCJyb2xlIjoiTUFOQUdFUiIsImlhdCI6MTc4NTEyMDAwMCwiZXhwIjoxNzg1MjA2NDAwfQ.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.refreshTokenSignature",
    "user": {
      "id": "7fbc8d31-419b-4b2e-a50d-854721ab96cc",
      "fullName": "Trần Thanh Bình",
      "email": "manager@smartmart.com",
      "role": "MANAGER"
    }
  }
}
```

#### 3.2. API Tạo hóa đơn bán lẻ POS (`POST /api/sales-orders`)
*   **Request Body:**
```json
{
  "paymentMethod": "BANK_TRANSFER",
  "items": [
    {
      "productId": 12,
      "quantity": 3
    },
    {
      "productId": 45,
      "quantity": 10
    }
  ]
}
```
*   **Response Body (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Hóa đơn bán lẻ đã được tạo thành công",
  "data": {
    "id": 10045,
    "orderCode": "HD20260518-045",
    "saleDate": "2026-05-18T16:26:00",
    "totalAmount": 455000.00,
    "paymentMethod": "BANK_TRANSFER",
    "status": "COMPLETED",
    "items": [
      {
        "productId": 12,
        "productName": "Sữa tươi TH True Milk 1L",
        "quantity": 3,
        "price": 35000.00,
        "subtotal": 105000.00
      },
      {
        "productId": 45,
        "productName": "Mì ăn liền Hảo Hảo Tôm Chua Cay",
        "quantity": 10,
        "price": 3500.00,
        "subtotal": 350000.00
      }
    ]
  }
}
```

#### 3.3. API Chạy Dự báo AI & Gợi ý đặt hàng (`POST /api/forecast/run`)
*   **Request Body:**
```json
{
  "forecastPeriods": [7, 14, 30],
  "modelType": "XGBOOST"
}
```
*   **Response Body (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Chạy mô hình dự báo AI thành công và đã cập nhật gợi ý đặt hàng",
  "data": {
    "itemsForecasted": 120,
    "itemsSubmitted": 120,
    "source": "AI",
    "ranAt": "2026-06-17T23:16:00"
  }
}
```

Gợi ý đặt hàng lấy bằng `GET /api/v1/forecast/recommendations`:

```json
{
  "success": true,
  "message": "Thành công",
  "data": [
    {
      "itemId": 12,
      "itemName": "Sữa tươi TH True Milk 1L",
      "currentAvailable": 15,
      "predictedDemand7d": 45,
      "predictedDemand14d": 92,
      "suggestedQty": 82,
      "riskLevel": "HIGH",
      "source": "AI",
      "reason": "Tồn kho thực tế (15) hiện thấp hơn nhiều so với dự báo nhu cầu bán hàng 7 ngày tới (45). Đề xuất đặt hàng gấp 82 đơn vị."
    },
    {
      "itemId": 45,
      "itemName": "Mì ăn liền Hảo Hảo Tôm Chua Cay",
      "currentAvailable": 350,
      "predictedDemand7d": 120,
      "predictedDemand14d": 250,
      "suggestedQty": 0,
      "riskLevel": "LOW",
      "source": "AI",
      "reason": "Tồn kho thực tế (350) dồi dào, đảm bảo nhu cầu tiêu thụ trong 14 ngày tới (250). Không cần nhập thêm."
    }
  ]
}
```

Khi FastAPI AI Service offline, `POST /api/forecast/run` vẫn trả `200 OK` và kích hoạt fallback gợi ý nhập hàng bằng trung bình bán 30 ngày:

```json
{
  "success": true,
  "message": "Dự báo thành công",
  "data": {
    "itemsForecasted": 0,
    "itemsSubmitted": 120,
    "source": "FALLBACK",
    "message": "AI offline - gợi ý nhập hàng đã được tính bằng lịch sử bán 30 ngày",
    "ranAt": "2026-06-17T23:16:00"
  }
}
```
