# 🛠️ SmartMart AI — Tech Stack Demo Reference

Hướng dẫn chi tiết cách **mỗi technology** được sử dụng trong dự án, kèm test commands và expected output.

---

## 1️⃣ Frontend (React 18 + Vite)

### Tech Details
- **Framework:** React 18.2
- **Build Tool:** Vite 4.4
- **Language:** TypeScript 5.1
- **UI Library:** Ant Design 5.10
- **Styling:** TailwindCSS 3.3
- **Charts:** Recharts 2.8
- **State Management:** React Context + hooks
- **HTTP Client:** Axios

### Port: 5173

### Demo: Check Frontend App

```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Open: http://localhost:5173

# 3. Check network tab (DevTools → Network):
#   ✓ Bundle size: ~150KB (gzipped)
#   ✓ API calls to :8080
#   ✓ WebSocket (optional, for real-time)

# 4. Verify components:
#   ✓ POS page: http://localhost:5173/sales/pos
#   ✓ Orders page: http://localhost:5173/sales/orders
#   ✓ Inventory: http://localhost:5173/inventory/stock
#   ✓ Forecasting: http://localhost:5173/forecasting/dashboard

# 5. Check performance
#   DevTools → Performance
#   ✓ FCP (First Contentful Paint): < 1s
#   ✓ LCP (Largest Contentful Paint): < 2s
#   ✓ CLS (Cumulative Layout Shift): < 0.1
```

### Key Endpoints Used
```
GET  /api/v1/products              (fetch items for POS)
POST /api/v1/orders                (create order)
GET  /api/v1/orders/:id            (fetch order details)
POST /api/v1/orders/:id/return     (create return)
GET  /api/v1/forecasts/:product    (fetch AI forecast)
```

### Build Size
```
npm run build

# Expected:
# ✓ index.html: 5KB
# ✓ JS bundles: 120-150KB (gzipped)
# ✓ CSS: 20-30KB (gzipped)
# ✓ Total: ~160KB
```

---

## 2️⃣ Backend (Spring Boot 3.2)

### Tech Details
- **Framework:** Spring Boot 3.2.0
- **Language:** Java 21
- **Persistence:** JPA/Hibernate
- **Migrations:** Flyway
- **Security:** Spring Security + JWT
- **API:** REST (Spring MVC)
- **Async:** Spring Async + Kafka
- **Metrics:** Micrometer
- **Database Driver:** PostgreSQL JDBC

### Port: 8080

### Demo: Test Backend APIs

```bash
# 1. Health check
curl http://localhost:8080/actuator/health

# Expected:
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "ping": {"status": "UP"},
    "kafkaHealthIndicator": {"status": "UP"}
  }
}

# 2. Swagger UI
# Open: http://localhost:8080/swagger-ui/index.html

# 3. Create order via API
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "PROD-COLA", "quantity": 2, "unitPrice": 20000}
    ],
    "totalAmount": 40000,
    "paymentMethod": "CASH"
  }'

# Expected response:
{
  "id": "ORD-20260717-001",
  "totalAmount": 40000,
  "status": "COMPLETED",
  "createdAt": "2026-07-17T12:30:45Z"
}

# 4. Metrics endpoint
curl http://localhost:8080/actuator/prometheus | head -20

# Expected: Prometheus format metrics
# http_server_requests_seconds_count{method="POST",status="200",uri="/api/v1/orders"}
# jvm_memory_used_bytes{area="heap"}
# ...

# 5. View logs
docker logs smartmart_backend -f | grep -E "OrderService|KafkaProducer|Database"
```

### JVM Metrics
```bash
# Monitor JVM performance
curl http://localhost:8080/actuator/metrics/jvm.memory.used | jq .

# Expected:
{
  "name": "jvm.memory.used",
  "baseUnit": "bytes",
  "measurements": [
    {
      "statistic": "VALUE",
      "value": 450000000  # ~450MB
    }
  ]
}

# JVM Heap breakdown
curl http://localhost:8080/actuator/metrics | jq '.names[] | select(contains("jvm"))'

# Should include:
# jvm.memory.used{area=heap}
# jvm.memory.max{area=heap}
# jvm.memory.committed{area=heap}
# jvm.threads.live
# jvm.gc.pause
```

### Database Connection Pool
```bash
# HikariCP stats
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active | jq .

# Expected: 1-10 active connections
```

### Kafka Integration
```bash
# Check Kafka is connected
docker logs smartmart_backend | grep -i kafka

# Expected:
# [INFO] KafkaProducer: Sending event to topic 'orders'
# [INFO] OrderEventProducer: Order event published
```

---

## 3️⃣ AI Service (FastAPI + Python)

### Tech Details
- **Framework:** FastAPI 0.115
- **Server:** Uvicorn
- **Language:** Python 3.10+
- **ML Libraries:** 
  - scikit-learn 1.5
  - XGBoost 2.1
  - pandas 2.2
  - numpy 1.26
- **Serialization:** joblib (model persistence)
- **Metrics:** prometheus-client

### Port: 8000

### Demo: Test AI Forecasting

```bash
# 1. Health check
curl http://localhost:8000/ai/health

# Expected:
{
  "status": "ok",
  "model_loaded": true,
  "version": "1.1.0"
}

# 2. Interactive docs
# Open: http://localhost:8000/docs

# 3. Generate forecast
curl -X POST http://localhost:8000/ai/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PROD-COLA-001",
    "days_ahead": 7,
    "historical_days": 30
  }' | jq .

# Expected:
{
  "product_id": "PROD-COLA-001",
  "forecast_date": "2026-07-17",
  "forecasts": [
    {
      "date": "2026-07-18",
      "predicted_quantity": 5,
      "confidence_interval": {"lower": 3, "upper": 7},
      "confidence": 0.95
    },
    ...
  ],
  "model_version": "1.0.0"
}

# 4. Check models loaded
docker exec smartmart_ai_service ls -lh /app/models/

# Expected: .joblib files exist
# - xgboost_model.joblib (~10MB)
# - scaler.joblib (~1KB)

# 5. Logs
docker logs smartmart_ai_service -f | grep -E "Forecast|Training|Event"
```

### Model Performance
```bash
# Check model metadata
curl http://localhost:8000/ai/models/info | jq .

# Expected:
{
  "models": [
    {
      "name": "xgboost_demand",
      "version": "1.0.0",
      "accuracy": 0.92,
      "features": 15,
      "training_samples": 5000,
      "last_trained": "2026-07-10"
    }
  ]
}
```

### Event Processing
```bash
# When order event received via Kafka:
docker logs smartmart_ai_service | grep -i "received\|processing\|trained"

# Expected:
# [INFO] KafkaEventConsumer: Received event: ORDER_COMPLETED
# [INFO] ForecastService: Processing event for PROD-COLA-001
# [INFO] TrainingService: Updated model with new data point
# [INFO] TrainingService: Model accuracy: 0.92
```

---

## 4️⃣ PostgreSQL Database

### Tech Details
- **Version:** PostgreSQL 16
- **Extensions:** uuid-ossp, pgcrypto
- **Connection Pool:** HikariCP (max 20 connections)
- **Migrations:** Flyway (SQL-based)

### Port: 5432

### Demo: Query Database

```bash
# 1. Connect to DB
docker exec -it smartmart_postgres psql -U smartmart_admin -d smartmart_db

# 2. Check tables
\dt

# Expected tables:
# - product
# - inventory_movement
# - orders
# - order_items
# - shifts
# - transactions
# - ...

# 3. Query recent orders
SELECT id, total_amount, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

# Expected:
#              id             | total_amount | status    |         created_at
# ─────────────────────────────┼──────────────┼──────────┼──────────────────────
#  ORD-20260717-001            |        60000 | COMPLETED | 2026-07-17 12:30:45

# 4. Check row counts
SELECT 
  (SELECT COUNT(*) FROM product) as total_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM shifts) as total_shifts;

# Expected:
# total_products | total_orders | total_shifts
# ──────────────┼──────────────┼──────────────
#      150      |      250     |      30

# 5. Database size
SELECT pg_size_pretty(pg_database_size('smartmart_db'));

# Expected: 50-100 MB

# 6. Schema version (Flyway)
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;

# Expected:
# version | description | type | installed_by | installed_on | success | execution_time
# ─────────┼──────────────┼──────┼──────────────┼──────────────┼─────────┼────────────────
#   39    | Stock alerts | SQL  | smartmart    | 2026-07-17   |    t    |     120
#   40    | Kafka events | SQL  | smartmart    | 2026-07-17   |    t    |     80
```

### Performance Monitoring
```bash
# Active connections
SELECT count(*) FROM pg_stat_activity;

# Expected: 3-8 (backend, monitoring, migrations)

# Long-running queries
SELECT pid, usename, state, query 
FROM pg_stat_activity 
WHERE state = 'active';

# Slow queries (if log enabled)
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 5;
```

---

## 5️⃣ Redis Cache

### Tech Details
- **Version:** Redis 7
- **Memory:** 256MB (default docker)
- **Expiration:** Key-based TTL
- **Use Cases:**
  - Daily sales cache
  - Top products cache
  - Session storage
  - Inventory quick lookup

### Port: 6379

### Demo: Explore Redis

```bash
# 1. Connect
docker exec -it smartmart_redis redis-cli

# 2. Database info
INFO memory

# Expected:
# used_memory_human: 5.2M
# maxmemory_human: 256M

# 3. List all keys
KEYS *

# Expected:
# 1) "daily_sales:2026-07-17"
# 2) "top_products:2026-07-17"
# 3) "inventory_cache:PROD-001"
# ...

# 4. Get specific values
GET daily_sales:2026-07-17

# Expected: "300000" (or numeric string)

# 5. Hash values
HGETALL top_products:2026-07-17

# Expected:
# 1) "Cola 330ml"
# 2) "5"
# 3) "Bánh mỳ"
# 4) "3"

# 6. Key expiration
TTL daily_sales:2026-07-17

# Expected: 86300 (seconds, ~1 day)

# 7. Memory by key pattern
MEMORY DOCTOR

# 8. Clear cache (optional)
FLUSHDB

# Verify:
DBSIZE
# Expected: 0
```

### Performance
```bash
# Monitor operations per second
redis-cli --stat

# Expected during demo:
# ops/sec: 100-500 (cache hits/misses)

# Memory fragmentation
INFO memory | grep fragmentation

# Expected: < 1.5
```

---

## 6️⃣ Kafka Message Broker

### Tech Details
- **Version:** Apache Kafka 3.7.0
- **Mode:** KRaft (no Zookeeper)
- **Topics:** orders, order-events, inventory-updates
- **Partitions:** 3 (distributed)
- **Replication Factor:** 1
- **Retention:** 7 days

### Port: 9092

### Demo: Monitor Kafka

```bash
# 1. List topics
docker exec smartmart_kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list

# Expected:
# __consumer_offsets
# orders
# order-events
# inventory-updates

# 2. Topic details
docker exec smartmart_kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic orders

# Expected:
# Topic: orders  Partitions: 3  Replication factor: 1

# 3. Consume messages from beginning
docker exec smartmart_kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --from-beginning \
  --max-messages 5 \
  --property print.timestamp=true

# Expected output (sample):
# CreateTime:1689596445000  ORD-20260717-001: {
#   "orderId": "ORD-20260717-001",
#   "customerId": null,
#   "totalAmount": 60000,
#   "items": [{"productId": "PROD-COLA", "quantity": 2}],
#   "eventType": "ORDER_COMPLETED"
# }

# 4. Check consumer group
docker exec smartmart_kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group smartmart-ai-service \
  --describe

# Expected: Shows lag (ideally 0)

# 5. Monitor in real-time
docker exec smartmart_kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --from-latest \
  --property print.timestamp=true \
  --property print.key=true
```

### Performance Metrics
```bash
# Check broker metrics
docker logs smartmart_kafka | grep -i "produced\|consumed\|lag"

# Expected:
# Messages produced: 50-100 per minute
# Consumer lag: < 1 second
```

---

## 7️⃣ Prometheus (Metrics Collection)

### Tech Details
- **Version:** Prometheus 2.47
- **Retention:** 30 days
- **Scrape Interval:** 15 seconds
- **Storage:** ~1-2GB for 30 days
- **Targets:** Backend, AI, PostgreSQL, Redis, Node Exporter, cAdvisor

### Port: 9090

### Demo: Query Prometheus

```bash
# 1. UI
# Open: http://localhost:9090

# 2. Graph tab → Query examples

# Query 1: Request rate
sum(rate(http_server_requests_seconds_count[5m])) by (status)

# Expected: Line chart showing RPS by status code

# Query 2: Latency percentiles
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))

# Expected: P95 latency ~100-150ms

# Query 3: JVM Heap
jvm_memory_used_bytes{area="heap"} / 1024 / 1024 / 1024

# Expected: ~350-500 MB graph

# Query 4: Active database connections
hikaricp_connections_active

# Expected: 1-5 connections

# Query 5: Service health
up{job=~"smartmart_backend|smartmart_ai_service|postgres|redis"}

# Expected: Multiple time series = 1 (UP)

# 3. Targets page
# http://localhost:9090/targets

# Expected: All targets UP
# - smartmart_backend:8080/actuator/prometheus (UP)
# - smartmart_ai_service:8000/metrics (UP)
# - postgres_exporter:9187 (UP)
# - redis_exporter:9121 (UP)
# - node_exporter:9100 (UP)
# - cadvisor:8082 (UP)

# 4. API queries via curl
curl 'http://localhost:9090/api/v1/query?query=up' | jq '.data.result[] | {job: .metric.job, value: .value[1]}'

# Expected:
# {
#   "job": "smartmart_backend",
#   "value": "1"
# }

# 5. Range queries
curl 'http://localhost:9090/api/v1/query_range?query=http_server_requests_seconds_count&start=TIMESTAMP_1h_ago&end=NOW&step=60s' | jq .
```

### Alert Rules
```bash
# Alerts page
# http://localhost:9090/alerts

# Status should show configured alerts:
# - Backend DOWN
# - AI Service DOWN
# - High Memory (pending)
# - High CPU (pending)
# - Disk Low (pending)
```

---

## 8️⃣ Grafana (Dashboard & Alerting)

### Tech Details
- **Version:** Grafana 11.0.0
- **Dashboards:** 5 total
  - SmartMart System Overview (custom)
  - Node Exporter Full (community)
  - Spring Boot (community)
  - Redis (community)
  - PostgreSQL (community)
- **Data Source:** Prometheus
- **Alert Channels:** Telegram, Email

### Port: 3000

### Demo: Explore Grafana

```bash
# 1. Login
# URL: http://localhost:3000
# Username: admin
# Password: admin (or from .env GRAFANA_ADMIN_PASSWORD)

# 2. Navigate to dashboards
# Dashboards → "SmartMart — System Overview"

# Expected panels:
# ✓ Backend Status (UP/DOWN indicator)
# ✓ HTTP Request Rate (area chart)
# ✓ Backend Latency (P50/P95/P99 gauges)
# ✓ JVM Heap Memory (line chart)
# ✓ PostgreSQL Connections (gauge)
# ✓ Redis Memory (line chart)
# ✓ Disk Usage (gauge)
# ✓ CPU & RAM (time series)

# 3. View metrics in panels
# Click on panel → "Inspect" → view query

# Example query:
# sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))

# 4. Drill down by clicking
# Click on service name in legend to filter

# 5. Check alert rules
# Alerting → Alert rules

# Expected rules:
# - Backend DOWN (critical)
# - AI Service DOWN (warning)
# - High Memory (warning)
# - High CPU (warning)
# - Disk > 80% (warning)
# - Disk > 95% (critical)

# 6. Test alert
# Firing tab should show any active alerts
# (If all green, no alerts firing = good)

# 7. Notifications
# Alerting → Contact Points

# Expected: Telegram contact point configured
# Status: Connected ✓

# 8. Create custom dashboard
# Click "+" → Dashboard → Add panel
# Query: sum(business_orders_created_total) (if metric exists)
```

---

## 9️⃣ GitHub Actions (CI/CD Pipeline)

### Tech Details
- **Workflow:** Build & Deploy to VPS
- **Triggers:** Push to main, manual dispatch
- **Jobs:** detect-changes, notify-start, build-backend, build-ai-service, deploy
- **Container Registry:** GitHub Container Registry (GHCR)
- **Deployment:** SSH to VPS, docker pull + docker compose up
- **Notifications:** Telegram

### Demo: Watch GitHub Actions

```bash
# 1. Repository
# https://github.com/datnguyencoder/smartAI

# 2. Actions tab
# View workflow runs

# 3. Click recent run
# See job diagram with status (✓ or ✗)

# 4. Expand each job
# - notify-start: Telegram message sent
# - build-backend: Maven compile, Docker build, push GHCR
# - build-ai-service: Docker build, push GHCR
# - deploy: SSH to VPS, docker pull, docker compose up

# 5. View logs for each step
# Click step → expand log

# Expected successful job:
# ✓ Checkout
# ✓ Setup Java
# ✓ Maven package
# ✓ Docker login
# ✓ Docker build and push
# ✓ Telegram notification

# 6. Check image in GHCR
# https://github.com/datnguyencoder/smartAI/pkgs/container/smartai-backend

# Tags available:
# - latest (most recent)
# - sha-abc123def (git commit hash)

# 7. Docker image size
# Example: ghcr.io/datnguyencoder/smartai-backend:latest
# Size: ~250MB (compressed), ~800MB (uncompressed)

# 8. Deployment logs
# Last 10s of SSH deploy output shows:
# - Docker pull time: 20-40s
# - Image extraction: 5-10s
# - Container start: 5-15s
# - Health checks: 20-30s
# Total: ~1-2 minutes

# 9. Telegram notification sample
# 🚀 SmartAI — Build Started
# ├ Commit: abc123def456
# ├ Branch: main
# ├ By: datnguyencoder
# ├ Message: feat(ci): add path-based builds
# ├ Backend: 🔨 rebuild
# └ AI Service: ⏭ skip
#
# ✅ Backend image built & pushed → GHCR
# ✅ AI Service image built & pushed → GHCR
#
# 🎉 SmartAI — Deploy thành công!
# ├ Commit: abc123def456
# ├ By: datnguyencoder
# ├ Message: feat(ci): add path-based builds
# ├ Backend: 🔨 rebuilt
# ├ AI Service: ⏭ skipped
# └ Dashboard: http://160.191.242.125:3000
```

### Performance Baseline
- Build backend: ~150-180s
- Build AI service: ~80-120s (Docker layer cache)
- Deploy: ~60-90s
- Total: ~5-8 minutes

---

## 📊 Performance Baseline

### During Normal Operations

```
Request Rate:      100-200 req/min
Latency P50:       30-50 ms
Latency P95:       80-150 ms
Latency P99:       150-250 ms
Error Rate:        < 0.5%
CPU Usage:         20-40%
Memory Usage:      60-70% of 4GB
Uptime:            99.9%+
```

### During Heavy Load (Demo)

```
Request Rate:      300-500 req/min (3-5 x baseline)
Latency P50:       50-80 ms
Latency P95:       150-250 ms
Latency P99:       300-500 ms
Error Rate:        < 1%
CPU Usage:         50-70%
Memory Usage:      75-85% of 4GB
Uptime:            99.9%+
```

---

## ✅ Verification Checklist

Before demo, verify:

- [ ] All services passing health checks
- [ ] Prometheus scraping all targets
- [ ] Grafana dashboards loading with data
- [ ] Kafka topics created
- [ ] Redis has sample cache keys
- [ ] PostgreSQL has > 100 products
- [ ] GitHub Actions workflow visible
- [ ] Telegram bot responding to messages
- [ ] Frontend loads without errors
- [ ] Backend Swagger docs accessible
- [ ] AI Service forecast API working

---

**Last Updated:** 2026-07-17  
**Version:** 1.0  
**Complete Stack Coverage:** ✅ 100%
