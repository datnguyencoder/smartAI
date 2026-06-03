# SmartMart AI - Backend Coding Standards
## 09. CHUẨN MÃ NGUỒN BACKEND (SPRING BOOT)

---

Mọi thay đổi trong `backend/` **bắt buộc** tuân thủ tài liệu này. Rule Cursor: `.cursor/rules/backend-agent.mdc` tham chiếu file này làm nguồn chính.

**Liên kết:** [02-business-rule.md](02-business-rule.md) · [04-api-specification.md](04-api-specification.md) · [07-testing-plan.md](07-testing-plan.md)

---

### 1. Kiến trúc phân tầng (Layered Architecture)

```
HTTP Request
    → controller/     (REST, validation đầu vào, HTTP status, không logic nghiệp vụ)
    → service/        (nghiệp vụ, @Transactional, orchestration)
    → repository/     (Spring Data JPA, query)
    → entity/         (JPA entity — không expose trực tiếp ra API mới)
```

| Tầng | Được phép | Không được phép |
|------|-----------|-----------------|
| **Controller** | Gọi service, map DTO ↔ response, `@Valid`, OpenAPI | Truy cập `repository` trực tiếp; `@Transactional` nghiệp vụ phức tạp |
| **Service** | Quy tắc SYS-*; gọi repo; publish event | Trả về `ResponseEntity`; biết HTTP status |
| **Repository** | Query, `JpaRepository` | Logic if/else nghiệp vụ |
| **Entity** | Ánh xạ DB, quan hệ JPA (`entity/`) | Validation phức tạp; trả thẳng cho client (API mới) |

**Package thực tế** (khớp codebase — đã refactor interface + impl):

```
com.smartmart/
├── config/
├── controller/
├── service/          # *Service interfaces
├── service/impl/     # *ServiceImpl (@Service)
├── service/ai/       # AI interfaces (Forecast, Gemini, Reorder)
├── service/ai/impl/  # AI implementations
├── repository/
├── entity/
├── dto/              # request / response — bắt buộc cho API mới
├── mapper/           # Entity ↔ DTO (MapStruct hoặc mapper thủ công)
├── exception/
├── enums/
├── security/
├── constant/
├── common/           # ApiResponse, PageResponse, BaseEntity
└── event/            # Kafka producer/consumer (khi có)
```

> **Legacy:** `ProductController` nhận/trả `Product` entity — khi refactor hoặc thêm endpoint mới phải dùng DTO.

---

### 2. Quy ước đặt tên (Naming)

| Loại | Quy ước | Ví dụ |
|------|---------|--------|
| Class | PascalCase | `SalesOrderServiceImpl` |
| Interface service | `XxxService` | `ProductService` |
| Impl | `XxxServiceImpl` | `ProductServiceImpl` |
| Controller | `XxxController` | `ProductController` |
| Request DTO | `CreateXxxRequest`, `UpdateXxxRequest` | `CreateSalesOrderRequest` |
| Response DTO | `XxxResponse`, `XxxDetailResponse` | `ProductResponse` |
| Repository | `XxxRepository` | `ProductRepository` |
| Entity | Danh từ số ít | `Product`, `SalesOrder` |
| Enum | PascalCase | `OrderStatus`, `ProductStatus` |
| Constant class | `final` + private constructor | `AppConstant`, `KafkaTopicConstant` |
| Method | camelCase, động từ | `createProduct`, `adjustStock` |
| Biến | camelCase | `categoryId`, `orderItems` |

- Message lỗi / success cho user: **tiếng Việt**, rõ ràng.
- Log / comment kỹ thuật: tiếng Anh ngắn gọn khi cần.

---

### 3. API & HTTP

#### 3.1. Prefix và versioning

- Base path: **`/api/v1/`** (ví dụ: `/api/v1/products`, `/api/v1/auth/login`).
- Auth public: `/api/v1/auth/**` (theo `SecurityConfig`).

#### 3.2. Response envelope

Mọi endpoint REST trả về `ApiResponse<T>`:

```json
{
  "success": true,
  "message": "Thông điệp",
  "data": { },
  "timestamp": "2026-06-02T10:00:00"
}
```

- Thành công: `ResponseEntity` + `ApiResponse.success(...)`; tạo mới → `201 CREATED`.
- Lỗi: qua `GlobalExceptionHandler` → `ApiResponse.error(...)`; **không** leak stack trace ra client.

#### 3.3. Phân trang

- Dùng `Pageable` + `PageResponse.of(page)` cho danh sách.
- Default page/size: `AppConstant.DEFAULT_PAGE_NUMBER`, `DEFAULT_PAGE_SIZE`.

#### 3.4. OpenAPI (bắt buộc trên controller)

```java
@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product Management", description = "...")
@SecurityRequirement(name = "bearerAuth")
public class ProductController {
    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable UUID id) { ... }
}
```

#### 3.5. DTO vs Entity (API mới)

| Hướng | Chuẩn |
|-------|--------|
| Request body | `CreateXxxRequest` + `@Valid` |
| Response body | `XxxResponse` — **không** trả `passwordHash`, lazy proxy lỗi |
| Path/query | `UUID id`, primitive có `@Min`/`@NotNull` |

---

### 4. Dependency injection & class design

- **Constructor injection** duy nhất — không `@Autowired` field.
- Service: interface + `impl` package.
- Utility: `final class` + private constructor (`AppConstant`).
- Entity: `@Getter` `@Setter` hoặc `@Builder`; kế thừa `BaseEntity` (UUID `id`, `createdAt`, `updatedAt`).

```java
@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm với ID: " + id));
    }
}
```

---

### 5. Transaction & nghiệp vụ kho

| Quy tắc | Cách làm |
|---------|----------|
| SYS-06/07 | Một use-case ghi DB (bán hàng, nhập kho) = **một** `@Transactional` trên service method |
| Đọc | `@Transactional(readOnly = true)` trên query |
| SYS-04 | Không cho `quantity < 0` — ném `InsufficientStockException` hoặc `BadRequestException` |
| Stock movement | Mỗi thay đổi tồn phải ghi `StockMovement` (kèm `reason` / loại biến động) |
| SYS-05 | Không hard-delete master data có lịch sử — soft delete / `INACTIVE` |

**Không dùng** `IllegalArgumentException` cho lỗi nghiệp vụ — dùng:

- `NotFoundException`
- `BadRequestException`
- `InsufficientStockException`
- `ForbiddenException`
- `AppException(ErrorCode.XXX)` khi cần mã chuẩn

---

### 6. Exception & ErrorCode

- Mọi exception nghiệp vụ extends `AppException` hoặc các subclass trong `exception/` (`NotFoundException`, `BadRequestException`, `ConflictException`, `InsufficientStockException`, `ForbiddenException`, `UnauthorizedException`).
- `ErrorCode` enum map `HttpStatus` + message mặc định + tên dùng làm `errorCode` trả về FE.
- Controller **không** try-catch từng case — để `GlobalExceptionHandler` xử lý tập trung.
- Validation: `@Valid` trên DTO; field errors qua `MethodArgumentNotValidException` → `errors` map.

**Envelope lỗi (bắt buộc):**

```json
{ "success": false, "message": "...", "errorCode": "INSUFFICIENT_STOCK", "errors": { "field": "..." }, "timestamp": "..." }
```

- `success=false` cho **mọi** lỗi (kể cả validation — đã sửa bug cũ trả `true`).
- `errorCode` = tên hằng trong `ErrorCode` (xem bảng đầy đủ trong [04-api-specification.md](04-api-specification.md)).
- `data` null khi lỗi; `errors` chỉ với `VALIDATION_FAILED`.
- Dùng `ApiResponse.error(code, msg)` / `ApiResponse.validationError(msg, errors)`.
- **Không** `printStackTrace` — dùng SLF4J (`log.warn` cho 4xx, `log.error` cho 5xx).

---

### 7. Bảo mật & RBAC

- Stateless JWT; không session server-side.
- Method-level: `@PreAuthorize("hasRole('ADMIN')")` hoặc `hasAnyRole(...)` theo [02-business-rule.md](02-business-rule.md).
- Không trả `passwordHash`, JWT secret, internal keys trong API.
- Kiểm tra quyền tại **backend** — không chỉ dựa vào FE (SYS-09).

---

### 8. Persistence (JPA)

- ID: `UUID`, `@GeneratedValue(strategy = GenerationType.UUID)` qua `BaseEntity`.
- Quan hệ lazy mặc định; tránh N+1 — `@EntityGraph` hoặc fetch join có chủ đích.
- Enum nghiệp vụ: `@Enumerated(EnumType.STRING)`.
- Tiền tệ: `BigDecimal` — không `double`/`float`.
- Custom query: đặt tên rõ trong repository (`findLowStockProducts`, `findByOrderNumber`).

---

### 9. Logging

- Dùng SLF4J: `private static final Logger log = LoggerFactory.getLogger(Xxx.class);`
- `log.error("...", ex)` trong handler — **không** `ex.printStackTrace()` trong production path.
- Không log mật khẩu, token đầy đủ, PII nhạy cảm.

---

### 10. Tích hợp AI & hạ tầng

| Thành phần | Chuẩn |
|-----------|--------|
| FastAPI | Gọi qua `WebClient` trong `service/ai/` — timeout + fallback (SYS-10) |
| Gemini | Chỉ backend `service/ai/`, env `GEMINI_API_KEY` |
| Kafka | Publish **sau** commit transaction thành công |
| Redis | Cache đọc; không lưu source of truth (SYS-02) |

Chỉ thêm bean Kafka/Redis khi task thực sự dùng — tránh dead code.

---

### 11. Kiểm thử (Testing)

Theo [07-testing-plan.md](07-testing-plan.md):

- **Unit:** service với mock repository (`@ExtendWith(MockitoExtension.class)`).
- **Integration:** `@SpringBootTest` + `@Transactional` rollback cho flow POS/nhập kho.
- Mỗi endpoint mới: ít nhất happy path + 1 lỗi validation/404/403 tương ứng RBAC.

---

### 12. Checklist trước khi merge (PR)

- [ ] Chỉ sửa đúng lane `backend/` (trừ khi task tích hợp)
- [ ] Controller mỏng; logic trong service
- [ ] DTO cho API mới; OpenAPI đầy đủ
- [ ] `ApiResponse` + HTTP status đúng
- [ ] Exception chuẩn; message tiếng Việt
- [ ] Transaction + stock movement (nếu đụng tồn kho)
- [ ] RBAC `@PreAuthorize` khớp ma trận quyền
- [ ] Không secret trong code; dùng env/`application.yml`
- [ ] Test tối thiểu theo mục 11

---

### 13. Ví dụ endpoint chuẩn (mẫu mục tiêu)

```java
// dto/request/CreateSalesOrderRequest.java
public record CreateSalesOrderRequest(
        @NotEmpty List<@Valid OrderLineRequest> items,
        String customerName,
        @NotNull PaymentMethod paymentMethod
) {}

// controller
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
@Operation(summary = "Create POS sales order")
public ResponseEntity<ApiResponse<SalesOrderResponse>> create(
        @Valid @RequestBody CreateSalesOrderRequest request
) {
    SalesOrderResponse created = salesOrderService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Tạo hóa đơn thành công", created));
}
```

---

*Tài liệu 09 — phiên bản đồng bộ với Spring Boot 3.2.5 / Java 21 / codebase `com.smartmart`.*
