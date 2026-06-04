# SmartMart AI - Hệ thống Quản lý Siêu thị Mini & Tối ưu Tồn kho bằng AI
## 01. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

---

### 1. Giới thiệu dự án (Project Context)
**SmartMart AI** là hệ thống phần mềm quản lý nội bộ toàn diện (Internal Enterprise Resource Planning - ERP) dành riêng cho các siêu thị mini và cửa hàng bán lẻ tiện lợi. Hệ thống tích hợp giữa các nghiệp vụ bán hàng truyền thống và sức mạnh của trí tuệ nhân tạo (Machine Learning/AI) để giải quyết bài toán nan giải nhất trong ngành bán lẻ: **Tối ưu hóa quản lý hàng tồn kho**.

Trong mô hình siêu thị mini, các rủi ro lớn nhất bao gồm:
*   **Nhập thừa hàng (Overstock):** Dẫn đến đọng vốn, tốn diện tích lưu kho và tăng tỷ lệ hàng hết hạn phải hủy bỏ.
*   **Hết hàng bán (Out of stock):** Dẫn đến mất cơ hội doanh thu và làm giảm trải nghiệm mua sắm của khách hàng.
*   **Nhập hàng theo cảm tính:** Người quản lý không có số liệu dự báo khoa học về nhu cầu tiêu dùng thực tế của thị trường trong các khoảng thời gian sắp tới.

**SmartMart AI** ra đời nhằm số hóa toàn bộ quy trình vận hành và tự động hóa đưa ra các gợi ý nhập hàng tối ưu bằng mô hình học máy chuyên sâu.

---

### 2. Trọng tâm của hệ thống (Project Focus & MVP Scope)
Hệ thống tập trung tối đa vào trải nghiệm vận hành và quản lý nội bộ của siêu thị, loại bỏ hoàn toàn phần website bán hàng online cho khách hàng trong phiên bản MVP này để tập trung nguồn lực xây dựng lõi nghiệp vụ thông minh:
*   **Quản lý vận hành nội bộ:** Quản trị tập trung người dùng, phân quyền chi tiết, quản lý danh mục, nhà cung cấp, và hàng hóa.
*   **Bán hàng tại quầy (Sales POS):** Hỗ trợ nhân viên thu ngân quét mã vạch sản phẩm, kiểm tra tồn kho tức thời, tạo hóa đơn nhanh chóng và ghi nhận doanh thu.
*   **Nhập kho (Purchase Management):** Lập phiếu nhập hàng, quản lý thông tin nhà cung cấp, theo dõi lịch sử giá nhập và hạn sử dụng sản phẩm.
*   **Quản lý tồn kho thông minh:** Tự động phân loại trạng thái kho, theo dõi biến động kho chi tiết (Stock Movement), cảnh báo hàng hết hạn và hàng cận date.
*   **Hệ thống AI Forecasting:** Dự báo chính xác nhu cầu tiêu dùng của từng mã sản phẩm trong **7 ngày**, **14 ngày** và **30 ngày** tới.
*   **Đề xuất nhập hàng (Reorder Recommendations):** Tự động tính toán lượng hàng tối ưu cần nhập dựa trên kết quả dự báo và mức tồn kho thực tế.
*   **Dashboard hỗ trợ ra quyết định:** Trực quan hóa doanh thu, lợi nhuận, biểu đồ so sánh doanh số thực tế và dự báo, cảnh báo rủi ro cận date và tồn kho cao, tích hợp trợ lý Gemini AI để tóm tắt dữ liệu bằng ngôn ngữ tự nhiên.

---

### 3. Mục tiêu dự án (Project Objectives)

#### 3.1. Mục tiêu nghiệp vụ (Business Goals)
*   **Tối ưu hóa dòng vốn lưu động:** Giảm thiểu tối đa tình trạng tồn kho dư thừa (Overstock) thông qua việc đề xuất chính xác số lượng cần nhập.
*   **Giảm thiểu tỷ lệ thất thoát hàng hóa:** Phát hiện sớm các sản phẩm cận date (Near Expiry) và đề xuất các chương trình khuyến mãi để kích cầu trước khi sản phẩm hết hạn sử dụng.
*   **Nâng cao doanh số:** Hạn chế tối đa tình trạng đứt gãy nguồn cung sản phẩm đang bán chạy thông qua các cảnh báo tồn kho thấp (Low Stock) và rủi ro hết hàng (High Risk).
*   **Chuẩn hóa quy trình ra quyết định:** Thay thế phương pháp quản lý thủ công, nhập hàng theo cảm tính bằng các quyết định dựa trên dữ liệu lịch sử và mô hình dự báo chính xác.

#### 3.2. Mục tiêu kỹ thuật (Technical Goals)
*   **Kiến trúc Microservices/Tách biệt:** Xây dựng hệ thống web hiện đại bằng **React** (Frontend) kết hợp với **Spring Boot** (Backend chính), và một dịch vụ trí tuệ nhân tạo chuyên biệt chạy bằng **FastAPI** (AI Service).
*   **Đảm bảo tính bền vững dữ liệu:** Sử dụng hệ quản trị cơ sở dữ liệu **PostgreSQL** làm nguồn lưu trữ chính (Source of Truth).
*   **Tối ưu hóa hiệu năng đọc:** Tận dụng **Redis** để lưu trữ bộ nhớ đệm (Cache) cho các dữ liệu nặng như số liệu báo cáo Dashboard, kết quả dự báo của AI và quản lý Blacklist Token JWT.
*   **Xử lý bất đồng bộ, kiến trúc hướng sự kiện (EDA):** Dùng **Apache Kafka** làm Event Broker để gửi và xử lý các sự kiện (bán hàng thành công, nhập hàng thành công, dự báo hoàn thành) một cách bất đồng bộ, giúp tăng hiệu năng hệ thống core và giảm thời gian phản hồi API.
*   **Bảo mật & Phân quyền chặt chẽ:** Sử dụng **Spring Security + JWT** để triển khai cơ chế xác thực người dùng và phân quyền chi tiết đến từng API Endpoint dựa trên Role.
*   **Độc lập môi trường bằng Docker:** Đóng gói toàn bộ các dịch vụ trên vào các Container độc lập và quản lý tập trung bằng **Docker Compose**, giúp triển khai hệ thống nhanh chóng chỉ với một câu lệnh.

---

### 4. Đối tượng sử dụng hệ thống (System Actors & Roles)

Hệ thống được thiết kế để phục vụ cho 4 nhóm đối tượng người dùng nội bộ trong siêu thị mini:

| Actor (Vai trò) | Quyền hạn và Nhiệm vụ cốt lõi |
| :--- | :--- |
| **Admin (Quản trị viên hệ thống)** | • Quản lý toàn bộ tài khoản người dùng (tạo mới, sửa thông tin, khóa/mở khóa tài khoản).<br>• Phân bổ vai trò (Role) cho nhân viên.<br>• Cấu hình các thông số hệ thống và giám sát hệ thống. |
| **Manager (Quản lý cửa hàng)** | • Quản lý toàn bộ Master Data: danh mục, sản phẩm, nhà cung cấp.<br>• Quản lý quy trình nhập kho và phê duyệt phiếu nhập hàng.<br>• Theo dõi báo cáo kinh doanh, báo cáo tài chính và hiệu quả kho.<br>• Thực hiện huấn luyện mô hình AI (Model Retrain) và chạy dự báo nhu cầu (Run Forecast).<br>• Xem và phê duyệt các gợi ý nhập hàng và chương trình khuyến mãi đề xuất.<br>• Tương tác với trợ lý Gemini AI để phân tích số liệu. |
| **Staff (Nhân viên bán hàng / Thu ngân)** | • Thực hiện giao dịch bán hàng trực tiếp tại quầy thông qua màn hình POS bán hàng.<br>• Tìm kiếm nhanh sản phẩm, quét mã vạch và tạo hóa đơn bán hàng.<br>• Xem thông tin cơ bản của sản phẩm và lượng tồn kho thực tế tại quầy. |
| **Warehouse Staff (Nhân viên kho)** | • Quản lý danh mục, nhà cung cấp và sản phẩm.<br>• Lập phiếu nhập kho khi hàng cập bến.<br>• Theo dõi sát sao mức tồn kho thực tế, cập nhật thông tin vị trí lưu kho.<br>• Tiếp nhận và xử lý các cảnh báo tồn kho thấp, hàng hết hạn.<br>• Xem danh sách gợi ý nhập hàng để chủ động chuẩn bị bến bãi nhập kho. |

---

### 5. Cấu trúc thư mục toàn dự án (Project Directory Structure)
Toàn bộ dự án được tổ chức đồng bộ dưới dạng một Monorepo để dễ dàng quản lý, đóng gói và cấu hình Docker:

```
smartmart-ai/
├── backend/                # Source code chính của Backend (Spring Boot 3.2.5)
│   ├── src/main/java/      # Mã nguồn Java (com.smartmart)
│   ├── src/main/resources/ # Các file cấu hình application.yml và SQL Flyway migration
│   ├── pom.xml             # Quản lý dependencies của Maven
│   └── Dockerfile          # Dockerfile đóng gói Spring Boot sử dụng Eclipse Temurin JRE
├── frontend/               # Source code của giao diện người dùng (React + Vite + TS)
│   ├── src/                # Mã nguồn UI, components, hooks, pages và services
│   ├── package.json        # Danh sách dependencies của node và các scripts khởi động
│   └── Dockerfile          # Dockerfile đóng gói và khởi chạy React app thông qua Node.js (Vite)
├── ai-service/             # Dịch vụ AI & ML độc lập (FastAPI Python)
│   ├── app/                # Mã nguồn API FastAPI, routers, schemas, services và saved_models
│   ├── datasets/           # Thư mục chứa dữ liệu CSV mẫu để huấn luyện mô hình
│   ├── requirements.txt    # Danh sách thư viện Python (pandas, scikit-learn, xgboost...)
│   └── Dockerfile          # Dockerfile đóng gói Python app chạy dưới quyền non-root
├── database/               # Thư mục lưu trữ tài liệu thiết kế database, scripts backup dữ liệu
├── docs/                   # Tài liệu kỹ thuật chi tiết của hệ thống (01-09)
├── docker/                 # Chứa cấu hình Docker Compose
│   └── docker-compose.yaml # Docker Compose file chuẩn hóa toàn bộ hệ thống
└── README.md               # Hướng dẫn tổng quan về dự án và các lệnh khởi chạy cơ bản
```

---

### 6. Mục lục tài liệu kỹ thuật (`docs/`)

| File | Nội dung |
| :--- | :--- |
| [01-overview.md](01-overview.md) | Tổng quan dự án |
| [02-business-rule.md](02-business-rule.md) | Quy tắc nghiệp vụ & RBAC |
| [03-database-design.md](03-database-design.md) | Thiết kế CSDL |
| [04-api-specification.md](04-api-specification.md) | Đặc tả REST API |
| [05-ai-forecasting.md](05-ai-forecasting.md) | ML & Gemini |
| [06-system-architecture.md](06-system-architecture.md) | Kiến trúc hệ thống |
| [07-testing-plan.md](07-testing-plan.md) | Kế hoạch kiểm thử |
| [08-deployment-guide.md](08-deployment-guide.md) | Triển khai Docker |
| **[09-backend-coding-standards.md](09-backend-coding-standards.md)** | **Chuẩn code Backend (bắt buộc)** |
| [10-frontend-coding-standards.md](10-frontend-coding-standards.md) | Chuẩn code Frontend |
| [11-team-onboarding.md](11-team-onboarding.md) | Onboarding & Docker |
| [12-kaggle-retail-datasets.md](12-kaggle-retail-datasets.md) | Dataset retail cho AI |
