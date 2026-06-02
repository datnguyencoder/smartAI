# 🛒 SmartMart AI - Hệ Thống Quản Lý Siêu Thị Mini & Tối Ưu Tồn Kho Bằng AI

SmartMart AI là nền tảng quản lý vận hành nội bộ thế hệ mới dành cho các siêu thị mini, tích hợp **Machine Learning (Học máy)** và **Trí tuệ nhân tạo (AI)** để giải quyết triệt để bài toán tối ưu hóa tồn kho, giảm thiểu tỷ lệ hàng hết hạn và tối đa hóa hiệu quả kinh doanh.

---

## 🚀 Tính Năng Nổi Bật (Features)

*   **⚡ Bán Hàng Tại Quầy (POS):** Giao diện bán hàng siêu tốc bằng phím tắt và quét mã vạch trực quan, tự động đồng bộ hóa kho hàng thời gian thực.
*   **📦 Quản Lý Kho & Biến Động Tồn (Stock Management):** Giám sát chi tiết từng lô hàng, số lượng tồn kho thực tế, lịch sử dịch chuyển dòng hàng (Stock Movement) và tự động kích hoạt cảnh báo khi hàng sắp hết.
*   **🔮 Dự Báo Nhu Cầu Bán Hàng (AI Forecasting):** Tích hợp mô hình học máy **XGBoost** và **Random Forest** phân tích dữ liệu lịch sử để dự báo chính xác nhu cầu khách hàng trong **7, 14 và 30 ngày** tới.
*   **🤖 Gợi Ý Nhập Hàng Tự Động (Smart Reordering):** Tính toán khối lượng đặt hàng tối ưu (Reorder Quantity) dựa trên tốc độ tiêu thụ dự kiến và thời gian giao hàng (Lead Time).
*   **📅 Cảnh Báo Hạn Sử Dụng (Expiry Risk Alerts):** Theo dõi hạn sử dụng theo từng lô hàng cụ thể, đưa ra cảnh báo rủi ro cận hạn và đề xuất chiến dịch khuyến mãi xả hàng tự động.
*   **💬 Trợ Lý Ảo Vận Hành (AI Assistant Chatbot):** Tích hợp mô hình ngôn ngữ lớn **Google Gemini API** hỗ trợ người quản trị truy vấn số liệu kinh doanh, tạo nhanh phiếu nhập hàng và phân tích rủi ro bằng ngôn ngữ tự nhiên.
*   **📊 Báo Cáo Chuyên Sâu (Advanced BI):** Biểu đồ trực quan so sánh doanh thu thực tế và dự báo, phân tích tỷ trọng nhóm hàng và hiệu quả của các gợi ý AI.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ chính | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Ant Design, TailwindCSS, Recharts | Giao diện quản trị viên & màn hình bán hàng POS tương tác cao, mượt mà. |
| **Backend** | Spring Boot 3.2.5, JDK 21, JPA/Hibernate, Flyway Migration, JWT | Trái tim điều phối hệ thống, quản trị nghiệp vụ cốt lõi, bảo mật phân quyền RBAC. |
| **AI Service** | FastAPI (Python 3.10), Scikit-Learn, Pandas, XGBoost, Google Gemini API | Engine xử lý số liệu học máy, huấn luyện mô hình dự báo và trợ lý ngôn ngữ ảo. |
| **Database** | PostgreSQL 16 | Hệ quản trị cơ sở dữ liệu quan hệ lưu trữ dữ liệu bền vững, ACID tuyệt đối. |
| **Cache Layer** | Redis 7 | Tăng tốc truy vấn Dashboard, bộ đệm lưu trữ kết quả dự đoán đắt đỏ của AI. |
| **Event Broker**| Apache Kafka 3.6 (KRaft mode) | Xử lý hàng đợi sự kiện bất đồng bộ (log doanh số, biến động kho) tăng độ nhạy API. |

---

## 📂 Cấu Trúc Thư Mục Dự Án (Repository Directory Structure)

Dự án được thiết lập dưới dạng một **Monorepo** chuẩn hóa, phân tách module rõ ràng để dễ dàng triển khai và tích hợp CI/CD:

```text
smartmart-ai/
├── backend/                # Dịch vụ Backend nghiệp vụ (Spring Boot)
│   ├── src/main/java/      # Mã nguồn logic phân tầng (Controller, Service, Repository)
│   ├── src/main/resources/ # File cấu hình application.yml & SQL Flyway migration
│   ├── pom.xml             # Quản lý dependencies Maven
│   └── Dockerfile          # Multi-stage build JDK 21
├── frontend/               # Giao diện người dùng (React + TS + Vite)
│   ├── src/                # Component, pages, styles, thư viện UI AntD & Tailwind
│   ├── package.json        # Định nghĩa các scripts khởi chạy (dev, build, preview)
│   └── Dockerfile          # Đóng gói Node Alpine chạy máy chủ phát triển Vite trực tiếp
├── ai-service/             # Dịch vụ Trí tuệ nhân tạo (FastAPI Python)
│   ├── app/                # API suy diễn, router trợ lý Gemini và huấn luyện XGBoost
│   ├── datasets/           # Dữ liệu CSV lịch sử dùng để train model
│   ├── requirements.txt    # Các thư viện Python Machine Learning
│   └── Dockerfile          # Môi trường chạy Python slim bảo mật non-root
├── docker/                 # Thư mục điều phối container
│   └── docker-compose.yaml # Orchestration chạy đồng bộ 6 dịch vụ trên cùng một mạng
├── docs/                   # Tài liệu phân tích hệ thống chi tiết (01-09, gồm chuẩn code BE)
└── README.md               # Tài liệu hướng dẫn sử dụng tổng quan này
```

---

## 🐳 Hướng Dẫn Khởi Chạy Nhanh Bằng Docker (Quick Start)

Hệ thống đã được đóng gói tối ưu hóa trong tệp tin Docker Compose, cho phép dựng toàn bộ hạ tầng (database, cache, broker, backend, frontend, AI) chỉ bằng một câu lệnh duy nhất.

### 1. Yêu Cầu Chuẩn Bị (Prerequisites)
*   Đã cài đặt **Docker** và **Docker Compose** trên máy (khuyến nghị Docker Desktop mới nhất).
*   Máy chủ chạy Docker có tối thiểu **4GB RAM** khả dụng để vận hành các container.

### 2. Thiết Lập Biến Môi Trường (Environment Variables)
Sao chép cấu hình mẫu hoặc bổ sung các khóa API (ví dụ: Google Gemini API Key để kích hoạt Trợ lý ảo AI) vào cấu hình môi trường của bạn. 

Các tham số mặc định bảo mật đã được thiết lập sẵn trong [docker-compose.yaml](file:///Users/datdev312/Documents/smartAi/docker/docker-compose.yaml):
*   `POSTGRES_USER`: `smartmart_admin`
*   `POSTGRES_PASSWORD`: `SuperSecurePassword2026`
*   `POSTGRES_DB`: `smartmart_db`
*   `GEMINI_API_KEY`: *(Thay thế khóa API thực tế của bạn tại biến môi trường này)*

### 3. Lệnh Khởi Chạy
Tại thư mục gốc của dự án, chạy lệnh Terminal sau để tải ảnh đĩa, tự động build mã nguồn và khởi chạy toàn bộ 6 container ở chế độ nền (detached mode):

```bash
docker compose -f docker/docker-compose.yaml up -d --build
```

### 4. Kiểm Tra Trạng Thái
Theo dõi tiến trình khởi tạo và tình trạng sức khỏe (Healthcheck) của các dịch vụ:

```bash
docker compose -f docker/docker-compose.yaml ps
```

---

## 🔌 Danh Sách Cổng Truy Cập Hệ Thống (Access Endpoints)

Sau khi Docker khởi chạy thành công, các dịch vụ sẽ mở cổng trên máy tính của bạn như sau:

| Dịch vụ | Địa chỉ truy cập / Cổng | Vai trò |
| :--- | :--- | :--- |
| **Ứng dụng Web** | [http://localhost:5173](http://localhost:5173) | Giao diện React (Vite dev server) |
| **API REST Backend** | [http://localhost:8080/api](http://localhost:8080/api) | Cổng gọi API Spring Boot chính |
| **Swagger UI (OpenAPI)**| [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) | Tài liệu tra cứu & chạy thử API Backend |
| **API AI Service** | [http://localhost:8000/ai/health](http://localhost:8000/ai/health) | Trạng thái hoạt động của FastAPI AI |
| **Cơ sở dữ liệu** | `localhost:5432` | Cổng kết nối PostgreSQL 16 |
| **Cache Layer** | `localhost:6379` | Cổng kết nối Redis 7 |
| **Message Broker** | `localhost:9092` | Cổng kết nối Apache Kafka |

---

## 🛠️ Phát Triển Không Dùng Docker (Local Development Guide)

Nếu bạn muốn chạy thử nghiệm từng dịch vụ độc lập trên máy chủ local để phục vụ quá trình debug mã nguồn nhanh:

### Khởi chạy Backend (Spring Boot)
1. Cài đặt JDK 21 và Maven.
2. Đảm bảo cổng cơ sở dữ liệu PostgreSQL (`5432`) đang chạy.
3. Chạy lệnh tại thư mục `/backend`:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### Khởi chạy Frontend (React + Vite)
1. Cài đặt Node.js v20 trở lên.
2. Chạy lệnh tại thư mục `/frontend`:
   ```bash
   npm install
   npm run dev
   ```

### Khởi chạy AI Service (FastAPI)
1. Cài đặt Python 3.10 và công cụ tạo virtualenv.
2. Chạy lệnh tại thư mục `/ai-service`:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Trên Windows dùng: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 📚 Hệ Thống Tài Liệu Chi Tiết (Deep Technical Documents)

Để tra cứu sâu hơn về từng thành phần nghiệp vụ và cấu trúc kỹ thuật của hệ thống, vui lòng tham khảo các tài liệu chuyên ngành được lưu trữ sẵn trong thư mục [docs/](file:///Users/datdev312/Documents/smartAi/docs/):

1.  📖 **[Tổng Quan Dự Án & Định Hướng MVP](file:///Users/datdev312/Documents/smartAi/docs/01-overview.md):** Khái quát bài toán kinh doanh, chân dung người dùng và cấu trúc monorepo tổng thể.
2.  ⚙️ **[Quy Tắc Nghiệp Vụ & Luồng Vận Hành](file:///Users/datdev312/Documents/smartAi/docs/02-business-rule.md):** Ma trận phân quyền RBAC chi tiết, quy trình POS, quy định nhập hàng, cách tính toán gợi ý tồn kho và công thức AI.
3.  🗄️ **[Thiết Kế Cơ Sở Dữ Liệu & Scripts DDL](file:///Users/datdev312/Documents/smartAi/docs/03-database-design.md):** Cấu trúc 16 bảng dữ liệu, kiểu dữ liệu thực tế và kịch bản khởi tạo SQL DDL chuẩn hóa.
4.  🔌 **[Đặc Tả API RESTful & Payload Mẫu](file:///Users/datdev312/Documents/smartAi/docs/04-api-specification.md):** Danh mục API, định dạng JSON phản hồi chung và dữ liệu mẫu truyền nhận giữa các hệ thống.
5.  🧠 **[Kiến Trúc Dự Báo AI & Tích Hợp Gemini](file:///Users/datdev312/Documents/smartAi/docs/05-ai-forecasting.md):** Phân tích mô hình học máy (XGBoost, Random Forest), đặc trưng chuỗi thời gian và cách kết nối Trợ lý ảo AI.
6.  🏗️ **[Thiết Kế Kiến Trúc Hệ Thống & Event-Driven](file:///Users/datdev312/Documents/smartAi/docs/06-system-architecture.md):** Sơ đồ liên kết vật lý, luồng truyền tải Kafka Event Topics và cơ chế ghi nhớ bộ đệm Redis.
7.  🧪 **[Kế Hoạch Kiểm Thử Nghiệp Vụ & Phục Hồi Lỗi](file:///Users/datdev312/Documents/smartAi/docs/07-testing-plan.md):** Kịch bản kiểm thử bảo mật vai trò, giao dịch POS ACID, kiểm tra nhập hàng và cơ chế tự động hạ cấp (fallback) khi dịch vụ AI ngoại tuyến.
8.  🚢 **[Hướng Dẫn Triển Khai & Khắc Phục Lỗi Docker](file:///Users/datdev312/Documents/smartAi/docs/08-deployment-guide.md):** Cấu hình phần cứng tối thiểu, danh sách biến môi trường chi tiết và quy trình xử lý lỗi kết nối cơ sở dữ liệu.

---

*Hệ thống được phát triển bởi đội ngũ kỹ sư SmartMart AI. Mọi đóng góp, báo lỗi xin vui lòng tạo Issue trên hệ thống quản lý mã nguồn.*
