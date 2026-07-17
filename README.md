# 🛒 SmartMart AI — Intelligent Retail Management System

**SmartMart AI** là nền tảng quản lý vận hành thế hệ mới cho siêu thị mini, tích hợp **Machine Learning** và **AI** để tối ưu hóa tồn kho, dự báo nhu cầu bán, và tối đa hóa hiệu quả kinh doanh.

> 🚀 **Status:** Production-ready | 📊 **Monitoring:** Prometheus + Grafana + Uptime Kuma | 🔄 **CI/CD:** GitHub Actions → VPS

---

## 📑 Mục Lục

- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Tech Stack](#-tech-stack)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cấu Trúc Project](#-cấu-trúc-project)
- [Quick Start (Local)](#-quick-start-local)
- [Production Deployment](#-production-deployment-vps)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Monitoring & Alerting](#-monitoring--alerting)
- [Development Guidelines](#-development-guidelines)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Tính Năng Nổi Bật

### 🎯 **POS & Bán Hàng**
- ⚡ **Giao diện bán hàng siêu tốc** với phím tắt & quét mã vạch thẩm
- 💳 **Thanh toán linh hoạt** — tiền mặt, ngân hàng, chia tiền
- 📝 **Quản lý hoàn đơn** & in hoá đơn thẩm
- 💰 **Quản lý ca làm việc** — số dư đầu ca, chia tiền, báo cáo doanh thu

### 📦 **Quản Lý Kho**
- 📊 **Biến động tồn kho thực tế** — lô hàng, hạn sử dụng, vị trí
- ⚠️ **Cảnh báo tự động** — hàng sắp hết, hạn sắp hết, quá hạn
- 📋 **Kiểm kê định kỳ** & điều chỉnh tồn
- 🚚 **Yêu cầu chuyển kho** & duyệt
- 🗑️ **Hủy hàng** — do hỏng, quá hạn, test

### 🤖 **AI & Dự Báo**
- 🔮 **Dự báo nhu cầu 7/14/30 ngày** — dùng XGBoost/scikit-learn
- 💡 **Gợi ý nhập hàng tự động** — tính toán đơn hàng tối ưu
- 🧠 **Trợ lý ảo vận hành** — hỏi Gemini về kinh doanh/kho hàng
- 📈 **Phân tích ABC/XYZ** — xác định sản phẩm trọng điểm

### 📊 **Báo Cáo & BI**
- 📉 **Biểu đồ doanh thu thực tế vs. dự báo**
- 🎯 **Phân tích tỷ trọng nhóm hàng** — top sellers/worst performers
- 💼 **Báo cáo công nợ NCC & khách hàng**
- 🗂️ **Báo cáo tài chính** — nhập/xuất/hoàn/khoản công nợ

### 🛡️ **Quản Trị**
- 👥 **Phân quyền chi tiết** — admin, staff, nhân viên kho
- 🔍 **Audit log** — theo dõi mọi thay đổi
- ⚙️ **Cấu hình kho hàng** — mở rộng nhóm/danh mục, nhà cung cấp

---

## 🛠️ Tech Stack

| Lớp | Công Nghệ |
|-----|-----------|
| **Frontend** | React 18 + TypeScript + Vite + Ant Design + TailwindCSS + Recharts |
| **Backend** | Spring Boot 3.2 + JDK 21 + JPA/Hibernate + Flyway |
| **AI Service** | FastAPI (Python 3.10+) + pandas + scikit-learn + XGBoost |
| **Database** | PostgreSQL 16 + UUID/JSONB |
| **Cache** | Redis 7 |
| **Message Broker** | Apache Kafka 3.7 (KRaft) |
| **Monitoring** | Prometheus + Grafana 11 + Uptime Kuma |
| **CI/CD** | GitHub Actions → Docker → VPS (SSH deploy) |

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React 18)                    │
│    Vite + TS + Ant Design + TailwindCSS + Recharts      │
│                   :5173 (localhost)                      │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend (Spring Boot 3.2)              │
│  JWT Auth → Business Logic → Entity/Repository/Service  │
│          :8080/api (localhost/VPS)                      │
└─────────────────────────────────────────────────────────┘
       ↙                    ↓                      ↘
   ┌─────────────┐   ┌────────────┐       ┌──────────────┐
   │ PostgreSQL  │   │   Redis    │       │  Kafka       │
   │ :5432       │   │  :6379     │       │ :9092        │
   │  (Data)     │   │  (Cache)   │       │ (Events)     │
   └─────────────┘   └────────────┘       └──────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│              AI Service (FastAPI)                       │
│  Forecasting + XGBoost/scikit-learn ML Models           │
│          :8000/docs (localhost/VPS)                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         Monitoring & Observability                       │
│  Prometheus :9090 → Grafana :3000 + Uptime Kuma :3001  │
│  (Node Exporter, PostgreSQL Exporter, Redis Exporter)   │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu Trúc Project

```
smartAi/
├── backend/                          # Spring Boot 3.2 (Java 21)
│   ├── src/main/java/com/smartmart/
│   │   ├── controller/              # REST endpoints
│   │   ├── service/                 # Business logic
│   │   ├── entity/                  # JPA entities
│   │   ├── repository/              # Data access
│   │   ├── dto/                     # Request/Response DTOs
│   │   └── config/                  # Security, WebSocket, Kafka
│   ├── src/main/resources/
│   │   ├── application.yml           # Shared config
│   │   ├── application-local.yml     # Local dev config
│   │   ├── application-prod.yml      # Production config
│   │   └── db/migration/             # Flyway migrations (V1, V2, ...)
│   ├── pom.xml                       # Maven dependencies
│   └── Dockerfile
│
├── ai-service/                       # FastAPI (Python 3.10+)
│   ├── app/
│   │   ├── main.py                   # FastAPI app + routes
│   │   ├── routers/
│   │   │   ├── forecast.py           # /ai/forecast/* endpoints
│   │   │   ├── train.py              # /ai/train endpoints
│   │   │   ├── health.py             # /ai/health endpoint
│   │   │   └── metrics.py            # /metrics (Prometheus)
│   │   └── services/
│   │       ├── model_store.py        # Model management
│   │       ├── forecast_service.py   # Forecasting logic
│   │       └── training_service.py   # Model training
│   ├── models/                       # Trained ML models (*.joblib)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                         # React 18 + Vite
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── sales/               # POS, Orders, Returns
│   │   │   ├── inventory/           # Stock, Stocktake, Alerts
│   │   │   ├── purchases/           # PO, Suppliers
│   │   │   ├── finance/             # Transactions, Reports
│   │   │   ├── operations/          # Shifts, Customers
│   │   │   ├── forecasting/         # AI Forecasts
│   │   │   └── admin/               # Settings, Users
│   │   ├── components/               # Reusable components
│   │   ├── services/                 # API calls (axios)
│   │   ├── context/                  # Global state
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── Dockerfile
│
├── docker/                           # Docker & Infrastructure
│   ├── docker-compose.yaml           # Local dev (5173, 8080, 8000, 5432, 6379, 9092)
│   ├── docker-compose.prod.yaml      # Production (no ports exposed)
│   ├── docker-compose.monitoring.yaml # Prometheus, Grafana, Uptime Kuma
│   ├── .env.example                  # Environment template
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf                # Reverse proxy config
│   ├── observability/
│   │   ├── prometheus/
│   │   │   ├── prometheus.yml        # Scrape configs
│   │   │   └── alert-rules.yml       # Alert rules
│   │   ├── grafana/
│   │   │   ├── Dockerfile
│   │   │   └── dashboards/           # Provisioned dashboards
│   │   └── uptime-kuma/
│   │       └── kuma.db               # SQLite database
│   └── scripts/
│       ├── init-db.sh
│       └── backup-db.sh
│
├── docs/                             # Technical documentation
│   ├── 01-overview.md
│   ├── 02-business-rule.md
│   ├── 03-database-design.md
│   ├── 04-api-specification.md
│   ├── 05-ai-forecasting.md
│   ├── 06-system-architecture.md
│   └── 07-deployment-guide.md
│
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD: build → push GHCR → deploy VPS
│
├── README.md                         # This file
├── MONITORING.md                     # Monitoring setup guide
└── db_seed.sql                       # Initial sample data
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- **Docker Desktop** (4.0+) — hoặc Docker + Docker Compose
- **4GB+ RAM** khả dụng (8GB+ nên dùng cho full stack)
- **Git**
- (Optional) **Node.js 18+** nếu muốn chạy frontend locally
- (Optional) **JDK 21** nếu muốn chạy backend locally

### 1️⃣ Clone & Setup

```bash
git clone https://github.com/datnguyencoder/smartAI.git
cd smartAi

# Copy environment template
cp docker/.env.example docker/.env

# Edit .env để thêm API keys (nếu cần)
# - GEMINI_API_KEY (cho AI Assistant)
# - GITHUB_TOKEN (nếu deploy via GitHub Actions)
```

### 2️⃣ Run Full Stack (Docker Compose)

```bash
# Start tất cả services (backend, ai-service, frontend, postgres, redis, kafka)
docker compose -f docker/docker-compose.yaml up -d --build

# Kiểm tra trạng thái
docker compose -f docker/docker-compose.yaml ps

# Xem logs
docker compose -f docker/docker-compose.yaml logs -f
```

Đợi ~30-60s cho tất cả services khởi động thành công.

### 3️⃣ Access Services

| Service | URL | Mô Tả |
|---------|-----|-------|
| **Frontend** | http://localhost:5173 | Web app POS & quản lý |
| **Backend API** | http://localhost:8080/swagger-ui/index.html | Swagger UI test API |
| **AI Service** | http://localhost:8000/docs | FastAPI docs |
| **Prometheus** | http://localhost:9090 | Metrics scraper |
| **Grafana** | http://localhost:3000 | Monitoring dashboard |
| **PostgreSQL** | `localhost:5432` | DB connection |
| **Redis** | `localhost:6379` | Cache |
| **Kafka** | `localhost:9092` | Message broker |

### 4️⃣ Quick Test

```bash
# Backend health check
curl http://localhost:8080/actuator/health

# AI Service health check
curl http://localhost:8000/ai/health

# Forecast API
curl -X POST http://localhost:8000/ai/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PROD001",
    "days_ahead": 7,
    "historical_days": 30
  }'
```

---

## 🛑 Stop & Cleanup

```bash
# Stop services (keep data)
docker compose -f docker/docker-compose.yaml down

# Stop & remove all data
docker compose -f docker/docker-compose.yaml down -v
```

---

## 🔧 Local Development (Without Docker)

### Backend (Spring Boot)

```bash
# Start PostgreSQL in Docker
docker compose -f docker/docker-compose.yaml up -d postgres redis kafka

# Open backend/ in IntelliJ IDEA
cd backend

# Run with Maven (or use IntelliJ Run button)
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=local"

# Backend runs at :8080
# Flyway automatically migrates DB schema
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Frontend runs at :5173
# Auto-reload on file changes
```

### AI Service (FastAPI)

```bash
cd ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# AI Service runs at :8000
```

---

## 🚢 Production Deployment (VPS)

### Prerequisites
- **VPS** — Ubuntu 22.04 LTS (hoặc tương đương)
- **Docker + Docker Compose**
- **SSH access** — user root hoặc sudo
- **Disk space** — ≥50GB (PostgreSQL + logs + models)
- **Network** — ports 80 (HTTP), 443 (HTTPS), 9090-9100 (monitoring, internal only)

### 1️⃣ Initial Setup on VPS

```bash
ssh root@YOUR_VPS_IP

# Create project directory
mkdir -p /opt/smartai
cd /opt/smartai

# Clone repo
git clone https://github.com/datnguyencoder/smartAI.git .

# Copy environment
cp docker/.env.example docker/.env

# Edit .env with production values
nano docker/.env
# Set:
# - GEMINI_API_KEY
# - GRAFANA_ADMIN_PASSWORD
# - POSTGRES_PASSWORD
# - JWT_SECRET
```

### 2️⃣ Start Production Stack

```bash
cd /opt/smartai

# Start prod + monitoring stack
docker compose \
  -f docker/docker-compose.prod.yaml \
  -f docker/docker-compose.monitoring.yaml \
  --env-file docker/.env \
  up -d --build

# Check status
docker compose \
  -f docker/docker-compose.prod.yaml \
  -f docker/docker-compose.monitoring.yaml \
  ps
```

### 3️⃣ Configure Monitoring

**Grafana (http://YOUR_VPS_IP:3000)**
1. Login: `admin` / password từ `.env`
2. Add Telegram/Email notifications
3. Dashboard **SmartMart — System Overview** auto-provisioned

**Uptime Kuma (http://YOUR_VPS_IP:3001)**
1. Setup first-time account
2. Add monitors cho backend, AI, frontend, DB, Redis
3. Configure Telegram notifications

Xem chi tiết tại [`MONITORING.md`](MONITORING.md).

### 4️⃣ Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
apt update && apt install -y nginx certbot python3-certbot-nginx

# Copy config
cp docker/nginx/nginx.conf /etc/nginx/sites-available/smartai

# Enable
ln -s /etc/nginx/sites-available/smartai /etc/nginx/sites-enabled/

# Test & reload
nginx -t && systemctl reload nginx

# Setup SSL with Let's Encrypt
certbot --nginx -d your-domain.com
```

---

## 🔄 CI/CD Pipeline

**GitHub Actions Workflow:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

### Trigger
- Push to `main` branch
- Manual dispatch with `force_build` option

### Jobs (Path-based Conditional)

```yaml
detect-changes
  ├─ backend/** → build-backend
  ├─ ai-service/** → build-ai-service
  └─ docker/** → rebuild both

notify-start (always)
  └─ Telegram: thông báo build bắt đầu

build-backend (if backend/** changed)
  ├─ Setup Java 21
  ├─ Maven package
  ├─ Docker build & push ghcr.io/datnguyencoder/smartai-backend:latest
  └─ Telegram: success/failure

build-ai-service (if ai-service/** changed)
  ├─ Docker build & push ghcr.io/datnguyencoder/smartai-ai-service:latest
  └─ Telegram: success/failure

deploy (if changes detected & builds successful)
  ├─ SCP docker configs → VPS
  ├─ SSH: docker pull + docker compose up -d
  ├─ Health check: backend + AI service
  └─ Telegram: deploy success/failure + dashboard link
```

### Secrets Required

Set in GitHub → Settings → Secrets:

```env
VPS_HOST=160.191.242.125
VPS_PASSWORD=***
TELEGRAM_BOT_TOKEN=***
TELEGRAM_CHAT_ID=***
GITHUB_TOKEN=*** (auto, for GHCR)
```

### Manual Trigger with Force Build

```bash
# Push to main will auto-detect changes
# If you want to force build everything:
# Go to GitHub → Actions → Deploy workflow → Run workflow → force_build=true
```

---

## 📊 Monitoring & Alerting

### Stack
- **Prometheus** (:9090) — metrics collection
- **Grafana** (:3000) — dashboards + alert rules
- **Uptime Kuma** (:3001) — uptime monitoring + Telegram notifications

### Key Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Backend DOWN | No heartbeat > 1m | 🔴 Critical |
| AI Service DOWN | No heartbeat > 2m | 🟠 Warning |
| PostgreSQL DOWN | Connection failed > 1m | 🔴 Critical |
| Redis DOWN | Connection failed > 1m | 🔴 Critical |
| RAM > 85% | 5m sustained | 🟠 Warning |
| CPU > 85% | 5m sustained | 🟠 Warning |
| Disk > 95% | Immediate | 🔴 Critical |
| HTTP 5xx > 5% | 5m sustained | 🟠 Warning |
| JVM Heap > 85% | 5m sustained | 🟠 Warning |

→ All alerts route to **Telegram** & **Email** (configurable)

[Full Monitoring Guide →](MONITORING.md)

---

## 👨‍💻 Development Guidelines

### Code Standards

- **Backend:** Spring Boot best practices, REST API standards
- **Frontend:** React hooks, component composition, TypeScript strict mode
- **AI Service:** FastAPI async, proper error handling, model versioning

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit with clear messages
git commit -m "feat(module): description"  # feature
git commit -m "fix(module): description"   # bug fix
git commit -m "refactor(module): description"
git commit -m "docs: description"
git commit -m "test: description"

# Push & create PR
git push origin feature/your-feature
# GitHub will auto-lint & run tests

# After review & approval
# Merge to main via PR (squash or rebase)
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### Testing

```bash
# Backend
cd backend
./mvnw test

# Frontend
cd frontend
npm test

# AI Service
cd ai-service
pytest app/
```

### API Documentation

- Backend: Auto-generated Swagger UI — `/swagger-ui/index.html`
- AI Service: Auto-generated FastAPI docs — `/docs`
- Manual: Edit in `docs/04-api-specification.md`

---

## 🐛 Troubleshooting

### Common Issues

#### 🔴 **Backend container keeps restarting**

```bash
# Check logs
docker logs smartmart_backend

# Common causes:
# 1. PostgreSQL not ready — wait 30s
# 2. Port 8080 already in use
#    lsof -i :8080 && kill <PID>
# 3. Java heap error — increase Docker memory
#    docker update --memory 2g smartmart_backend
```

#### 🔴 **AI Service health check failing**

```bash
# Check if container runs
docker ps | grep ai-service

# Check logs
docker logs smartmart_ai_service

# Common causes:
# 1. Model file missing — download from git-lfs
# 2. Out of memory — set resources in compose
# 3. Port 8000 in use
```

#### 🔴 **Frontend shows "Cannot connect to Backend"**

```bash
# Check backend is running
curl http://localhost:8080/actuator/health

# Check CORS config in backend
# Should allow http://localhost:5173

# Clear browser cache
# Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
```

#### 🔴 **PostgreSQL connection refused**

```bash
# Check DB is running
docker ps | grep postgres

# Check credentials in .env
grep POSTGRES_PASSWORD docker/.env

# Reset DB (⚠️ deletes all data)
docker compose down -v
docker compose up -d postgres
# Wait 10s
docker compose up -d
```

#### 🔴 **Uptime Kuma showing all red**

```bash
# Uptime Kuma uses container DNS names, not localhost
# Update monitors to use Docker aliases:
# - backend:8080/actuator/health (not localhost:8080)
# - ai-service:8000/ai/health (not localhost:8000)
# - postgres:5432 (not localhost:5432)

# Then restart Uptime Kuma
docker restart smartmart_uptime_kuma
```

#### 🔴 **GitHub Actions deploy fails**

```bash
# Check secrets are set
# GitHub → Settings → Secrets

# Common issues:
# 1. VPS_HOST/VPS_PASSWORD wrong
# 2. TELEGRAM_BOT_TOKEN expired
# 3. GHCR auth token expired
#    → GitHub Actions renews automatically
# 4. Docker image too large
#    → Check Dockerfile optimization
```

### Logs & Debugging

```bash
# See all logs
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f ai-service
docker compose logs -f postgres

# Real-time tail
docker compose logs --tail 100 -f

# Export logs
docker compose logs > logs.txt

# SSH to container
docker exec -it smartmart_backend /bin/bash

# Health checks
curl http://localhost:8080/actuator/health
curl http://localhost:8000/ai/health
curl http://localhost:5432 # postgres (will fail, but shows if open)
```

### Performance Tuning

```bash
# Docker resource limits
docker update \
  --cpus=2 \
  --memory=2g \
  smartmart_backend

# Check Docker disk usage
docker system df

# Clean unused containers/images
docker system prune -a
```

---

## 📚 Additional Resources

| Document | Purpose |
|----------|---------|
| [`MONITORING.md`](MONITORING.md) | Prometheus + Grafana + Uptime Kuma setup |
| [`docs/01-overview.md`](docs/01-overview.md) | Project vision & scope |
| [`docs/02-business-rule.md`](docs/02-business-rule.md) | Business processes & workflows |
| [`docs/03-database-design.md`](docs/03-database-design.md) | ER diagram & schema |
| [`docs/04-api-specification.md`](docs/04-api-specification.md) | API endpoints & payloads |
| [`docs/05-ai-forecasting.md`](docs/05-ai-forecasting.md) | ML model architecture & training |
| [`docs/06-system-architecture.md`](docs/06-system-architecture.md) | System design & trade-offs |

---

## 💡 Quick Commands Cheatsheet

```bash
# Development
docker compose up -d --build                 # Start all services
docker compose down                          # Stop services
docker compose logs -f backend               # Watch logs
docker exec -it smartmart_backend bash       # SSH into container

# Production
ssh root@160.191.242.125                     # SSH to VPS
docker compose -f docker-compose.prod.yaml down   # Stop prod
docker compose -f docker-compose.prod.yaml logs -f # Watch logs

# Database
docker exec smartmart_postgres psql -U smartmart_admin -d smartmart_db -c "SELECT COUNT(*) FROM product;"
docker exec smartmart_postgres pg_dump -U smartmart_admin smartmart_db > backup.sql
docker exec -i smartmart_postgres psql -U smartmart_admin smartmart_db < backup.sql

# Monitoring
curl http://localhost:9090/api/v1/targets      # Prometheus targets
curl http://localhost:3000/api/health          # Grafana health
docker logs smartmart_prometheus | tail -20    # Prometheus logs

# Deploy
git push origin main                           # Trigger GitHub Actions
# Then check: GitHub → Actions → Deploy workflow
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/xyz`
3. Commit changes: `git commit -m "feat(scope): description"`
4. Push to branch: `git push origin feature/xyz`
5. Open Pull Request
6. Get reviewed & merged

For major changes, open an Issue first to discuss.

---

## 📞 Support & Contact

- 📧 Email: datnguyen.coder312@gmail.com
- 🐛 Issues: GitHub Issues
- 📱 Telegram: [SmartMart Alerts](https://t.me/smartmart_alerts)

---

## 📄 License

MIT License — See LICENSE file

---

## 🙏 Acknowledgments

- Spring Boot community
- FastAPI & Uvicorn
- React & Vite ecosystem
- Prometheus & Grafana
- PostgreSQL & Redis teams

---

**Last Updated:** 2026-07-17  
**Version:** 1.1.0  
**Status:** Production-Ready ✅

*SmartMart AI — Bringing intelligence to retail operations.*
