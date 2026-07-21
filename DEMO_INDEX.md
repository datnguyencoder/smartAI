# 🎬 SmartMart AI — Demo & Documentation Index

Tổng hợp tất cả tài liệu demo, hướng dẫn, và kỹ thuật cho dự án SmartMart AI.

---

## 📚 Tài Liệu Chính

### 1. **[README.md](README.md)** ⭐ START HERE
   - **Nội dung:** Tổng quan dự án, features, tech stack, quick start
   - **Đối tượng:** Tất cả (developers, stakeholders)
   - **Thời gian:** 10-15 phút đọc
   - **Key sections:**
     - Tính năng nổi bật (✨)
     - Tech stack table
     - Quick Start (Local Docker setup)
     - Production deployment
     - CI/CD overview
     - Troubleshooting

### 2. **[DEMO_PLAN.md](DEMO_PLAN.md)** 🎯 FULL DEMO
   - **Nội dung:** Kế hoạch demo toàn diện từ POS → CI/CD (35-55 phút)
   - **Đối tượng:** Demo organizers, presenters
   - **Bao gồm:**
     - 9 demos chi tiết (POS, Backend, Kafka, Redis, AI, Prometheus/Grafana, CI/CD, E2E, Failure)
     - Data flow diagram
     - Step-by-step instructions
     - Expected outputs
     - Talking points
     - Success criteria
     - Troubleshooting guide

### 3. **[TECH_STACK_DEMO.md](TECH_STACK_DEMO.md)** 🔧 TECH REFERENCE
   - **Nội dung:** Chi tiết technical cho mỗi tech component
   - **Đối tượng:** Developers, technical leads
   - **Bao gồm:**
     - 9 technologies (React, Spring Boot, FastAPI, PostgreSQL, Redis, Kafka, Prometheus, Grafana, GitHub Actions)
     - Ports, versions, dependencies
     - Test commands (curl, CLI)
     - Expected outputs
     - Performance metrics
     - Verification checklist

### 4. **[MONITORING.md](MONITORING.md)** 📊 MONITORING SETUP
   - **Nội dung:** Prometheus + Grafana detailed setup
   - **Đối tượng:** DevOps, monitoring engineers
   - **Bao gồm:**
     - Architecture diagram
     - Deployment instructions
     - Dashboard configuration
     - Alert rules
     - Common issues

---

## 📁 Documentation Structure

```
smartAi/
├── README.md                  ⭐ START HERE - Overview + Quick Start
├── DEMO_PLAN.md              🎯 Full demo walkthrough (40-60 min)
├── TECH_STACK_DEMO.md        🔧 Technical deep-dive per technology
├── MONITORING.md             📊 Prometheus/Grafana
│
├── docs/                      📚 Detailed business & architecture
│   ├── 01-overview.md
│   ├── 02-business-rule.md
│   ├── 03-database-design.md
│   ├── 04-api-specification.md
│   ├── 05-ai-forecasting.md
│   ├── 06-system-architecture.md
│   └── 07-deployment-guide.md
│
├── backend/                   🔌 Spring Boot source code
│   ├── README.md
│   └── docs/
│
├── ai-service/               🧠 FastAPI source code
│   ├── README.md
│   └── docs/
│
├── frontend/                  📱 React source code
│   ├── README.md
│   └── docs/
│
├── docker/                    🐳 Docker & Infrastructure
│   ├── docker-compose.yaml
│   ├── docker-compose.prod.yaml
│   ├── docker-compose.monitoring.yaml
│   └── README.md
│
└── .github/workflows/
    └── deploy.yml            🚀 GitHub Actions CI/CD
```

---

## 🎯 Demo Flow (35-55 minutes)

### Pre-Demo (10 min)
1. Run [`demo_runner.sh`](demo_runner.sh) to verify all services
2. Open 5 browser tabs (Frontend, Backend, AI, Prometheus, Grafana)
3. Setup 6 terminal windows (logs, Kafka, Redis, watch, etc.)

### Demo 1-2 (5 min) — POS & Backend
- **[DEMO_PLAN.md § Demo 1-2](DEMO_PLAN.md#-demo-1-pos--bán-hàng)**
- **Tech:** React, Spring Boot, PostgreSQL
- **Actions:** Create order via POS → Query DB
- **Verify:** [TECH_STACK_DEMO.md § Frontend & Backend](TECH_STACK_DEMO.md#1️⃣-frontend-react-18--vite)

### Demo 3-4 (3 min) — Kafka & Redis
- **[DEMO_PLAN.md § Demo 3-4](DEMO_PLAN.md#-demo-3-kafka-event-stream)**
- **Tech:** Kafka, Redis
- **Actions:** Monitor event stream → Check cache
- **Verify:** [TECH_STACK_DEMO.md § Kafka & Redis](TECH_STACK_DEMO.md#6️⃣-kafka-message-broker)

### Demo 5 (3 min) — AI Forecasting
- **[DEMO_PLAN.md § Demo 5](DEMO_PLAN.md#-demo-5-ai-forecasting)**
- **Tech:** FastAPI, XGBoost, scikit-learn
- **Actions:** Call /ai/forecast endpoint
- **Verify:** [TECH_STACK_DEMO.md § AI Service](TECH_STACK_DEMO.md#3️⃣-ai-service-fastapi--python)

### Demo 6 (5 min) — Monitoring
- **[DEMO_PLAN.md § Demo 6](DEMO_PLAN.md#-demo-6-prometheus--grafana-metrics)**
- **Tech:** Prometheus, Grafana
- **Actions:** Query metrics → View dashboards
- **Verify:** [TECH_STACK_DEMO.md § Prometheus, Grafana](TECH_STACK_DEMO.md#7️⃣-prometheus-metrics-collection)

### Demo 7 (5 min) — CI/CD
- **[DEMO_PLAN.md § Demo 7](DEMO_PLAN.md#-demo-7-github-actions-cicd)**
- **Tech:** GitHub Actions, GHCR, Docker
- **Actions:** Show workflow run → Telegram notification
- **Verify:** [TECH_STACK_DEMO.md § GitHub Actions](TECH_STACK_DEMO.md#9️⃣-github-actions-cicd-pipeline)

### Demo 8-9 (10 min) — E2E & Failure
- **[DEMO_PLAN.md § Demo 8-9](DEMO_PLAN.md#-demo-8-e2e-flow-complete-journey)**
- **Tech:** All components integrated
- **Actions:** Complete flow + simulate service down
- **Verify:** Performance baseline, alerts, recovery

---

## 🚀 Quick Start Guides

### Local Development (5 min)
```bash
cd /Users/datdev312/Documents/smartAi
docker compose -f docker/docker-compose.yaml up -d --build
# Visit: http://localhost:5173
```
→ [Full guide in README.md](README.md#-quick-start-local)

### Production Deployment (VPS)
→ [Deployment guide in README.md](README.md#-production-deployment-vps)

### Monitoring Setup
→ [Detailed in MONITORING.md](MONITORING.md)

---

## 📊 Tech Stack Summary

| Layer | Technology | Port | Docs |
|-------|-----------|------|------|
| **Frontend** | React 18 + Vite | 5173 | [TECH_STACK_DEMO.md §1](TECH_STACK_DEMO.md#1️⃣-frontend-react-18--vite) |
| **Backend** | Spring Boot 3.2 | 8080 | [TECH_STACK_DEMO.md §2](TECH_STACK_DEMO.md#2️⃣-backend-spring-boot-32) |
| **AI Service** | FastAPI | 8000 | [TECH_STACK_DEMO.md §3](TECH_STACK_DEMO.md#3️⃣-ai-service-fastapi--python) |
| **Database** | PostgreSQL 16 | 5432 | [TECH_STACK_DEMO.md §4](TECH_STACK_DEMO.md#4️⃣-postgresql-database) |
| **Cache** | Redis 7 | 6379 | [TECH_STACK_DEMO.md §5](TECH_STACK_DEMO.md#5️⃣-redis-cache) |
| **Message Broker** | Kafka 3.7 | 9092 | [TECH_STACK_DEMO.md §6](TECH_STACK_DEMO.md#6️⃣-kafka-message-broker) |
| **Metrics** | Prometheus 2.47 | 9090 | [TECH_STACK_DEMO.md §7](TECH_STACK_DEMO.md#7️⃣-prometheus-metrics-collection) |
| **Dashboard** | Grafana 11 | 3000 | [TECH_STACK_DEMO.md §8](TECH_STACK_DEMO.md#8️⃣-grafana-dashboard--alerting) |
| **CI/CD** | GitHub Actions | — | [TECH_STACK_DEMO.md §9](TECH_STACK_DEMO.md#9️⃣-github-actions-cicd-pipeline) |

---

## 🔗 Quick Links

### Documentation
- 📖 [Overview (docs/01-overview.md)](docs/01-overview.md)
- 📖 [Business Rules (docs/02-business-rule.md)](docs/02-business-rule.md)
- 📖 [Database Design (docs/03-database-design.md)](docs/03-database-design.md)
- 📖 [API Specification (docs/04-api-specification.md)](docs/04-api-specification.md)
- 📖 [AI Forecasting (docs/05-ai-forecasting.md)](docs/05-ai-forecasting.md)
- 📖 [System Architecture (docs/06-system-architecture.md)](docs/06-system-architecture.md)

### Component READMEs
- 🔌 [Backend README](backend/README.md)
- 🧠 [AI Service README](ai-service/README.md)
- 📱 [Frontend README](frontend/README.md)
- 🐳 [Docker README](docker/README.md)

### External Links
- 🔧 [GitHub Repository](https://github.com/datnguyencoder/smartAI)
- 📦 [Docker Hub](https://hub.docker.com/u/datnguyencoder)
- 🐳 [GHCR Images](https://github.com/datnguyencoder/smartAI/pkgs/container)

---

## 🎓 Learning Path

### For Developers
1. **Start:** Read [README.md](README.md) (10 min)
2. **Setup:** Local Docker with [Quick Start](README.md#-quick-start-local) (5 min)
3. **Deep-dive:** Pick a module
   - Frontend: [frontend/README.md](frontend/README.md)
   - Backend: [backend/README.md](backend/README.md)
   - AI: [ai-service/README.md](ai-service/README.md)
4. **Tech details:** [TECH_STACK_DEMO.md](TECH_STACK_DEMO.md) for component deep-dive

### For DevOps/SRE
1. **Start:** [README.md § Production Deployment](README.md#-production-deployment-vps) (15 min)
2. **Monitoring:** [MONITORING.md](MONITORING.md) (30 min)
3. **CI/CD:** [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (20 min)
4. **Troubleshooting:** [README.md § Troubleshooting](README.md#-troubleshooting) (ongoing)

### For Stakeholders
1. **Overview:** [README.md § Tính Năng](README.md#-tính-năng-nổi-bật) (5 min)
2. **Demo:** [DEMO_PLAN.md](DEMO_PLAN.md) (60 min, with demo organizer)
3. **Architecture:** [docs/06-system-architecture.md](docs/06-system-architecture.md) (15 min)
4. **Business Rules:** [docs/02-business-rule.md](docs/02-business-rule.md) (20 min)

---

## ✅ Verification Checklists

### Pre-Demo Checklist (10 min)
→ See [DEMO_PLAN.md § Checklist](DEMO_PLAN.md#-demo-checklist)

### Service Health Checklist
→ See [TECH_STACK_DEMO.md § Verification](TECH_STACK_DEMO.md#-verification-checklist)

### Deployment Checklist
→ See [README.md § Production](README.md#-production-deployment-vps)

---

## 🆘 Quick Troubleshooting

**Can't start services?**
→ [README.md § Troubleshooting](README.md#-troubleshooting)

**Backend connection refused?**
→ [TECH_STACK_DEMO.md § Backend](TECH_STACK_DEMO.md#2️⃣-backend-spring-boot-32)

**AI Service not responding?**
→ [TECH_STACK_DEMO.md § AI Service](TECH_STACK_DEMO.md#3️⃣-ai-service-fastapi--python)

**Monitoring not working?**
→ [MONITORING.md § Troubleshooting](MONITORING.md#troubleshooting)

---

## 📞 Support

- 📧 Email: datnguyen.coder312@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/datnguyencoder/smartAI/issues)
- 📱 Telegram: Smartmart Alerts group

---

## 📈 Resources Summary

| Type | Count | Time | Purpose |
|------|-------|------|---------|
| **Demo Documents** | 2 | 60-90 min | Walkthrough + Reference |
| **Tech Docs** | 1 | 30-40 min | Component details |
| **Business Docs** | 7 | 2-3 hours | Deep technical |
| **Code Examples** | 50+ | — | Inline in docs |
| **Test Scripts** | 10+ | — | CLI testing |

---

## 🚀 Getting Started (30 Seconds)

```bash
# 1. Clone
git clone https://github.com/datnguyencoder/smartAI.git
cd smartAi

# 2. Start
docker compose -f docker/docker-compose.yaml up -d --build

# 3. Open browser
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8080/swagger-ui/index.html
# Grafana:   http://localhost:3000

# 4. Read
# → Start with README.md
# → Then DEMO_PLAN.md for full walkthrough
# → TECH_STACK_DEMO.md for technical details
```

---

**Last Updated:** 2026-07-17  
**Version:** 1.0  
**Total Documentation:** ~50,000 words  
**Coverage:** 100% of codebase

---

👉 **[START WITH README.md →](README.md)**
