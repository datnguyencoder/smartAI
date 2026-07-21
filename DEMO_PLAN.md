# 🎬 SmartMart AI — Full Demo Plan (Nghiệp Vụ + Tech Stack)

Kế hoạch demo toàn diện từ **POS bán hàng → Backend → Kafka → Redis → AI Forecasting → Grafana/Prometheus → GitHub Actions Deploy**.

---

## 📑 Mục Lục

- [Tổng quan Demo](#-tổng-quan-demo)
- [Data Flow Diagram](#-data-flow-diagram)
- [Chuẩn Bị](#-chuẩn-bị)
- [Demo 1: POS & Bán Hàng](#-demo-1-pos--bán-hàng)
- [Demo 2: Backend API & Database](#-demo-2-backend-api--database)
- [Demo 3: Kafka Event Stream](#-demo-3-kafka-event-stream)
- [Demo 4: Redis Cache](#-demo-4-redis-cache)
- [Demo 5: AI Forecasting](#-demo-5-ai-forecasting)
- [Demo 6: Prometheus & Grafana Metrics](#-demo-6-prometheus--grafana-metrics)
- [Demo 7: GitHub Actions CI/CD](#-demo-7-github-actions-cicd)
- [Demo 8: E2E Flow](#-demo-8-e2e-flow)
- [Demo 9: Ngừng Service & Recovery](#-demo-9-ngừng-service--recovery)

---

## 🎯 Tổng Quan Demo

### Kịch Bản Chính

**📍 Bước 1:** Nhân viên POS bán 5 sản phẩm → Thanh toán thành công  
**📍 Bước 2:** Order được gửi qua Kafka → Backend xử lý → Save DB  
**📍 Bước 3:** Redis cache doanh số ngày  
**📍 Bước 4:** AI Service nhận event → train model → forecast 7 ngày tới  
**📍 Bước 5:** Prometheus scrape metrics → Grafana hiện dashboard real-time  
**📍 Bước 6:** Push code thay đổi → GitHub Actions → Build & Deploy → Telegram notify  
**📍 Bước 7:** Simulate service down → alert fire → recovery  

### Thời Gian

- **Chuẩn Bị:** 10 phút
- **Demo tổng thể:** 25-35 phút
- **Mỗi demo con:** 3-5 phút
- **Break/Q&A:** 5-10 phút

---

## 📊 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                    │
└──────────────────────────────────────────────────────────────────────┘

  POS App (React)
  5173
       │
       │ HTTP POST /api/v1/orders
       ↓
┌─────────────────────────────────┐
│   Backend (Spring Boot)         │
│   :8080                         │
│  ✓ JWT Auth                     │
│  ✓ Order Validation             │
│  ✓ Inventory Check              │
│  ✓ Calculate Price              │
│  ✓ Emit Event                   │
└─────────────────────────────────┘
       │         │         │
       │         │         └──────────────┐
       │         │                        │
       ↓         ↓                        ↓
   PostgreSQL   Redis               Kafka
   :5432        :6379            :9092
   (Store)      (Cache)        (Event Stream)
                                    │
       ┌────────────────────────────┤
       │                            │
       ↓                            ↓
┌──────────────────┐        ┌──────────────────┐
│ Prometheus       │        │ AI Service       │
│ :9090            │        │ :8000            │
│ ✓ Scrape metrics │        │ ✓ Process events │
│ ✓ Alert rules    │        │ ✓ Train models   │
│ ✓ Store 30 days  │        │ ✓ Forecast      │
└──────────────────┘        └──────────────────┘
       │                           │
       ↓                           ↓
┌──────────────────┐        ┌──────────────────┐
│ Grafana          │        │ ML Models        │
│ :3000            │        │ (XGBoost)        │
│ ✓ Dashboard      │        │ ✓ Save to disk   │
│ ✓ Alert rules    │        │ ✓ API endpoint   │
│ ✓ Notifications  │        │ ✓ /forecast      │
└──────────────────┘        └──────────────────┘
       │
       ↓
┌──────────────────────────┐
│ GitHub Actions           │
│ ✓ Webhook trigger        │
│ ✓ Build Docker images    │
│ ✓ Push to GHCR           │
│ ✓ Deploy to VPS          │
│ ✓ Send Telegram notify   │
└──────────────────────────┘
```

---

## 🔧 Chuẩn Bị

### 1️⃣ Start Full Stack

```bash
cd /Users/datdev312/Documents/smartAi

# Terminal 1: Start services
docker compose -f docker/docker-compose.yaml up -d --build

# Wait 30s for all services to start
sleep 30

# Verify all healthy
docker compose ps
# All should show (healthy)
```

### 2️⃣ Open Dashboard Tabs

Open browser with 5 tabs:

| Tab | URL | Purpose |
|-----|-----|---------|
| 1 | http://localhost:5173 | Frontend POS |
| 2 | http://localhost:8080/swagger-ui/index.html | Backend Swagger |
| 3 | http://localhost:8000/docs | AI Service Docs |
| 4 | http://localhost:9090 | Prometheus |
| 5 | http://localhost:3000 | Grafana (admin/admin) |

### 3️⃣ Terminal Setup

```bash
# Terminal 2: Watch backend logs
docker compose logs -f backend | grep -E "OrderService|KafkaProducer"

# Terminal 3: Watch AI logs
docker compose logs -f ai-service | grep -E "Forecast|Training|Event"

# Terminal 4: Watch Kafka messages
docker exec smartmart_kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --from-beginning \
  --property print.timestamp=true \
  --property print.key=true

# Terminal 5: Redis CLI
docker exec -it smartmart_redis redis-cli

# Terminal 6: Watch Prometheus targets
watch -n 5 'curl -s http://localhost:9090/api/v1/targets | jq ".data.activeTargets[] | {job: .labels.job, health: .health}"'
```

---

## 📱 Demo 1: POS & Bán Hàng

**Mục đích:** Hiển thị giao diện bán hàng thẩm & xử lý order tạo ra events

### Steps

```bash
# 1. Mở Tab 1: Frontend POS
# URL: http://localhost:5173

# 2. Login (nếu cần) — demo account:
# Email: demo@smartmart.com
# Password: Demo123!

# 3. Click "Bán Hàng" hoặc "POS"

# 4. Search sản phẩm (ví dụ: "Cola", "Bánh", "Nước")
# Hoặc scan barcode nếu có

# 5. Thêm 5 sản phẩm:
#   - Cola 330ml x2 (20,000 vnđ)
#   - Bánh mỳ x1 (10,000 vnđ)
#   - Sữa tươi x1 (25,000 vnđ)
#   - Kẹo socola x1 (5,000 vnđ)

# 6. Nhập số tiền khách đưa: 75,000 vnđ

# 7. Click "Thanh toán" (hoặc Ctrl+Enter)

# 8. Quan sát:
#   ✓ Hoá đơn được in (hoặc preview)
#   ✓ Tổng tiền: 60,000 vnđ
#   ✓ Tiền thừa: 15,000 vnđ
#   ✓ Giỏ hàng reset
```

**Kết quả mong đợi:**
- ✅ Order hiển thị xanh = success
- ✅ Invoice PDF được tạo
- ✅ Backend logs hiện "Order created: ORD-20260717-001"

---

## 🔌 Demo 2: Backend API & Database

**Mục đích:** Hiển thị order được save vào PostgreSQL, validate logic

### Steps

```bash
# 1. Mở Tab 2: Backend Swagger
# URL: http://localhost:8080/swagger-ui/index.html

# 2. Tìm endpoint: GET /api/v1/orders (hoặc /api/v1/sales/orders)

# 3. Click "Try it out"

# 4. Click "Execute"

# 5. Response: JSON list of orders
#   {
#     "id": "ORD-20260717-001",
#     "customer": "Walk-in",
#     "total": 60000,
#     "items": [
#       {"product": "Cola 330ml", "quantity": 2, "price": 20000},
#       ...
#     ],
#     "status": "COMPLETED",
#     "createdAt": "2026-07-17T12:30:45Z"
#   }

# 6. Hoặc query DB trực tiếp:
docker exec smartmart_postgres psql -U smartmart_admin -d smartmart_db -c \
  "SELECT id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5;"

# Expected output:
#              id             | total_amount | status    |         created_at
# ─────────────────────────────┼──────────────┼──────────┼──────────────────────
#  ORD-20260717-001            |        60000 | COMPLETED | 2026-07-17 12:30:45
```

**Kết quả mong đợi:**
- ✅ Order hiển thị trong Swagger response
- ✅ DB có 1 record mới
- ✅ Status = COMPLETED

---

## 🚀 Demo 3: Kafka Event Stream

**Mục đích:** Hiển thị order event được publish → Kafka topic

### Steps

```bash
# Terminal 4 đã open Kafka consumer?
# Nếu chưa, run lệnh này:

docker exec smartmart_kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --from-beginning \
  --property print.timestamp=true \
  --property print.key=true

# Khi order được tạo ở Demo 1:
# Sẽ thấy message xuất hiện:

# Key: ORD-20260717-001
# Timestamp: 1689596445000
# Value: {
#   "orderId": "ORD-20260717-001",
#   "customerId": null,
#   "totalAmount": 60000,
#   "items": [...],
#   "eventType": "ORDER_COMPLETED",
#   "timestamp": "2026-07-17T12:30:45Z"
# }

# Cách khác: Xem Kafka topics trong backend logs
docker logs smartmart_backend | grep -i kafka

# Expected output:
# KafkaTemplate: Sending message to topic 'orders' with key 'ORD-20260717-001'
# OrderEventProducer: Event published: ORDER_COMPLETED
```

**Kết quả mong đợi:**
- ✅ Kafka consumer nhận message
- ✅ Message format valid JSON
- ✅ Timestamp chính xác

---

## 💾 Demo 4: Redis Cache

**Mục đích:** Hiển thị doanh số ngày & top products lưu trong Redis

### Steps

```bash
# Terminal 5 đã open Redis CLI?
# Nếu chưa:

docker exec -it smartmart_redis redis-cli

# Trong Redis CLI:

# 1. Xem tất cả keys
KEYS *

# Expected output:
# 1) "daily_sales:2026-07-17"
# 2) "top_products:2026-07-17"
# 3) "shift:SHIFT-001:cash_summary"
# ...

# 2. Xem doanh số hôm nay
GET daily_sales:2026-07-17

# Expected output:
# "60000"  (hoặc số tiền lũy tích nếu có nhiều order)

# 3. Xem top products
HGETALL top_products:2026-07-17

# Expected output:
# 1) "Cola 330ml"
# 2) "2"  (quantity sold)
# 3) "Bánh mỳ"
# 4) "1"
# ...

# 4. Xem expiration
TTL daily_sales:2026-07-17

# Expected output:
# 86300  (seconds, ~24 hours)

# 5. Tạo thêm 3-4 order nữa từ Demo 1
# Rồi quay lại:

GET daily_sales:2026-07-17

# Sẽ thấy số tiền tăng lên
# Ví dụ: "300000" (60k + 60k + 60k + 60k + 60k)
```

**Kết quả mong đợi:**
- ✅ Redis keys tồn tại
- ✅ daily_sales value tăng sau mỗi order
- ✅ TTL hợp lệ (~24h)
- ✅ top_products update real-time

---

## 🧠 Demo 5: AI Forecasting

**Mục đích:** AI Service nhận event → train model → forecast demand

### Steps

```bash
# 1. Mở Tab 3: AI Service Docs
# URL: http://localhost:8000/docs

# 2. Tìm endpoint: POST /ai/forecast

# 3. Click "Try it out"

# 4. Nhập request body:
{
  "product_id": "PROD-COLA-001",
  "days_ahead": 7,
  "historical_days": 30
}

# 5. Click "Execute"

# 6. Response: Forecast data
{
  "product_id": "PROD-COLA-001",
  "forecast_date": "2026-07-17",
  "forecasts": [
    {
      "date": "2026-07-18",
      "predicted_quantity": 5,
      "confidence_interval": {
        "lower": 3,
        "upper": 7
      }
    },
    {
      "date": "2026-07-19",
      "predicted_quantity": 4,
      "confidence_interval": {"lower": 2, "upper": 6}
    },
    ...
  ],
  "model_version": "1.0.0",
  "training_timestamp": "2026-07-17T12:25:30Z"
}

# 7. Hoặc call Python API trực tiếp:
curl -X POST http://localhost:8000/ai/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PROD-COLA-001",
    "days_ahead": 7,
    "historical_days": 30
  }' | jq .

# 8. Watch AI Service logs (Terminal 3):
docker logs smartmart_ai_service -f | grep -E "Forecast|Training"

# Expected:
# [INFO] ForecastService: Processing forecast request for PROD-COLA-001
# [INFO] TrainingService: Loaded XGBoost model v1.0.0
# [INFO] TrainingService: Generated 7-day forecast
```

**Kết quả mong đợi:**
- ✅ Forecast API returns valid predictions
- ✅ Confidence intervals reasonable
- ✅ AI Service logs show processing
- ✅ Model version tracked

---

## 📈 Demo 6: Prometheus & Grafana Metrics

**Mục đích:** Hiển thị real-time metrics → visualize trong Grafana dashboard

### Steps

```bash
# 1. Mở Tab 4: Prometheus
# URL: http://localhost:9090

# 2. Click "Graph"

# 3. Query example metrics:

# Query 1: HTTP request count
sum(rate(http_server_requests_seconds_count[5m])) by (status)

# Xem biểu đồ: Request rate theo status code
# Expected: 2xx tăng khi có order, latency ~50-100ms

# Query 2: JVM Heap usage
jvm_memory_used_bytes{area="heap"} / 1024 / 1024 / 1024

# Expected: Tăng từ ~300MB → ~400MB khi process orders

# Query 3: Database connections
hikaricp_connections_active

# Expected: 1-5 connections active

# 4. Mở Tab 5: Grafana
# URL: http://localhost:3000
# Login: admin / admin

# 5. Click "Dashboards" → "SmartMart — System Overview"

# 6. Xem các panel:

#   Panel 1: Backend Status
#     ✓ Màu xanh = UP
#     ✓ Shows last heartbeat time

#   Panel 2: HTTP Request Rate
#     ✓ Area chart
#     ✓ Shows requests per second
#     ✓ Color by status code (200/5xx)

#   Panel 3: Backend Latency P50/P95/P99
#     ✓ P50: ~30-50ms
#     ✓ P95: ~80-120ms
#     ✓ P99: ~150-200ms

#   Panel 4: JVM Heap Memory
#     ✓ Line chart
#     ✓ Peak when processing bulk orders
#     ✓ Garbage collection visible (dips)

#   Panel 5: PostgreSQL Connections
#     ✓ Shows active connections
#     ✓ Spike when orders processed

#   Panel 6: Redis Memory Usage
#     ✓ Tăng từ ~5MB → ~10MB (cache data)

# 7. Create custom metric:
# Panel "Order Count per Minute"

# Click "Add visualization" → "Add panel"
# Query: sum(rate(business_orders_created_total[1m]))
# Viz: Stat
# Expected: 5-10 orders/minute during demo

# 8. Test alert:
# Click "Alerting" → "Alert rules"
# Should see: "Backend Down", "High Memory", etc.
# Status: All green (no alerts firing)
```

**Kết quả mong đợi:**
- ✅ Prometheus scrape targets healthy
- ✅ Grafana dashboard show live metrics
- ✅ Latency reasonable (< 200ms P99)
- ✅ No memory leaks (heap stable)
- ✅ Alert rules configured but not firing

---

## 🚀 Demo 7: GitHub Actions CI/CD

**Mục đích:** Hiển thị automated build → push Docker → deploy VPS → Telegram notify

### Steps

```bash
# 1. Mở GitHub repository
# URL: https://github.com/YOUR_GITHUB_USERNAME/smartAI

# 2. Click "Actions" tab

# 3. Xem workflow: "Build & Deploy to VPS"

# 4. Xem recent runs:
#   ✓ Run #8: Success
#   ✓ Run #9: Success
#   ✓ Run #10: Current

# 5. Click on latest run

# 6. Xem workflow visualization:
#   notify-start ✓ (Telegram: build started)
#     ↓
#   build-backend ✓ (Maven compile, Docker build, push GHCR)
#   build-ai-service ✓ (Docker build, push GHCR)
#     ↓
#   deploy ✓ (SSH to VPS, docker pull, docker compose up)
#     ↓
#   Telegram: deploy success + dashboard link

# 7. Click "notify-start" job
#   ✓ Set up job
#   ✓ Telegram — Build Started
#     Message:
#     🚀 SmartAI — Build Started
#     ├ Commit: abc123def456
#     ├ Branch: main
#     ├ By: YOUR_GITHUB_USERNAME
#     ├ Message: feat(ci): path-based builds
#     ├ Backend: 🔨 rebuild
#     └ AI Service: ⏭ skip

# 8. Click "build-backend" job
#   ✓ Checkout code
#   ✓ Setup Java 21
#   ✓ Maven package (-DskipTests)
#   ✓ Docker login (GHCR)
#   ✓ Docker build & push
#     Image: ghcr.io/YOUR_GITHUB_USERNAME/smartai-backend:latest
#     Size: ~250MB
#   ✓ Telegram — Backend OK

# 9. Click "build-ai-service" job
#   ✓ Docker build & push
#     Image: ghcr.io/YOUR_GITHUB_USERNAME/smartai-ai-service:latest
#     Size: ~500MB (Python + models)
#   ✓ Telegram — AI Service OK

# 10. Click "deploy" job
#   ✓ Copy docker configs to VPS (scp)
#   ✓ SSH to VPS: docker login, docker pull, docker compose up
#   ✓ Health check: curl backends
#   ✓ Telegram — Deploy Success
#     Message:
#     🎉 SmartAI — Deploy thành công!
#     ├ Commit: abc123def456
#     ├ By: YOUR_GITHUB_USERNAME
#     ├ Message: feat(ci): path-based builds
#     ├ Backend: 🔨 rebuilt
#     ├ AI Service: ⏭ skipped
#     └ Dashboard: http://<VPS_IP>:3000

# 11. Duration:
#   Total: ~5-8 minutes
#   - notify-start: 15 seconds
#   - build-backend: 2-3 minutes (Maven + Docker)
#   - build-ai-service: 1-2 minutes (Docker only)
#   - deploy: 1-2 minutes (SSH + docker pull + up)

# 12. (Optional) Trigger manual build:
# Click "Run workflow" → "force_build: true" → "Run workflow"
# This builds everything regardless of path changes
```

**Kết quả mong đợi:**
- ✅ All jobs pass
- ✅ Docker images pushed to GHCR
- ✅ VPS deployment successful
- ✅ All Telegram notifications received
- ✅ Total time < 8 minutes

---

## 🔄 Demo 8: E2E Flow (Complete Journey)

**Mục đích:** Hiển thị complete data flow từ POS → Backend → Kafka → AI → Prometheus → Grafana

### Steps (Chạy tất cả demo từ 1-7 liên tiếp)

```bash
# Timeline: 25-35 phút

# T=0 min: Chuẩn bị
echo "Demo Start — Verify all services healthy"
docker compose ps | grep -c healthy
# Expected: 11 (tất cả 11 containers healthy)

# T=2 min: POS Transaction
echo "Step 1: Customer buys 5 items at POS"
# Demo 1: Quầy thanh toán bán 5 sản phẩm

# T=5 min: Backend processing
echo "Step 2: Backend saved order to DB"
# Demo 2: Query DB → order exists

# T=8 min: Kafka event
echo "Step 3: Order event in Kafka"
# Demo 3: Kafka consumer shows event

# T=11 min: Redis caching
echo "Step 4: Sales cache updated in Redis"
# Demo 4: Redis daily_sales increased

# T=14 min: AI forecasting
echo "Step 5: AI model generates forecast"
# Demo 5: Forecast API returns 7-day prediction

# T=18 min: Prometheus metrics
echo "Step 6: Metrics scraped by Prometheus"
# Demo 6: Prometheus graph shows request rate spike

# T=25 min: Grafana dashboard
echo "Step 7: Grafana shows real-time metrics"
# Demo 6: Grafana panels update live

# T=30 min: GitHub Actions (if push made)
echo "Step 8: GitHub Actions deployed latest code"
# Demo 7: Workflow run successful

# T=35 min: Summary
echo "✅ Complete E2E Flow demonstrated!"
```

**Metrics Summary:**

```
📊 Performance during demo:

Backend:
  - Requests: 150-200 req/min
  - Latency P50: 35ms
  - Latency P95: 85ms
  - Latency P99: 150ms
  - Error rate: 0.1% (health checks, etc)

JVM:
  - Heap: 350MB → 420MB (peak)
  - Threads: 45-50 active
  - GC: 1-2 minor GCs per minute

Database:
  - Connections: 3-5 active
  - Query time: 5-20ms average
  - TPS: 50-70 per minute

Redis:
  - Memory: 5MB → 12MB (cache growth)
  - Commands: 500-1000 ops/min
  - Hit rate: 95%+

Kafka:
  - Messages/min: 100-150
  - Partitions: 3 (distributed)
  - Lag: < 1 second

AI Service:
  - Forecast requests: 20-30 per minute
  - Model load time: ~500ms
  - Prediction time: 50-100ms per product

Overall:
  - CPU usage: 30-50%
  - Memory usage: 60-70% of 4GB
  - Network: 5-10 Mbps average
  - Uptime: 99.99%
```

---

## 💥 Demo 9: Ngừng Service & Recovery

**Mục đích:** Hiển thị monitoring & recovery khi service down

### Scenario 1: Redis Down

```bash
# T=0: Redis is healthy
# Grafana: redis_up = 1

# T=1: Stop Redis
docker stop smartmart_redis

# T=2-5: Prometheus phát hiện qua redis-exporter (scrape interval ~15-30s)
# Grafana: redis_up → 0, alert rule fires
# Telegram: 🚨 Redis DOWN — service unavailable

# T=6-10: Impact visible in:
# - Grafana: Redis memory graph → flat (no data)
# - Backend logs: Errors accessing cache
# - API response time: +50% (bypass cache)

# T=11: Restart Redis
docker start smartmart_redis

# T=12-30: Recovery visible in:
# - Grafana: redis_up → 1, metrics resume
# - Telegram: ✅ Redis recovered

# T=31: Full recovery
# Dashboard: Everything GREEN again
```

### Scenario 2: Backend Down

```bash
# T=0: Backend is healthy
# Grafana: up{job="backend"} = 1

# T=1: Stop Backend
docker stop smartmart_backend

# T=2: Prometheus scrape thất bại ngay ở lần kế tiếp (~15-30s)
# Telegram alert sent (⚠️ depends on retry config)

# T=3-5: Grafana impact:
# - "up{job=smartmart_backend}" = 0
# - Alert rule fires: "Backend DOWN"
# - Alert routing: Telegram + Email

# T=6: Critical impact:
# - Frontend shows: "Cannot connect to Backend"
# - POS cannot save orders
# - API calls timeout

# T=7: Restart Backend
docker start smartmart_backend

# T=8-15: Wait for:
# - Backend startup: ~10s
# - Health check pass: ~5s
# - Metrics resume: ~1s

# T=16: Recovery confirmed
# Telegram: ✅ Backend recovered
# Grafana: up = 1
# Frontend: Connections restored
```

### Scenario 3: PostgreSQL Down

```bash
# T=0: DB is healthy
# Dashboard: PostgreSQL monitor GREEN

# T=1: Simulate DB hang (connection timeout)
docker exec smartmart_backend killall java  # Force kill backend
docker exec smartmart_postgres pg_terminate_backend  # Kill DB sessions

# T=2-5: Cascading failures:
# - Backend cannot connect → restart
# - AI Service queries fail → forecast unavailable
# - Prometheus scrape fails

# T=6: Alerts fire:
# - 🚨 PostgreSQL DOWN
# - 🚨 Backend DOWN
# - 🚨 DB Connections 0

# T=7-30: Recovery:
docker start smartmart_backend  # Will wait for DB

# T=31: DB health restored
# - All services come back up
# - Data integrity check passes
# - Metrics resume
```

**Expected Alerts During Demo:**

```
🚨 Critical Alerts:
├─ Backend DOWN (1m)
├─ PostgreSQL DOWN (1m)
└─ Redis DOWN (1m)

⚠️ Warning Alerts:
├─ High Response Time (5m)
├─ High Memory Usage (5m)
├─ High Error Rate (5m)
└─ Database Connections High (1m)

📢 Telegram Messages:
├─ "🚨 Redis DOWN — service unavailable"
├─ "🚨 Backend DOWN — health check failed"
├─ "⚠️ High error rate detected (10.5%)"
├─ "✅ Redis recovered"
├─ "✅ Backend recovered"
└─ "✅ System back to normal"
```

---

## 📋 Demo Checklist

Use this before demo:

```bash
# Pre-Demo Checklist (10 min)

# ✓ All services running
docker compose ps | grep -c healthy
# Expected: 12

# ✓ Backend health
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# ✓ AI health
curl http://localhost:8000/ai/health
# Expected: {"status":"ok","model_loaded":true}

# ✓ Database has sample data
docker exec smartmart_postgres psql -U smartmart_admin -d smartmart_db -c \
  "SELECT COUNT(*) FROM product;"
# Expected: 100+

# ✓ Redis empty (optional but clean)
docker exec smartmart_redis redis-cli FLUSHDB

# ✓ All dashboard tabs open
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8080/swagger-ui/index.html
# - AI: http://localhost:8000/docs
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3000

# ✓ Terminals ready
# - Terminal 2: docker compose logs -f backend
# - Terminal 3: docker compose logs -f ai-service
# - Terminal 4: Kafka consumer
# - Terminal 5: redis-cli
# - Terminal 6: watch Prometheus targets

# ✓ Telegram bot notifications enabled
# Send test message to Telegram group

# ✓ GitHub Actions workflow visible
# Have browser ready to show Actions tab

# ✓ Time estimate: 35 minutes total
# - Demo 1-6: 20 min
# - Demo 7: 5 min
# - Demo 8-9: 10 min

echo "✅ Pre-Demo Checklist Complete!"
```

---

## 🎤 Demo Script (Talking Points)

### Introduction (2 min)

> "SmartMart AI is a modern retail management system combining POS, inventory, and AI forecasting. Today, we'll walk through the complete tech stack: React frontend → Spring Boot backend → FastAPI AI → Kafka events → Redis cache → Prometheus/Grafana monitoring."

### Demo 1-2 (5 min)

> "First, let's sell some products. I'll ring up 5 items at the POS. Notice the real-time inventory check, price calculation, and instant order confirmation. The order is now saved to PostgreSQL with full audit trail."

### Demo 3-4 (3 min)

> "Behind the scenes, the order event goes through Kafka topic 'orders' so any service can listen. Redis caches today's sales total and top products for lightning-fast dashboard queries."

### Demo 5 (3 min)

> "The AI Service immediately receives the event and feeds it into our XGBoost model. This generates a 7-day demand forecast with confidence intervals — helping us decide how much stock to order."

### Demo 6 (5 min)

> "Prometheus scrapes metrics every 15 seconds from all services: request rates, latency, JVM memory, database connections. Grafana visualizes this in real-time dashboards with intelligent alerts — including uptime alerting based on the `up` metric, no separate uptime-monitoring service needed."

### Demo 7 (3 min)

> "Every push to main triggers GitHub Actions. We build Docker images, push to GitHub Container Registry, then SSH deploy to production VPS — all automated with Telegram notifications."

### Demo 8-9 (5 min)

> "If a service fails, Prometheus detects it within one scrape interval and Grafana fires an alert. I'll simulate Redis going down... (stop container) ...see the alert, then recover it. The system automatically restarts and resumes normal operation."

### Conclusion (2 min)

> "That's the complete SmartMart AI stack: modern frontend UX, scalable microservices, event-driven architecture, machine learning, comprehensive monitoring, and fully automated CI/CD — all working together to optimize retail operations."

---

## 🎯 Demo Success Criteria

After all 9 demos, verify:

- ✅ POS order created successfully
- ✅ Order in PostgreSQL database
- ✅ Event in Kafka topic
- ✅ Data in Redis cache
- ✅ Forecast generated by AI
- ✅ Metrics in Prometheus
- ✅ Dashboard in Grafana live
- ✅ GitHub Actions workflow passed
- ✅ Alerts trigger on service down
- ✅ Recovery automatic & complete
- ✅ Telegram notifications received

---

## 📞 Troubleshooting During Demo

| Issue | Fix |
|-------|-----|
| Service won't start | `docker compose logs backend` to see error |
| Dashboard no data | Wait 30s for Prometheus scrape cycle |
| Kafka message missing | Check consumer group offset |
| Redis empty | Run `docker exec smartmart_redis redis-cli` manually |
| Telegram not notifying | Check bot token & chat ID in .env |
| GitHub Actions slow | Check GHCR image push (can be slow first time) |

---

## ⏱️ Time Breakdown

| Phase | Duration | Items |
|-------|----------|-------|
| Setup & Verification | 10 min | Start services, verify health |
| Demo 1-2 (POS + DB) | 5 min | Order creation, database query |
| Demo 3-4 (Kafka + Redis) | 3 min | Event streaming, cache update |
| Demo 5 (AI) | 3 min | Forecast generation |
| Demo 6 (Monitoring) | 5 min | Prometheus, Grafana |
| Demo 7 (CI/CD) | 5 min | GitHub Actions workflow |
| Demo 8 (E2E) | 8 min | Complete journey summary |
| Demo 9 (Failure) | 5 min | Service down & recovery |
| Q&A | 10 min | Questions from audience |
| **Total** | **~55 min** | Full comprehensive demo |

---

## 🚀 Post-Demo

```bash
# Save logs for reference
docker compose logs > demo_$(date +%Y%m%d_%H%M%S).log

# Optional: Stop everything
docker compose down

# Or: Keep running for attendees to explore
docker compose ps
```

---

**Created:** 2026-07-17  
**Demo Duration:** 40-60 minutes  
**Audience:** Tech leads, developers, stakeholders  
**Tech Coverage:** 100% of stack (React, Spring Boot, FastAPI, PostgreSQL, Redis, Kafka, Prometheus, Grafana, GitHub Actions)
