# SmartMart AI - Hệ thống Quản lý Siêu thị Mini & Tối ưu Tồn kho bằng AI
## 08. HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG (DEPLOYMENT GUIDE)

---

### 1. Điều kiện tiên quyết để triển khai (Prerequisites)
Để khởi chạy toàn bộ hệ thống SmartMart AI một cách trơn tru, máy chủ hoặc máy tính cá nhân của bạn cần đáp ứng các yêu cầu tối thiểu sau:
*   **Hệ điều hành:** macOS (hỗ trợ cả chip Intel và Apple Silicon M1/M2/M3), Linux (Ubuntu, Debian, CentOS), hoặc Windows 11 (yêu cầu cài đặt WSL 2).
*   **Docker & Docker Compose:**
    *   Docker Engine phiên bản `24.0.0` trở lên.
    *   Docker Compose phiên bản `v2.20.0` trở lên.
*   **Cấu hình phần cứng tối thiểu:**
    *   RAM: Tối thiểu 8 GB RAM trống (Khuyên dùng 16 GB để chạy mượt mà do có Java Spring Boot và Kafka KRaft).
    *   CPU: Tối thiểu 4 Cores.
    *   Ổ cứng: Tối thiểu 10 GB dung lượng trống để lưu trữ Docker Images và Volume dữ liệu.
*   **Kết nối Internet:** Để tải các Docker Base Images ban đầu và kết nối thông suốt với Google Gemini API.

---

### 2. Sơ đồ phân bổ Cổng mạng (Network Port Mappings)
Khi hệ thống được khởi chạy bằng Docker Compose, các dịch vụ sẽ lắng nghe trên các cổng sau:

| Dịch vụ (Service) | Cổng mạng ngoài (Host Port) | Cổng mạng trong Container | Vai trò & Khả năng truy cập |
| :--- | :---: | :---: | :--- |
| **frontend** | `80` | `80` | Truy cập giao diện người dùng React thông qua trình duyệt web (`http://localhost`). |
| **backend** | `8080` | `8080` | Máy chủ REST API Spring Boot chính, phục vụ Swagger UI (`http://localhost:8080/swagger-ui/index.html`). |
| **ai-service** | `8000` | `8000` | Máy chủ FastAPI AI, phục vụ tài liệu API nội bộ (`http://localhost:8000/docs`). |
| **postgres** | `5432` | `5432` | Cơ sở dữ liệu PostgreSQL 16 (có thể kết nối từ DBeaver/pgAdmin bằng mật khẩu cấu hình). |
| **redis** | `6379` | `6379` | Cơ sở dữ liệu bộ nhớ đệm Redis 7. |
| **kafka** | `9092` | `9092` | Event Broker Apache Kafka (Giao tiếp nội bộ và bên ngoài). |

---

### 3. Từng bước Triển khai Hệ thống (Step-by-Step Deployment)

#### Bước 1: Clone mã nguồn dự án
Mở Terminal trên máy tính của bạn và di chuyển tới thư mục làm việc:
```bash
git clone <URL_REPOS_CỦA_BẠN> smartmart-ai
cd smartmart-ai
```

#### Bước 2: Cấu hình File Môi trường (`.env`)
Tạo một file đặt tên là `.env` tại thư mục gốc của dự án (hoặc trong thư mục `docker/`) để chứa các cấu hình bảo mật. Hệ thống Docker Compose sẽ tự động nạp các biến này:

```env
# ==========================================
# CẤU HÌNH DATABASE POSTGRES
# ==========================================
POSTGRES_DB=smartmart_db
POSTGRES_USER=smartmart_admin
POSTGRES_PASSWORD=SuperSecurePassword2026

# ==========================================
# CẤU HÌNH KHÓA BẢO MẬT & GEMINI API KEY
# ==========================================
JWT_SECRET=9a78a63584828f73b889312c1c38d6f5e8e89f81a7b8e910a11c12d13e14f15a
GEMINI_API_KEY=AIzaSyYourActualGeminiAPIKeyHere

# ==========================================
# CẤU HÌNH PHIÊN BẢN VÀ DỰ PHÒNG
# ==========================================
SPRING_PROFILES_ACTIVE=prod
FASTAPI_ENV=production
```

**Spring profiles:** Docker backend dùng `prod` (PostgreSQL hostname `postgres`). Chạy backend trong IDE dùng `local` (mặc định) — cùng schema Flyway, kết nối `localhost:5432` sau khi `docker compose up -d postgres`.

#### Bước 3: Khởi chạy hệ thống bằng Docker Compose
Chỉ cần thực hiện một câu lệnh duy nhất để Docker tự động tải mã nguồn, build các Dockerfile multi-stage, cài đặt các thư viện phụ thuộc và khởi tạo mạng nội bộ:

```bash
# Khởi chạy toàn bộ hệ thống dưới dạng chạy ngầm (detached mode)
docker compose -f docker/docker-compose.yaml up -d --build
```

> [!NOTE]
> Trong lần chạy đầu tiên, quá trình này có thể mất từ **5 đến 15 phút** tùy thuộc vào tốc độ mạng của bạn để tải các Docker Images cơ bản (Maven, Node, Python, Postgres, Kafka) và thực hiện biên dịch mã nguồn Java/React. Trong các lần chạy tiếp theo, nhờ cơ chế Docker Cache, quá trình này chỉ mất **dưới 30 giây**.

#### Bước 4: Kiểm tra trạng thái hoạt động các Container
Đảm bảo rằng toàn bộ 6 containers đều ở trạng thái `running` (hoặc `healthy` đối với các dịch vụ có cấu hình Healthcheck):

```bash
docker compose -f docker/docker-compose.yaml ps
```

Nếu mọi thứ hoạt động hoàn hảo, bạn sẽ thấy danh sách container hiển thị tương tự:
```
NAME                     IMAGE                      STATUS                  PORTS
docker-backend-1         smartmart-backend          Up 2 minutes (healthy)  0.0.0.0:8080->8080/tcp
docker-frontend-1        smartmart-frontend         Up 2 minutes            0.0.0.0:80->80/tcp
docker-ai-service-1      smartmart-ai-service       Up 2 minutes            0.0.0.0:8000->8000/tcp
docker-postgres-1        postgres:16-alpine         Up 2 minutes (healthy)  0.0.0.0:5432->5432/tcp
docker-redis-1           redis:7-alpine             Up 2 minutes (healthy)  0.0.0.0:6379->6379/tcp
docker-kafka-1           bitnami/kafka:3.6          Up 2 minutes (healthy)  0.0.0.0:9092->9092/tcp
```

#### Bước 5: Kiểm tra Nhật ký ghi lỗi (Logs) nếu có sự cố
Nếu một trong các container không khởi chạy được, hãy kiểm tra logs chi tiết của container đó:
```bash
# Xem logs của Spring Boot Backend
docker compose -f docker/docker-compose.yaml logs -f backend

# Xem logs của FastAPI AI
docker compose -f docker/docker-compose.yaml logs -f ai-service
```

---

### 4. Quản lý Dữ liệu Bền vững (Data Persistence)
Hệ thống Docker Compose cấu hình 3 volume độc lập để đảm bảo dữ liệu kinh doanh cốt lõi của siêu thị mini không bao giờ bị mất đi khi container bị tắt, khởi động lại hoặc xóa bỏ:
1.  **`postgres_data` (Volume cho PostgreSQL):** Ánh xạ trực tiếp thư mục `/var/lib/postgresql/data` của Postgres Container ra ngoài máy Host. Toàn bộ bảng dữ liệu, tài khoản nhân viên, hóa đơn bán hàng và phiếu nhập kho đều nằm tại đây.
2.  **`redis_data` (Volume cho Redis):** Lưu trữ tạm thời dữ liệu cache.
3.  **`ai_models_data` (Volume cho FastAPI AI):** Ánh xạ thư mục `/app/app/saved_models` của FastAPI ra ổ đĩa máy Host. Giúp bảo toàn file mô hình đã được huấn luyện tốt nhất (`.joblib`). Khi khởi động lại container, mô hình cũ vẫn sẵn sàng phục vụ dự báo ngay lập tức mà không cần tốn thời gian train lại từ đầu.

---

### 5. Xử lý các Sự cố Thường gặp (Troubleshooting)

#### 5.1. Lỗi xung đột cổng mạng (Port Conflict)
*   **Triệu chứng:** Xuất hiện thông báo lỗi: `Bind for 0.0.0.0:8080 failed: port is already allocated` hoặc tương tự đối với cổng `80` / `5432`.
*   **Giải pháp:** Máy tính của bạn đang có phần mềm khác chiếm giữ cổng này (ví dụ: pgAdmin chiếm cổng 5432, một server Nginx/Skype chiếm cổng 80). Hãy tắt ứng dụng đó hoặc mở file `docker-compose.yaml` sửa cổng ngoài (phần số trước dấu hai chấm, ví dụ: `8080:8080` thành `8081:8080`) rồi chạy lại.

#### 5.2. Lỗi tràn bộ nhớ RAM (Docker Out of Memory)
*   **Triệu chứng:** Container Kafka hoặc Spring Boot đột ngột bị tắt (Exit với mã lỗi `137`).
*   **Giải pháp:** Docker Desktop trên macOS mặc định chỉ cấp 2 GB RAM cho các container, dẫn đến việc thiếu tài nguyên khi chạy cả Java JVM và Kafka KRaft.
    *   Mở Docker Desktop Settings -> Resources -> Advanced.
    *   Tăng RAM cấp phép lên tối thiểu **4 GB** (Khuyên dùng **6 GB - 8 GB** nếu máy có RAM dư dả).
    *   Bấm Apply & Restart Docker và chạy lại lệnh khởi động.

#### 5.3. Không kết nối được Google Gemini API
*   **Triệu chứng:** Dashboard hoạt động bình thường nhưng khi bấm "Phân tích bằng AI", hệ thống hiển thị lỗi xoay tròn hoặc báo *"Lỗi kết nối dịch vụ trí tuệ nhân tạo"*. Logs backend báo lỗi `401 Unauthorized` hoặc `Connection Timeout` khi gọi sang Google API.
*   **Giải pháp:**
    *   Kiểm tra lại khóa `GEMINI_API_KEY` trong file `.env` đã chính xác chưa (đảm bảo không chứa khoảng trắng thừa).
    *   Đảm bảo máy chủ triển khai có thể ping thông suốt sang địa chỉ `generativelanguage.googleapis.com`. Nếu ở môi trường mạng bị chặn, hãy cấu hình Proxy hoặc VPN.
