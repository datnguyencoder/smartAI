# 🛒 SmartMart AI - Hệ Thống Quản Lý Siêu Thị Mini & Tối Ưu Tồn Kho Bằng AI

SmartMart AI là nền tảng quản lý vận hành nội bộ thế hệ mới dành cho các siêu thị mini, tích hợp **Machine Learning (Học máy)** và **Trí tuệ nhân tạo (AI)** để giải quyết triệt để bài toán tối ưu hóa tồn kho, giảm thiểu tỷ lệ hàng hết hạn và tối đa hóa hiệu quả kinh doanh.

---

## 🚀 Tính Năng Nổi Bật (Features)

*   **⚡ Bán Hàng Tại Quầy (POS):** Giao diện bán hàng siêu tốc bằng phím tắt và quét mã vạch trực quan, tự động đồng bộ hóa kho hàng thời gian thực.
*   **📦 Quản Lý Kho & Biến Động Tồn (Stock Management):** Giám sát chi tiết từng lô hàng, số lượng tồn kho thực tế, lịch sử dịch chuyển dòng hàng (Stock Movement) và tự động kích hoạt cảnh báo khi hàng sắp hết.
*   **🔮 Dự Báo Nhu Cầu Bán Hàng (AI Forecasting):** Tích hợp công nghệ hiện đại (Polars, Nixtla, Foundation Models/TFT) phân tích dữ liệu lịch sử để dự báo chính xác nhu cầu khách hàng trong **7, 14 và 30 ngày** tới.
*   **🤖 Gợi Ý Nhập Hàng Tự Động (Smart Reordering):** Tính toán khối lượng đặt hàng tối ưu (Reorder Quantity) dựa trên tốc độ tiêu thụ dự kiến và thời gian giao hàng (Lead Time).
*   **💬 Trợ Lý Ảo Vận Hành (AI Assistant Chatbot):** Tích hợp mô hình ngôn ngữ lớn **Google Gemini API** dưới dạng một AI Agent độc lập, hỗ trợ người quản trị truy vấn số liệu kinh doanh, tạo nhanh phiếu nhập hàng và phân tích rủi ro bằng ngôn ngữ tự nhiên.
*   **📊 Báo Cáo Chuyên Sâu (Advanced BI):** Biểu đồ trực quan so sánh doanh thu thực tế và dự báo, phân tích tỷ trọng nhóm hàng và phân tích ABC/XYZ.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ chính |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Ant Design, TailwindCSS, Recharts |
| **Backend** | Spring Boot 3.2, JDK 21, JPA/Hibernate, Flyway Migration, JWT |
| **AI Service** | FastAPI (Python 3.10), Polars, LangChain (AI Agent), Nixtla/LightGBM |
| **Database** | PostgreSQL 16 |
| **Cache Layer** | Redis 7 |
| **Event Broker**| Apache Kafka 3.7.0 (KRaft mode) |

---

## 🐳 Hướng Dẫn Khởi Chạy Toàn Bộ Hệ Thống (Run Full System)

Hệ thống được thiết kế theo kiến trúc Microservices và đóng gói hoàn toàn bằng Docker. Bạn có thể khởi chạy toàn bộ 6 dịch vụ chỉ với vài lệnh đơn giản.

### 1. Yêu cầu hệ thống (Prerequisites)
* Đã cài đặt **Docker** và **Docker Compose** (Khuyến nghị dùng Docker Desktop phiên bản mới nhất).
* Tối thiểu **4GB RAM** khả dụng (Khuyến nghị 8GB+ để chạy mượt mà AI Service và Kafka).
* Git để clone mã nguồn (nếu chưa có).

### 2. Thiết lập Biến môi trường (Environment Setup)
Trước khi chạy, bạn cần cấu hình các biến môi trường, đặc biệt là API Key cho Trợ lý ảo Gemini.

Mở Terminal và thực hiện:
```bash
# Di chuyển vào thư mục docker
cd docker

# Tạo file .env từ file mẫu
cp .env.example .env
```

Mở file `docker/.env` vừa tạo và điền khóa API của bạn vào biến `GEMINI_API_KEY`:
```env
GEMINI_API_KEY=điền-api-key-cua-ban-vao-day
```
*(Các cấu hình Database, Redis, JWT Secret mặc định đã được thiết lập sẵn an toàn cho môi trường test).*

### 3. Build & Khởi chạy hệ thống (Start Services)
Vẫn đứng tại thư mục `docker` (hoặc đứng tại root directory và chỉ định đường dẫn file compose), chạy lệnh sau để build và start các container ở chế độ nền:

```bash
# Nếu đang đứng ở thư mục gốc của dự án:
docker compose -f docker/docker-compose.yaml up -d --build
```

Quá trình build có thể mất từ 2-5 phút trong lần chạy đầu tiên để tải các Docker image (PostgreSQL, Kafka, Redis, Python, Node, JDK) và biên dịch mã nguồn.

### 4. Kiểm tra trạng thái khởi động
Hệ thống có cơ chế `healthcheck` chặt chẽ, các dịch vụ sẽ tự động đợi nhau khởi động (Database/Kafka/Redis -> AI Service -> Backend -> Frontend).
Bạn có thể kiểm tra trạng thái bằng lệnh:
```bash
docker compose -f docker/docker-compose.yaml ps
```
Đợi đến khi tất cả các dịch vụ đều hiển thị trạng thái `(healthy)`.

---

## 🔌 Danh Sách Cổng Truy Cập (Access Endpoints)

Sau khi hệ thống khởi chạy thành công, truy cập các địa chỉ sau trên trình duyệt hoặc các công cụ test API:

| Ứng dụng | Địa chỉ truy cập (Localhost) | Mô tả |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Giao diện cho Quản lý & POS bán hàng |
| **Backend API (Spring Boot)** | [http://localhost:8080/api](http://localhost:8080/api) | Cổng gọi API chính của hệ thống nghiệp vụ |
| **Backend Swagger UI** | [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) | Tài liệu kiểm thử API RESTful của Spring Boot |
| **AI Service (FastAPI)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Tài liệu & Test API Dự báo, AI Agent (Swagger) |
| **PostgreSQL** | `localhost:5432` | Cổng Database (Dùng DBeaver/DataGrip để xem data) |
| **Redis** | `localhost:6379` | Cổng Cache bộ đệm |
| **Kafka** | `localhost:9092` | Cổng Message Broker |

---

## 🛠️ Quản lý & Gỡ lỗi (Troubleshooting)

### Xem Log của toàn bộ hệ thống:
```bash
docker compose -f docker/docker-compose.yaml logs -f
```

### Xem Log của một dịch vụ cụ thể (VD: backend hoặc ai-service):
```bash
docker compose -f docker/docker-compose.yaml logs -f backend
docker compose -f docker/docker-compose.yaml logs -f ai-service
```

### Dừng và xóa toàn bộ hệ thống (Xóa data):
Nếu muốn tắt hệ thống và **xoá sạch dữ liệu** (Database, Cache, Models đã lưu):
```bash
docker compose -f docker/docker-compose.yaml down -v
```

### Dừng hệ thống (Giữ lại data):
```bash
docker compose -f docker/docker-compose.yaml down
```

---

## 📚 Hệ Thống Tài bản liệu Chi Tiết (Deep Technical Documents)

Tham khảo thêm các tài liệu thiết kế nghiệp vụ và kiến trúc kỹ thuật trong thư mục `docs/`:
1. `docs/01-overview.md`: Tổng Quan Dự Án & Định Hướng MVP
2. `docs/02-business-rule.md`: Quy Tắc Nghiệp Vụ & Luồng Vận Hành
3. `docs/03-database-design.md`: Thiết Kế Cơ Sở Dữ Liệu
4. `docs/04-api-specification.md`: Đặc Tả API RESTful & Payload Mẫu
5. `docs/05-ai-forecasting.md`: Chi Tiết Lõi AI & Dự Báo Nhu Cầu
6. `docs/06-system-architecture.md`: Thiết Kế Kiến Trúc Hệ Thống
7. `docs/07-testing-plan.md`: Kế Hoạch Kiểm Thử Nghiệp Vụ
8. `docs/08-deployment-guide.md`: Hướng Dẫn Triển Khai

---
*SmartMart AI - Đưa trí tuệ nhân tạo vào từng quyết định vận hành bán lẻ.*
