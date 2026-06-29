# SmartMart AI - DreamsPOS Feature Research & Roadmap

> Ngày nghiên cứu: 2026-06-29 · **Cập nhật triển khai: 2026-06-30**  
> Nguồn tham chiếu: DreamsPOS retail POS demo `https://dreamspos.dreamstechnologies.com/retail-pos/html/pos.html`  
> Mục tiêu: học luồng nghiệp vụ và độ phủ chức năng từ DreamsPOS để nâng SmartMart AI, không sao chép code, UI asset hoặc nhận diện thương mại của bên thứ ba.

---

## 0. Trạng thái triển khai (2026-06-30)

| Phase | Nội dung | Trạng thái |
| --- | --- | --- |
| **0** | Held orders server, customer debt/PAY_LATER, finance lite, stock adjustment/transfer, integration tests | **Done** |
| **1** | Receipt template settings, payment lines on receipt, return form, Z-report, POS cancel hold + auto-focus | **Done** |
| **2** | Stock transfer orders, purchase return, partial receive, barcode print, expired products, due/best-seller reports | **Done** |
| **3** | Finance categories, cash accounts, cash flow/P&L, discount plans, loyalty/tax settings UI | **Done** |
| **4** | Quotation, brands, gift cards, online order stub | **Done** |
| **5** | HRM payroll, multi-store SaaS, CMS | **Out of scope** |

**USP giữ nguyên:** ML forecast, AI reorder, Gemini promo suggest, AI assistant, inventory ledger, RBAC audit.

**Trang FE nghiệp vụ:** ~45 trang API-backed (tăng từ 32).

---

## 1. Kết luận nhanh

SmartMart AI hiện đã có lõi tốt cho mini supermarket:

- POS bán hàng, hóa đơn, trả hàng, ca làm việc.
- Catalog SKU/category/supplier/location/UOM.
- Nhập kho, tồn kho, lô hàng, kiểm kê, loại bỏ hàng.
- AI forecast, expiry risk, promotion recommendation, AI assistant.
- Báo cáo bán hàng/nhập hàng/tồn kho, audit log, RBAC.

Khoảng cách lớn so với DreamsPOS không nằm ở "màn hình đẹp hơn", mà nằm ở các phân hệ vận hành sâu:

1. POS workflow: quotation, hold order server-side, split bill nâng cao, pay later/customer debt, receipt/printer settings.
2. Stock operations: manage stock, stock adjustment, stock transfer, barcode/QR printing. SmartMart đã bắt đầu có adjustment/transfer từ vòng triển khai gần nhất.
3. Promo & loyalty: coupon, gift card, discount plan, customer points/deposit.
4. Finance: expenses, income, bank accounts, money transfer, cash flow, profit & loss.
5. Reports: best seller, supplier/customer due, product expiry, quantity alert, annual report.
6. Settings: invoice template, printer, POS settings, prefixes, tax rates, currencies.
7. HRM: employees, departments, attendance, leaves, payroll. Nhóm này chỉ nên làm sau khi POS/kho/tài chính ổn.

Khuyến nghị roadmap: ưu tiên chức năng tạo giá trị trực tiếp cho siêu thị mini trước, không bê toàn bộ enterprise template vào một lần.

> **Cập nhật 2026-06-30:** Phase 0–4 đã triển khai (xem mục 0). Các bảng Fit/Gap dưới đây là baseline trước triển khai; hầu hết mục P0–P2 đã đóng.

---

## 2. Phạm vi DreamsPOS đã khảo sát

DreamsPOS demo có các nhóm chức năng chính:

| Nhóm | Feature đáng chú ý | Ghi chú cho SmartMart |
| --- | --- | --- |
| Inventory | Products, Create Product, Expired Products, Low Stocks, Category, Sub Category, Brands, Units, Variant Attributes, Warranties, Print Barcode, Print QR Code | SmartMart đã có product/category/UOM/lô/HSD; thiếu brand, variant attributes, warranties, barcode/QR print chuyên dụng. |
| Stock | Manage Stock, Stock Adjustment, Stock Transfer | SmartMart đã có tồn kho/logs/stocktake; nên hoàn thiện adjustment/transfer thành flow có lịch sử và quyền rõ. |
| Sales | Online Orders, POS Orders, Invoices, Sales Return, Quotation, nhiều POS layout | SmartMart có POS/invoices/return; thiếu quotation và online order. |
| Promo | Coupons, Gift Cards, Discount Plan, Discount | SmartMart có promotion code và AI recommendation; thiếu gift card, discount plan, campaign lifecycle. |
| Purchase | Purchases, Purchase Order, Purchase Return | SmartMart có purchase order/supplier debt; thiếu purchase return. |
| Finance & Accounts | Expenses, Income, Bank Accounts, Money Transfer, Balance Sheet, Trial Balance, Cash Flow, Account Statement | SmartMart chưa có accounting ledger riêng; nên làm bản nhẹ cho mini-market trước. |
| Peoples | Customers, Billers, Suppliers, Stores, Warehouses | SmartMart có customers/suppliers/locations; thiếu biller/store profile. |
| HRM | Employees, Departments, Designation, Shifts, Attendance, Leaves, Holidays, Payroll | SmartMart có users và shifts; HRM đầy đủ nên để phase sau. |
| Reports | Sales, Best Seller, Purchase, Inventory, Stock History, Sold Stock, Invoice, Supplier Due, Customer Due, Product Expiry, Product Quantity Alert, Expense, Income, Tax, P&L, Annual | SmartMart có report nền; cần mở rộng theo các nghiệp vụ finance/debt/expiry. |
| Settings | Invoice settings/template, Printer, POS, Custom Fields, Payment Gateway, Tax Rates, Currencies | SmartMart có settings chung; thiếu settings chuyên POS/invoice/printer/tax/currency. |

---

## 3. Fit/Gap với SmartMart hiện tại

### 3.1. POS & Sales

| Feature | SmartMart hiện tại | Gap | Ưu tiên |
| --- | --- | --- | --- |
| Barcode scan POS | Có | Cần tối ưu scanner focus, batch scanning, âm báo lỗi/thành công | P1 |
| Hold order | Có ở FE/localStorage | Thiếu server-side held order, nhiều cashier, khôi phục sau đổi máy | P0 |
| Split payment | Có tiền mặt + bank, có payments BE | Cần mở nhiều method, validate overpay/change, receipt hiển thị đủ payment lines | P0 |
| Pay later/customer debt | Chưa có cho khách hàng | Cần customer receivable, due date, partial payment | P0 |
| Quotation | Chưa có | Cần báo giá -> chuyển thành order | P1 |
| Online orders | Chưa có | Có thể dùng cho web/mobile order hoặc nhập đơn từ marketplace | P2 |
| Receipt/printer settings | Có print HTML cơ bản | Thiếu template, khổ giấy, logo, footer, auto print | P1 |

### 3.2. Inventory & Stock

| Feature | SmartMart hiện tại | Gap | Ưu tiên |
| --- | --- | --- | --- |
| Manage stock | Có inventory page/logs | Cần filter theo SKU/location/lot mạnh hơn, bulk actions | P1 |
| Stock adjustment | Đã có API/page nền | Cần audit reason chuẩn, attachment, approval nếu lệch lớn | P0 |
| Stock transfer | Đã có API/page nền | Cần phiếu chuyển có trạng thái `DRAFT/PENDING/COMPLETED/CANCELLED` nếu vận hành nhiều kho | P0 |
| Stocktake | Có | Cần import Excel, compare variance, approve workflow | P1 |
| Expired/near expiry | Có expiry risk/near expiry | Cần màn expired products riêng + quick action scrap/promo | P1 |
| Barcode/QR print | Chưa có | Cần template tem, batch print theo SKU/lô | P1 |
| Brands/variants/warranty | Chưa có | Hữu ích khi catalog lớn; mini-market có thể để sau | P2 |

### 3.3. Purchase & Supplier

| Feature | SmartMart hiện tại | Gap | Ưu tiên |
| --- | --- | --- | --- |
| Purchase order | Có | Cần receive partial, purchase return, landed cost | P1 |
| Supplier debt | Có | Cần due report, payment schedule, export | P0 |
| Supplier item/pricing | Có nền supplier item | Cần price history, preferred supplier, reorder rule | P1 |
| Purchase return | Chưa có | Cần trả hàng NCC, trừ tồn, giảm công nợ nếu có | P1 |

### 3.4. Promotion & Loyalty

| Feature | SmartMart hiện tại | Gap | Ưu tiên |
| --- | --- | --- | --- |
| Promotion code | Có | Cần campaign lifecycle, usage limit, customer segment | P1 |
| AI promotion suggestion | Có | Cần one-click campaign tạo coupon | P1 |
| Gift card | Chưa có | Cần mã thẻ, balance, redeem history | P2 |
| Discount plan | Chưa có | Cần rule theo category/SKU/time/customer tier | P1 |
| Loyalty points | Có nền | Cần cấu hình rate, expiry points, tier benefits | P1 |

### 3.5. Finance & Reports

| Feature | SmartMart hiện tại | Gap | Ưu tiên |
| --- | --- | --- | --- |
| Sales/Purchase/Inventory report | Có | Cần best seller, invoice report, stock history/sold stock, annual report | P1 |
| Expense/Income | Chưa có | Cần ledger nhẹ cho chi phí/thu nhập ngoài bán hàng | P0 |
| Bank accounts/money transfer | Chưa có | Cần quản lý quỹ tiền mặt/ngân hàng, đối soát ca | P1 |
| Cash flow/P&L | Chưa có đầy đủ | Phụ thuộc expense/income/bank ledger | P1 |
| Supplier/customer due report | Supplier debt có nền, customer debt chưa có | Cần report công nợ hai chiều | P0 |

### 3.6. Settings & Admin

| Feature | SmartMart hiện tại | Gap | Ưu tiên |
| --- | --- | --- | --- |
| RBAC/users/audit | Có | Cần role permission granular nếu mở nhiều phân hệ finance | P1 |
| Invoice template | Chưa có đầy đủ | Cần logo/footer/tax/template | P1 |
| Printer/POS settings | Chưa có | Cần default printer, paper size, auto print, cash rounding | P1 |
| Tax/currency | Chưa có rõ | Cần VAT/tax inclusive/exclusive, currency display | P1 |
| Custom fields | Chưa có | Chỉ cần sau khi nghiệp vụ ổn định | P3 |

---

## 4. Roadmap đề xuất

### Phase 0 - Chuẩn hóa nền đang làm

Mục tiêu: không mở thêm phân hệ lớn khi lõi POS/kho chưa đủ chắc.

- Update docs API cho stock adjustment/transfer.
- Thêm integration test cho:
  - điều chỉnh tồn tăng/giảm;
  - điều chuyển kho;
  - không cho chuyển quá tồn;
  - không cho chuyển cùng kho.
- Chuẩn hóa receipt để hiển thị payment lines, tiền khách đưa, tiền thối.
- Chuẩn hóa inventory logs filter để nhìn được transfer in/out rõ ràng.

Kết quả mong muốn: BE/FE build pass, luồng kho không phá nguyên tắc ledger.

### Phase 1 - POS chuyên nghiệp

Mục tiêu: cashier dùng được trong cửa hàng thật.

- Server-side held order:
  - `POST /api/v1/pos/holds`
  - `GET /api/v1/pos/holds`
  - `POST /api/v1/pos/holds/{id}/restore`
  - `DELETE /api/v1/pos/holds/{id}`
- Customer debt/pay later:
  - thêm `CustomerDebt`, `CustomerDebtPayment`.
  - POS có payment method `PAY_LATER`.
  - report customer due.
- Receipt settings:
  - logo, store name/address, footer, paper width.
  - payment lines, cashier, shift id, barcode/QR order code.
- Split payment nâng cao:
  - nhiều dòng payment;
  - cash overpay/change;
  - card/wallet/bank reference code.

### Phase 2 - Kho & mua hàng nâng cao

Mục tiêu: quản lý tồn đầy đủ theo vận hành thực tế.

- Stock transfer order có trạng thái:
  - `DRAFT`, `PENDING`, `COMPLETED`, `CANCELLED`.
  - Hoàn thành mới ghi ledger.
- Stock adjustment approval:
  - lệch lớn cần Manager duyệt.
  - reason code: damage, count error, theft, supplier issue, internal use.
- Barcode/QR label printing:
  - SKU label;
  - lot/expiry label;
  - batch print theo PO receive.
- Purchase return:
  - trả hàng NCC từ PO hoặc tồn hiện tại;
  - trừ tồn;
  - cập nhật supplier debt/credit.

### Phase 3 - Finance mini-market

Mục tiêu: chủ cửa hàng nhìn được tiền thật.

- Status: đã triển khai bản lõi `finance_transactions` với danh sách thu/chi, tạo giao dịch và summary dòng tiền.
- Expense:
  - category: rent, salary, utilities, spoilage, delivery, misc.
  - payment account: cash, bank, wallet.
- Income ngoài POS:
  - service fee, rental, other income.
- Bank/cash account:
  - cash in/out;
  - money transfer;
  - shift settlement tie-in.
- Reports:
  - cash flow;
  - profit & loss;
  - supplier due;
  - customer due;
  - expense/income report.

### Phase 4 - Catalog & promo nâng cao

Mục tiêu: tăng doanh thu và quản lý SKU lớn hơn.

- Brand, variant attributes.
- Discount plan theo SKU/category/time/customer tier.
- Gift card balance.
- Loyalty settings:
  - earn rate;
  - redeem rate;
  - point expiry;
  - tier benefits.
- AI promotion one-click:
  - từ expiry/overstock recommendation tạo campaign/coupon.

### Phase 5 - HRM và enterprise extras

Mục tiêu: chỉ làm nếu SmartMart nhắm tới nhiều chi nhánh hoặc demo enterprise.

- Employee profile.
- Department/designation.
- Attendance/leave.
- Payroll.
- Multi-store/company/subscription nếu làm SaaS.

---

## 5. Backlog ưu tiên

| ID | Feature | Phân hệ | Giá trị | Độ khó | Phụ thuộc | Ưu tiên |
| --- | --- | --- | ---: | ---: | --- | --- |
| POS-01 | Server-side held orders | POS | 5 | 3 | Order draft entity | P0 |
| POS-02 | Pay later/customer debt | POS/Finance | 5 | 4 | Customer entity, payment flow | P0 |
| POS-03 | Receipt template/settings | POS/Settings | 4 | 2 | Settings API | P1 |
| POS-04 | Payment references & payment lines in receipt | POS | 4 | 2 | OrderPayment | P1 |
| INV-01 | Integration tests for stock adjustment/transfer | Inventory | 5 | 2 | Existing movement API | P0 |
| INV-02 | Transfer order lifecycle | Inventory | 4 | 4 | StockMovementService | P0 |
| INV-03 | Adjustment approval workflow | Inventory | 4 | 4 | RBAC/audit | P1 |
| INV-04 | Barcode/QR label printing | Inventory | 4 | 3 | Item/lot data | P1 |
| PUR-01 | Purchase return | Purchase | 4 | 4 | Purchase order + ledger | P1 |
| FIN-01 | Expenses/income ledger | Finance | 5 | 4 | Account master data | P0 |
| FIN-02 | Customer due report | Finance/Reports | 5 | 3 | Customer debt | P0 |
| FIN-03 | Cash flow/P&L | Finance/Reports | 5 | 4 | Expense/income/accounts | P1 |
| PRO-01 | Discount plan | Promo | 4 | 4 | Promotion rules | P1 |
| PRO-02 | Gift cards | Promo/POS | 3 | 4 | Payment flow | P2 |
| SET-01 | POS/printer settings | Settings | 4 | 3 | Settings API | P1 |
| CAT-01 | Brands/variants/warranty | Catalog | 3 | 4 | Item model migration | P2 |
| HRM-01 | Attendance/leaves/payroll | HRM | 2 | 5 | Employee model | P3 |

---

## 6. Đề xuất kiến trúc cho các phân hệ mới

### 6.1. Backend

Giữ chuẩn hiện tại:

- Controller chỉ nhận request/response, trả `ApiResponse<T>`.
- Service interface trong `service/`.
- Service implementation trong `service/impl/`.
- DTO request/response riêng, không expose entity.
- Transaction nằm ở service implementation.
- Mọi thay đổi tồn kho đi qua `InventoryLedgerService`.
- Mọi thao tác tiền/công nợ phải ghi audit log.

Các entity nên thêm theo thứ tự:

1. `HeldOrder`, `HeldOrderItem`.
2. `CustomerDebt`, `CustomerDebtPayment`.
3. `StockTransferOrder`, `StockTransferOrderItem`.
4. `Expense`, `ExpenseCategory`, `Income`, `IncomeCategory`.
5. `CashAccount`, `AccountTransaction`.
6. `ReceiptTemplateSetting` hoặc dùng `Setting` key-value nếu muốn nhanh.

### 6.2. Frontend

Giữ cấu trúc hiện tại:

- `services/*Api.ts` gọi endpoint.
- `types/api.ts` khai báo DTO.
- `pages/<domain>` cho màn nghiệp vụ.
- `app/config/navItems.ts`, `pageRoutes.ts`, `pageTitles.ts`, `permissions.ts` phải update cùng lúc khi thêm page.
- POS nên tách dần thành components:
  - `PosProductGrid`
  - `PosCartPanel`
  - `PosPaymentPanel`
  - `HeldOrdersDrawer`
  - `ReceiptModal`

### 6.3. AI

Không đưa AI vào mọi thứ. AI nên nằm ở các điểm tạo giá trị:

- Forecast reorder.
- Expiry risk.
- Promotion suggestion.
- Anomaly detection cho stock adjustment bất thường.
- Natural language summary cho báo cáo finance/cash flow.

---

## 7. Rủi ro nếu làm "full" không kiểm soát

- Quá nhiều module làm loãng chất lượng POS/kho, trong khi đây là lõi của mini supermarket.
- Finance sai sẽ nguy hiểm hơn thiếu finance, vì chủ cửa hàng có thể ra quyết định sai.
- HRM/payroll tốn nhiều rule địa phương, không nên làm trước khi sales/inventory/finance ổn.
- Copy UI/asset từ DreamsPOS có rủi ro bản quyền; chỉ nên học workflow.
- Transfer order từng bị gỡ trong blueprint, nên nếu khôi phục cần cập nhật docs và test đầy đủ.

---

## 8. Definition of Done cho từng feature mới

Một feature chỉ được xem là xong khi có đủ:

- BE API có DTO, validation, RBAC, transaction, exception chuẩn.
- Nếu liên quan tồn kho: ledger + inventory_logs đúng.
- Nếu liên quan tiền: audit + report/account transaction đúng.
- FE có page/service/type/route/nav/permission/title.
- Có test BE cho happy path và rule chính.
- `./mvnw test` pass.
- `npm run build` pass.
- Docs `04-api-specification.md` và `13-business-flow-blueprint.md` được cập nhật.

---

## 9. Ưu tiên triển khai ngay sau tài liệu này

Thứ tự nên làm tiếp:

1. Cập nhật docs API/blueprint cho stock adjustment/transfer đã thêm.
2. Thêm integration test cho stock movement.
3. Làm server-side held order.
4. Làm customer debt/pay later.
5. Nâng receipt/payment lines.
6. Làm expense/income ledger bản nhẹ.
7. Làm supplier/customer due reports.

Đây là đường đi cân bằng nhất: SmartMart sẽ mạnh lên giống POS thật, nhưng vẫn giữ được chất lượng code và không biến thành một template rối chức năng.
