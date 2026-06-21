# SmartMart AI - Business Flow Blueprint

Tài liệu này chuẩn hóa luồng nghiệp vụ end-to-end của SmartMart AI theo code hiện tại trong monorepo. Mục tiêu là giúp FE, BE, AI và QA cùng nhìn một bản đồ vận hành: mỗi nghiệp vụ bắt đầu ở đâu, đi qua service nào, ghi dữ liệu gì, trạng thái kết thúc ra sao và tiêu chí nào được xem là "đúng".

> Ngày chuẩn hóa: 2026-06-21. API public dùng prefix `/api/v1`.

---

## 1. Nguyên tắc vận hành toàn hệ thống

### 1.1. Source of truth

- PostgreSQL là nguồn dữ liệu gốc cho giao dịch, tồn kho, công nợ, forecast, audit.
- Frontend chỉ hiển thị và validate UX; mọi rule quan trọng phải nằm ở Backend.
- FastAPI AI Service chỉ tạo forecast/model; không tự ghi trực tiếp vào DB nghiệp vụ.
- Gemini/Cerebras chỉ giải thích dữ liệu; không được tự thay đổi số liệu hoặc quyết định giao dịch.

### 1.2. Luồng ghi tồn kho bắt buộc

Không phân hệ nào được sửa tồn bằng cách update trực tiếp `items` hoặc tự chỉnh `current_inventory`.

Chuẩn ghi tồn:

1. Service nghiệp vụ validate dữ liệu.
2. Gọi `InventoryLedgerService`.
3. Ledger cập nhật `current_inventory`.
4. Ledger ghi `inventory_logs`.
5. Service nghiệp vụ ghi audit log và event/cảnh báo nếu cần.

### 1.3. Chuẩn trạng thái giao dịch

| Phân hệ | Trạng thái chính | Ý nghĩa |
| --- | --- | --- |
| Order | `COMPLETED`, `CANCELLED` | Hóa đơn bán thành công hoặc bị hủy |
| Purchase Order | `PENDING`, `COMPLETED`, `CANCELLED` | Phiếu nhập đã tạo, đã nhận hàng, hoặc hủy |
| Transfer Order | `PENDING`, `COMPLETED`, `CANCELLED` | Phiếu chuyển kho chờ xử lý, hoàn tất, hoặc hủy |
| Stocktake | `DRAFT`, `CONFIRMED`, `CANCELLED` | Phiếu kiểm kê nháp, đã chốt điều chỉnh, hoặc hủy |
| Scrap Order | `PENDING`, `COMPLETED`, `CANCELLED` | Phiếu hủy chờ duyệt, đã trừ tồn, hoặc từ chối |
| Return Order | `COMPLETED` | Phiếu trả hàng hoàn tất ngay sau khi tạo hợp lệ |
| Forecast Train Job | `QUEUED`, `RUNNING`, `DONE`, `FAILED` | Vòng đời huấn luyện AI async |
| Recommendation | `PENDING`, `APPROVED`, `REJECTED` | Đề xuất AI chờ duyệt, đã áp dụng, hoặc từ chối |

### 1.4. Chuẩn kiểm soát lỗi

- Validate fail: trả `400 VALIDATION_FAILED` hoặc `BAD_REQUEST`.
- Không đủ tồn: trả `400 INSUFFICIENT_STOCK`.
- Không đủ quyền: trả `403 FORBIDDEN`.
- AI offline: không làm sập POS/Purchase/Inventory; forecast/reorder dùng fallback khi có thể.
- Mọi transaction ghi nhiều bảng phải rollback toàn bộ nếu lỗi ở bất kỳ bước nào.

---

## 2. Luồng Auth, RBAC và phiên làm việc

### Mục tiêu nghiệp vụ

Đảm bảo nhân viên chỉ thao tác đúng quyền và hệ thống truy vết được actor cho audit, đơn hàng, phiếu kho.

### Luồng chuẩn

1. Người dùng đăng nhập bằng `username` + `password`.
2. Backend xác thực tài khoản, trạng thái user và mật khẩu BCrypt.
3. Backend trả access token, refresh token và thông tin user.
4. Frontend lưu session, gắn token cho các API sau.
5. Khi hết hạn token, frontend gọi refresh.
6. Logout xóa token phía client và vô hiệu hóa token phía server nếu cấu hình blacklist.

### API chính

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Tiêu chí hoàn tất

- User inactive không đăng nhập được.
- Mỗi API nghiệp vụ có guard theo role.
- Audit log ghi đúng actor với các thao tác thay đổi dữ liệu.

---

## 3. Luồng Master Data: SKU, danh mục, UOM, kho, NCC

### Mục tiêu nghiệp vụ

Tạo nền dữ liệu chuẩn trước khi có giao dịch: mỗi biến thể hàng hóa là một SKU riêng, có barcode/mã SKU, đơn vị tính, giá, ảnh, danh mục, nhà cung cấp và trạng thái rõ ràng.

### Chuẩn SKU

Một sản phẩm thương mại khác hương vị/quy cách/pack size phải là SKU riêng.

Ví dụ:

- `MI-HAOHAO-TOMCHUA-75G`
- `MI-HAOHAO-SA-TE-75G`
- `MI-HAOHAO-GA-VANG-75G`

Không dùng một SKU chung cho nhiều biến thể. Barcode nếu có phải map về đúng SKU.

### Luồng tạo SKU

1. Admin/Manager/Warehouse mở màn Sản phẩm.
2. Nhập `itemCode`, `itemName`, barcode, category, UOM, cost/selling price, min stock, expiry flag, ảnh.
3. Frontend validate định dạng cơ bản.
4. Backend normalize SKU, check trùng, validate giá và quan hệ danh mục/UOM.
5. Backend lưu item ở trạng thái kinh doanh phù hợp.
6. Tồn ban đầu không được nhập tại item; phải tạo phiếu nhập hoặc kiểm kê.

### Luồng cập nhật SKU

- Được sửa tên, giá, ảnh, category, barcode nếu hợp lệ.
- Không đổi SKU tùy tiện khi item đã có lịch sử tồn/kho/bán/nhập; nếu là biến thể mới thì tạo SKU mới.
- Không hard delete SKU đã phát sinh giao dịch; chuyển `INACTIVE`.

### API chính

- `GET /api/v1/items`
- `POST /api/v1/items`
- `PUT /api/v1/items/{id}`
- `GET /api/v1/categories`
- `GET /api/v1/uoms`
- `GET /api/v1/locations`
- `GET /api/v1/suppliers`

### Tiêu chí hoàn tất

- POS search/barcode luôn trả đúng SKU.
- Item active có ảnh hoặc placeholder đã resolve.
- Không có SKU trùng nghĩa như "Hảo Hảo" gom nhiều vị vào một dòng.

---

## 4. Luồng bán hàng POS

### Mục tiêu nghiệp vụ

Bán hàng nhanh tại quầy, trừ tồn đúng lô FEFO ở "Kho bán", in hóa đơn chuẩn, ghi nhận thanh toán, điểm khách hàng, khuyến mãi và audit.

### Actor

Staff, Manager, Admin.

### Luồng chuẩn

1. Thu ngân mở POS.
2. Quét barcode hoặc tìm SKU.
3. Thêm số lượng, khách hàng, khuyến mãi, điểm đổi nếu có.
4. Frontend validate giỏ hàng, số lượng, thanh toán.
5. Backend nhận `POST /api/v1/orders`.
6. Backend tìm location mặc định `Kho bán`.
7. Với từng dòng:
   - Check item active.
   - Allocate tồn bằng FEFO tại `Kho bán`.
   - Gọi ledger trừ tồn với `InventoryActionType.SALE`.
   - Chốt giá bán tại thời điểm bán.
8. Backend áp mã khuyến mãi, điểm tích lũy, tổng tiền.
9. Backend lưu order, order items, payments.
10. Backend backfill `referenceId` cho inventory logs.
11. Backend publish order event, evaluate stock alert, ghi audit.
12. Frontend hiển thị thành công và in hóa đơn.

### API chính

- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/paged`
- `GET /api/v1/orders/{id}`
- `GET /api/v1/orders/{id}/print`
- `POST /api/v1/orders/{id}/cancel`

### Dữ liệu ghi nhận

- `orders`
- `order_items`
- `order_payments`
- `current_inventory`
- `inventory_logs`
- `customers` / loyalty nếu có
- `audit_logs`

### Rule bắt buộc

- Không bán item inactive.
- Không bán vượt tồn khả dụng.
- Không lấy hàng từ kho tổng nếu chưa chuyển sang `Kho bán`.
- Giá trên hóa đơn là giá snapshot, không thay đổi khi giá item đổi sau này.
- Thanh toán phải đủ tổng tiền; tiền mặt được phép lớn hơn để thối tiền.

### Tiêu chí hoàn tất

- Tạo order thành công thì tồn giảm và log kho có reference.
- Lỗi giữa chừng phải rollback order và tồn.
- Hóa đơn in hiển thị đủ mã hóa đơn, ngày, thu ngân, SKU, số lượng, giá, giảm giá, tổng.

---

## 5. Luồng hủy hóa đơn và trả hàng

### 5.1. Hủy hóa đơn

Mục tiêu: hủy toàn bộ hóa đơn đã bán do thao tác sai hoặc giao dịch không hợp lệ.

Luồng chuẩn:

1. Admin/Manager chọn hóa đơn.
2. Backend kiểm tra hóa đơn tồn tại và trạng thái cho phép hủy.
3. Backend cộng trả lại đúng item/lô/location đã bán.
4. Backend đổi trạng thái order sang `CANCELLED`.
5. Backend ghi audit và cập nhật cảnh báo tồn nếu cần.

### 5.2. Trả hàng một phần/toàn phần

Mục tiêu: khách trả một số sản phẩm từ hóa đơn gốc nhưng không hủy toàn bộ hóa đơn.

Luồng chuẩn:

1. Staff/Manager chọn hóa đơn gốc `COMPLETED`.
2. Chọn item/lô và số lượng trả.
3. Backend kiểm tra item có trong hóa đơn gốc.
4. Backend kiểm tra số lượng trả không vượt số còn được trả.
5. Backend tính refund theo đơn giá snapshot và phân bổ giảm giá.
6. Backend cộng tồn về location đã bán hoặc `Kho bán`.
7. Backend tạo `return_order` trạng thái `COMPLETED`.
8. Backend ghi audit.

### API chính

- `POST /api/v1/orders/{id}/cancel`
- `POST /api/v1/return-orders`
- `GET /api/v1/return-orders`

### Tiêu chí hoàn tất

- Không trả hàng từ order đã hủy.
- Không trả vượt số đã mua trừ số đã trả trước đó.
- Refund amount khớp số lượng trả và discount ratio.

---

## 6. Luồng nhập hàng và công nợ nhà cung cấp

### Mục tiêu nghiệp vụ

Lập phiếu nhập trước, chỉ cộng tồn khi xác nhận nhận hàng. Nếu mua nợ thì tự sinh công nợ NCC.

### Actor

Warehouse Staff, Manager, Admin.

### Luồng tạo phiếu nhập

1. Chọn NCC active và kho nhận active.
2. Chọn SKU, số lượng đặt, đơn giá nhập, HSD nếu item có hạn.
3. Backend tạo `PurchaseOrder` trạng thái `PENDING`.
4. Backend tạo dòng phiếu nhập và lot number.
5. Backend ghi audit và publish purchase-created event.

### Luồng nhận hàng

1. Người dùng bấm nhận hàng cho phiếu `PENDING`.
2. Backend lock item theo thứ tự ID để giảm deadlock.
3. Quy đổi UOM nhập về base UOM.
4. Gọi ledger cộng tồn với `PURCHASE_RECEIVE`.
5. Cập nhật cost price bình quân.
6. Set received qty, chuyển phiếu sang `COMPLETED`.
7. Nếu `paymentDeferred = true`, tạo supplier debt hạn +30 ngày.
8. Ghi audit và publish purchase-received event.

### Luồng hủy phiếu nhập

- Chỉ hủy phiếu còn `PENDING`.
- Nếu đã `COMPLETED` thì không hủy trực tiếp; cần nghiệp vụ điều chỉnh/hủy tồn riêng.

### API chính

- `POST /api/v1/purchase-orders`
- `GET /api/v1/purchase-orders`
- `GET /api/v1/purchase-orders/{id}`
- `POST /api/v1/purchase-orders/{id}/receive`
- `POST /api/v1/purchase-orders/{id}/cancel`
- `GET /api/v1/supplier-debts`
- `POST /api/v1/supplier-debts/{id}/payments`

### Rule bắt buộc

- NCC inactive không được nhập.
- Sản phẩm có hạn phải có HSD lớn hơn ngày hiện tại.
- Đơn giá và số lượng phải lớn hơn 0.
- Chỉ `receive` mới cộng tồn.

### Tiêu chí hoàn tất

- Phiếu `PENDING`: không làm tăng tồn.
- Phiếu `COMPLETED`: tồn tăng, có log kho, cost price cập nhật.
- Phiếu mua nợ: có supplier debt đúng số tiền và due date.

---

## 7. Luồng tồn kho, lot, ledger và cảnh báo

### Mục tiêu nghiệp vụ

Theo dõi tồn theo SKU, kho, lô; mọi biến động có log để đối soát.

### Luồng ledger chuẩn

1. Nhận item, location, lot, quantity change, action type, reference.
2. Tìm hoặc tạo dòng `current_inventory`.
3. Tính `lotBefore`, `lotAfter`.
4. Nếu `lotAfter < 0`, ném `InsufficientStockException`.
5. Lưu tồn mới.
6. Tính tổng tồn trước/sau tại location.
7. Ghi `inventory_logs`.

### Action type chính

- `SALE`
- `SALE_RETURN`
- `PURCHASE_RECEIVE`
- `TRANSFER_OUT`
- `TRANSFER_IN`
- `ADJUSTMENT`
- `SCRAP_PENDING`
- `SCRAP_COMPLETED`

### Cảnh báo tồn kho

Nguồn kích hoạt:

- Sau bán hàng.
- Sau nhập hàng.
- Sau forecast/reorder.
- Sau hủy/xả hàng.

Nhóm cảnh báo:

- Hết hàng.
- Tồn thấp.
- Rủi ro thiếu theo forecast.
- Tồn dư.
- Cận date/hết date.

### API chính

- `GET /api/v1/current-inventories`
- `GET /api/v1/inventory`
- `GET /api/v1/inventory/logs`
- `GET /api/v1/inventory/near-expiry`
- `GET /api/v1/inventory-alerts`
- `PATCH /api/v1/inventory-alerts/{id}/resolve`
- `GET /api/v1/item-lots`

### Tiêu chí hoàn tất

- Tồn không âm.
- Log kho append-only theo từng reference.
- Query tồn theo item/location/lot trả số liệu khớp ledger.

---

## 8. Luồng chuyển kho

### Mục tiêu nghiệp vụ

Chuyển hàng từ kho này sang kho khác, đặc biệt từ kho tổng sang `Kho bán` trước khi POS bán.

### Luồng chuẩn

1. Chọn kho nguồn và kho đích khác nhau.
2. Chọn SKU/lô/số lượng.
3. Backend kiểm tra available tại kho nguồn.
4. Tạo transfer order `PENDING`.
5. Khi hoàn thành:
   - Lock tồn nguồn.
   - Kiểm tra available lại lần cuối.
   - Ledger trừ kho nguồn.
   - Ledger cộng kho đích.
   - Chuyển trạng thái `COMPLETED`.
   - Ghi audit.
6. Nếu hủy, chỉ đổi `PENDING` sang `CANCELLED`, không đổi tồn.

### API chính

- `POST /api/v1/transfer-orders`
- `GET /api/v1/transfer-orders`
- `POST /api/v1/transfer-orders/{id}/complete`
- `POST /api/v1/transfer-orders/{id}/cancel`

### Tiêu chí hoàn tất

- Tổng tồn toàn hệ thống không đổi.
- Tồn kho nguồn giảm, kho đích tăng cùng số lượng.
- Chỉ phiếu `PENDING` được complete/cancel.

---

## 9. Luồng kiểm kê

### Mục tiêu nghiệp vụ

So sánh tồn hệ thống với tồn thực tế và tạo adjustment có audit.

### Luồng chuẩn

1. Chọn kho kiểm kê.
2. Chọn SKU/lô và nhập số lượng thực tế.
3. Backend tạo stocktake `DRAFT`, lưu system quantity tại thời điểm tạo.
4. Khi confirm:
   - Backend refresh lại system quantity hiện tại.
   - Tính variance = actual - system.
   - Nếu variance khác 0, ledger ghi `ADJUSTMENT`.
   - Chuyển phiếu sang `CONFIRMED`.
   - Ghi audit.
5. Nếu hủy: chỉ phiếu `DRAFT` được hủy.

### API chính

- `POST /api/v1/stocktakes`
- `GET /api/v1/stocktakes`
- `POST /api/v1/stocktakes/{id}/confirm`
- `POST /api/v1/stocktakes/{id}/cancel`

### Tiêu chí hoàn tất

- Phiếu `DRAFT` không làm thay đổi tồn.
- `CONFIRMED` tạo log adjustment đúng chênh lệch.
- Không confirm lại phiếu đã chốt.

---

## 10. Luồng hủy hàng, cận date và hết date

### Mục tiêu nghiệp vụ

Loại bỏ hàng hỏng/hết hạn khỏi tồn khả dụng theo quy trình có duyệt.

### Luồng chuẩn

1. Warehouse/Manager tạo phiếu hủy tại một kho.
2. Chọn SKU/lô/số lượng/lý do.
3. Backend kiểm tra available đủ.
4. Tạo scrap order `PENDING`.
5. Backend ghi log action-only `SCRAP_PENDING` để truy vết đề xuất hủy, chưa trừ tồn.
6. Manager/Admin duyệt:
   - Ledger trừ tồn bằng `SCRAP_COMPLETED`.
   - Cập nhật log reference.
   - Chuyển phiếu sang `COMPLETED`.
   - Publish event hoàn tất.
   - Ghi audit.
7. Nếu từ chối:
   - Chuyển `CANCELLED`.
   - Xóa log pending theo reference.
   - Lưu reason vào note.

### API chính

- `POST /api/v1/scrap-orders`
- `GET /api/v1/scrap-orders`
- `POST /api/v1/scrap-orders/{id}/approve`
- `POST /api/v1/scrap-orders/{id}/cancel`

### Tiêu chí hoàn tất

- Tạo phiếu không trừ tồn.
- Duyệt mới trừ tồn.
- Từ chối không để lại tồn thay đổi.

---

## 11. Luồng khuyến mãi và đề xuất xả hàng

### Mục tiêu nghiệp vụ

Tạo chương trình giảm giá có kiểm soát và dùng AI/rule để đề xuất xả hàng tồn dư hoặc cận date.

### Luồng quản lý khuyến mãi

1. Manager/Admin tạo promotion với code, loại giảm, giá trị, min order, thời gian hiệu lực.
2. Backend validate thời gian, giá trị giảm, code duy nhất.
3. POS validate promotion code theo subtotal.
4. Khi order tạo, Backend tính discount snapshot và gắn promotion vào order.

### Luồng đề xuất khuyến mãi

1. Hệ thống phân tích tồn dư, cận date, tốc độ bán và forecast.
2. Tạo recommendation `PENDING`.
3. Manager xem lý do, mức giảm, SKU liên quan.
4. Manager approve:
   - Tạo/cập nhật promotion tương ứng hoặc đánh dấu áp dụng.
   - Recommendation sang `APPROVED`.
   - Ghi audit.
5. Manager reject:
   - Recommendation sang `REJECTED`.
   - Lưu lý do nếu có.

### API chính

- `GET /api/v1/promotions`
- `POST /api/v1/promotions`
- `PUT /api/v1/promotions/{id}`
- `DELETE /api/v1/promotions/{id}`
- `POST /api/v1/promotions/validate`
- `GET /api/v1/promotions/recommendations`
- `POST /api/v1/promotions/recommendations/{id}/approve`
- `POST /api/v1/promotions/recommendations/{id}/reject`
- `POST /api/v1/ai-insight/suggest-promotion/{itemId}`

### Rule bắt buộc

- Không đề xuất giảm giá cho SKU đang thiếu hàng.
- Cận date và risk quantity cao được ưu tiên giảm sâu.
- Tồn dư nhưng hạn còn dài chỉ giảm nhẹ/kích cầu.
- Manager là người quyết định cuối cùng.

### Tiêu chí hoàn tất

- Promotion validate đúng hiệu lực và min order.
- Đề xuất có lý do, số liệu và trạng thái duyệt.
- POS discount khớp promotion snapshot tại thời điểm bán.

---

## 12. Luồng AI Forecast và gợi ý nhập hàng

### Mục tiêu nghiệp vụ

Dự báo nhu cầu 7/14/30 ngày theo SKU, xác định rủi ro thiếu/tồn dư và sinh gợi ý nhập hàng.

### Luồng train async

1. Manager/Admin bấm huấn luyện model.
2. Frontend gọi `POST /api/v1/forecast/train`.
3. Backend tạo job `QUEUED`.
4. Async executor chuyển job sang `RUNNING`.
5. Backend extract lịch sử bán 180 ngày.
6. Backend gọi FastAPI `/ai/train`.
7. FastAPI train model, trả metrics.
8. Backend lưu `model_training_history`.
9. Backend tự chạy forecast sau train.
10. Job chuyển `DONE` hoặc `FAILED`.

### Luồng run forecast

1. Manager/Admin gọi `POST /api/v1/forecast/run`.
2. Backend build payload tất cả SKU active, kể cả SKU ít/no sales.
3. Backend gọi FastAPI `/ai/forecast/all`.
4. Nếu AI lỗi:
   - Reorder fallback theo trung bình bán 30 ngày.
   - Trả source `FALLBACK`.
5. Nếu AI thành công:
   - Xóa forecast cũ và daily points cũ.
   - Lưu forecast result mới.
   - Lưu daily series.
   - Recompute reorder recommendations từ forecast.
   - Trả source `AI`.

### Luồng xem forecast

1. Frontend gọi `GET /api/v1/forecast/results`.
2. Backend trả top results đã sort theo risk.
3. User chọn SKU.
4. Frontend gọi `GET /api/v1/forecast/results/{itemId}`.
5. Backend trả daily series, confidence band, stock insight, shortage/surplus và recommendation.

### API chính

- `GET /api/v1/forecast/status`
- `POST /api/v1/forecast/train`
- `GET /api/v1/forecast/train/{jobId}`
- `POST /api/v1/forecast/run`
- `GET /api/v1/forecast/results`
- `GET /api/v1/forecast/results/{itemId}`
- `GET /api/v1/reorder-recommendations`

### Rule bắt buộc

- Staff không được train/run forecast.
- Forecast không được làm lỗi POS/Purchase.
- Mỗi lần run forecast phải làm sạch result cũ để tránh đọc trùng.
- Reorder phải có source rõ: `AI` hoặc `FALLBACK`.

### Tiêu chí hoàn tất

- UI hiển thị trạng thái model/job rõ ràng.
- Forecast có pred 7/14/30 ngày.
- SKU thiếu có shortage qty và action rõ.
- SKU tồn dư có surplus qty và gợi ý khuyến mãi/xả hàng.

---

## 13. Luồng AI Insight / Chat phân tích

### Mục tiêu nghiệp vụ

Biến số liệu forecast, tồn kho, doanh thu thành giải thích tiếng Việt dễ hiểu nhưng không thay đổi dữ liệu gốc.

### Luồng chuẩn

1. Frontend gửi context hoặc câu hỏi.
2. Backend gom dữ liệu liên quan từ PostgreSQL.
3. Backend dựng prompt có guardrail.
4. Backend gọi Gemini/Cerebras.
5. Backend sanitize output.
6. Frontend render markdown/answer.
7. Backend ghi audit nếu insight thuộc dữ liệu nhạy cảm.

### API chính

- `POST /api/v1/ai-insight/explain-forecast`
- `POST /api/v1/ai-insight/explain-risk`
- `POST /api/v1/ai-insight/chat`

### Rule bắt buộc

- LLM không được bịa số liệu.
- LLM chỉ đề xuất, không tự approve promotion/purchase.
- Nếu provider lỗi, trả lỗi AI có kiểm soát; không ảnh hưởng nghiệp vụ lõi.

---

## 14. Luồng dashboard, báo cáo và audit

### Mục tiêu nghiệp vụ

Cho Manager/Admin nhìn hiệu quả bán hàng, tồn kho, nhập hàng, công nợ, forecast và lịch sử thao tác.

### Luồng dashboard

1. Frontend gọi summary, sales report, inventory alerts, forecast summary.
2. Backend tổng hợp từ order, purchase, inventory, forecast.
3. UI hiển thị KPI và biểu đồ.
4. Sau giao dịch bán/nhập/kho, cache liên quan phải được evict hoặc dữ liệu tự refresh.

### Luồng báo cáo

- Sales report: doanh thu, số đơn, số item bán, lợi nhuận gộp.
- Purchase report: tổng nhập, số phiếu, nhà cung cấp.
- Inventory report: tồn, nhập/xuất, giá trị kho, cận date.
- Export Excel/PDF nếu cần in/đối soát.

### Luồng audit

Mọi thao tác thay đổi dữ liệu lõi phải ghi:

- Actor.
- Action.
- Entity type/id.
- Mô tả.
- Before data nếu có.
- After data nếu có.
- Timestamp.

### API chính

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/forecast-summary`
- `GET /api/v1/reports/sales`
- `GET /api/v1/reports/purchase`
- `GET /api/v1/reports/inventory`
- `GET /api/v1/audit-logs`

### Tiêu chí hoàn tất

- Số liệu dashboard khớp report theo cùng khoảng ngày.
- Audit log tìm được actor cho thao tác quan trọng.
- Report không tính order đã cancel như doanh thu thành công.

---

## 15. Ma trận nghiệp vụ theo vai trò

| Nghiệp vụ | Admin | Manager | Staff | Warehouse |
| --- | --- | --- | --- | --- |
| User/RBAC | Full | View limited | No | No |
| Master SKU/category/UOM | Full | Full | View | Full |
| POS bán hàng | Full | Full | Create/View own | No |
| Hủy hóa đơn | Full | Full | No | No |
| Trả hàng | Full | Full | Create theo policy | No |
| Nhập hàng | Full | Full | No | Create/View |
| Nhận hàng | Full | Full | No | Full |
| Chuyển kho | Full | Full | No | Full |
| Kiểm kê | Full | Full | No | Full |
| Hủy hàng | Full | Approve/Create | No | Create |
| Promotion | Full | Full | No | No |
| Forecast train/run | Full | Full | No | No |
| Forecast view | Full | Full | No | View limited nếu cần |
| Reports | Full | Full | No | Inventory/Purchase only |
| Audit logs | Full | View | No | No |

---

## 16. Checklist hoàn thiện hệ thống theo chuẩn production

### 16.1. Backend

- [ ] Mọi controller mới dùng `ApiResponse`.
- [ ] Mọi service ghi nhiều bảng có `@Transactional`.
- [ ] Không có nghiệp vụ nào update tồn ngoài `InventoryLedgerService`.
- [ ] SKU unique case-insensitive.
- [ ] Endpoint docs trong `04-api-specification.md` đồng bộ `/api/v1` thực tế.
- [ ] RBAC test cho từng nhóm API.
- [ ] Audit log đầy đủ cho create/update/cancel/approve/receive/confirm.
- [ ] AI fallback không ảnh hưởng POS/Purchase.

### 16.2. Frontend

- [ ] Mỗi màn nghiệp vụ có loading, empty, error, success state.
- [ ] POS barcode Enter nhanh, không cần chuột.
- [ ] Hóa đơn in chuẩn thermal/POS.
- [ ] Forecast UI hiển thị source `AI/FALLBACK`, job status và risk lane.
- [ ] Các bảng quan trọng có search/filter/status.
- [ ] Form nhập hàng bắt HSD khi SKU hasExpiry.

### 16.3. AI Service

- [ ] `/ai/health` trả version và model status.
- [ ] `/ai/train` lưu metrics.
- [ ] `/ai/forecast/all` trả đủ pred 7/14/30 ngày và daily series.
- [ ] SKU ít dữ liệu có moving-average/category baseline.
- [ ] Test regression cho forecast schema.

### 16.4. Data seed/demo

- [ ] Có SKU biến thể thực tế theo barcode/itemCode.
- [ ] Có dữ liệu bán 180 ngày cho forecast.
- [ ] Có item cận date, tồn dư, thiếu hàng, ổn định.
- [ ] Có phiếu nhập, tồn kho nhiều kho/lô.
- [ ] Có promotion/recommendation mẫu.

### 16.5. QA nghiệp vụ end-to-end

- [ ] Nhập hàng `PENDING` không cộng tồn.
- [ ] Receive nhập hàng cộng tồn và tạo log.
- [ ] Transfer kho tổng sang kho bán rồi POS bán được.
- [ ] POS bán trừ đúng FEFO.
- [ ] Return cộng tồn đúng lô/location.
- [ ] Stocktake confirm tạo adjustment đúng variance.
- [ ] Scrap create không trừ tồn, approve mới trừ.
- [ ] Forecast train async chạy job `DONE`.
- [ ] AI offline thì reorder fallback vẫn có dữ liệu.
- [ ] Promotion không áp cho đơn dưới min order.

---

## 17. Luồng vận hành chuẩn trong một ngày cửa hàng

1. Admin/Manager kiểm tra dashboard đầu ngày.
2. Warehouse xử lý cảnh báo thiếu hàng/cận date.
3. Nếu cần, tạo transfer từ kho tổng sang `Kho bán`.
4. Staff mở ca và bán POS.
5. Manager theo dõi doanh thu, hóa đơn lỗi, cảnh báo tồn.
6. Warehouse nhận hàng từ các phiếu nhập đã đặt.
7. Manager chạy forecast nếu có dữ liệu mới đáng kể.
8. Manager xem gợi ý nhập hàng và promotion.
9. Warehouse xử lý scrap cho hàng hết hạn/hỏng.
10. Staff đóng ca; Manager duyệt nếu lệch tiền.
11. Cuối ngày kiểm tra report sales/inventory và audit bất thường.

---

## 18. Định nghĩa "hoàn thiện" cho SmartMart AI

Hệ thống được xem là hoàn thiện nghiệp vụ khi:

1. Mỗi SKU là một biến thể hàng hóa độc lập, không nhập nhằng.
2. Tất cả biến động tồn đi qua ledger và có audit/log.
3. POS, Purchase, Transfer, Return, Stocktake, Scrap chạy end-to-end không lệch tồn.
4. AI forecast có dữ liệu đủ thật, có fallback và có giải thích dễ hiểu.
5. Promotion/reorder là đề xuất có duyệt, không tự ý thay đổi vận hành ngoài quyền Manager.
6. Dashboard/report khớp dữ liệu giao dịch.
7. UI mỗi luồng có trạng thái rõ, dễ thao tác, không cần hiểu code mới dùng được.
8. Test end-to-end phủ đủ các luồng ở mục 16.5.
