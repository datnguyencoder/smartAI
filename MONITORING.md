# SmartMart — Monitoring & Observability

## Tổng quan

Hệ thống giám sát SmartMart dùng 2 công nghệ chính:

| Công nghệ | Vai trò | Port |
|-----------|---------|------|
| **Prometheus + Grafana** | Thu thập metrics → Visualize dashboard → Alert rules | Grafana: 3000, Prometheus: 9090 |
| **Loki + Promtail** | Thu thập & xem log Backend/AI Service qua Grafana Explore | Loki: 3100 (nội bộ) |
| **Uptime Kuma** | Uptime monitoring tất cả endpoint, alert Telegram/Email | 3001 |

> **Lưu ý:** Frontend host trên Vercel (không chạy Docker trên VPS) nên **không có** trong Loki. Xem log frontend tại dashboard Vercel riêng (Project → Deployments → Runtime Logs).

---

## Kiến trúc

```
VPS (160.191.242.125)
│
├── smartmart_backend (Spring Boot :8080)
│   └── /actuator/prometheus  ← Prometheus scrape
│
├── smartmart_ai_service (FastAPI :8000)
│   └── /metrics              ← Prometheus scrape
│
├── smartmart_postgres (:5432)
│   └── postgres-exporter (:9187) ← Prometheus scrape
│
├── smartmart_redis (:6379)
│   └── redis-exporter (:9121)  ← Prometheus scrape
│
├── node-exporter (:9100)    ← CPU/RAM/Disk VPS
├── cadvisor (:8082)         ← Docker container stats
│
├── prometheus (:9090)       ← Thu thập + lưu metrics 30d
├── grafana (:3000)          ← Dashboard + Alert
└── uptime-kuma (:3001)      ← Uptime + notifications
```

---

## Deploy lần đầu trên VPS

```bash
# 1. SSH vào VPS
ssh root@160.191.242.125

# 2. Vào thư mục dự án
cd /opt/smartai   # hoặc nơi bạn clone repo

# 3. Thêm biến môi trường monitoring vào .env
echo 'GRAFANA_ADMIN_PASSWORD=YourStrongPassword123!' >> docker/.env

# 4. Chạy monitoring stack kèm prod stack
docker compose \
  -f docker/docker-compose.prod.yaml \
  -f docker/docker-compose.monitoring.yaml \
  up -d

# 5. Kiểm tra tất cả container
docker compose \
  -f docker/docker-compose.prod.yaml \
  -f docker/docker-compose.monitoring.yaml \
  ps
```

---

## Cấu hình lần đầu sau deploy

### Grafana (http://VPS_IP:3000)
1. Đăng nhập: `admin` / password trong `.env`
2. Đổi password ngay
3. Dashboard **SmartMart — System Overview** đã được auto-provision
4. Vào **Alerting → Contact Points** → thêm Telegram/Email để nhận alert

### Uptime Kuma (http://VPS_IP:3001)
1. Tạo account admin lần đầu
2. Thêm các monitor sau:

| Tên | URL | Interval |
|-----|-----|----------|
| Backend Health | http://localhost:8080/actuator/health | 60s |
| AI Service Health | http://localhost:8000/ai/health | 60s |
| Frontend (Vercel) | https://smart-ai-five.vercel.app | 60s |
| API Domain | https://api.datnguyencoder.asia/actuator/health | 60s |

3. Vào **Settings → Notifications** → kết nối Telegram bot (khuyến nghị)

---

## Grafana Dashboard — SmartMart Overview

Panel đã có sẵn:

| Panel | Metric | Ngưỡng cảnh báo |
|-------|--------|-----------------|
| Backend Status | `up{job="smartmart_backend"}` | 0 = DOWN (đỏ) |
| AI Service Status | `up{job="smartmart_ai_service"}` | 0 = DOWN |
| PostgreSQL | `up{job="postgres"}` | 0 = DOWN |
| Redis | `up{job="redis"}` | 0 = DOWN |
| VPS RAM % | `node_memory_MemAvailable_bytes` | >85% cảnh báo |
| VPS CPU % | `node_cpu_seconds_total` | >90% cảnh báo |
| Disk Used % | `node_filesystem_avail_bytes` | >80% warning, >95% critical |
| HTTP Request Rate | `http_server_requests_seconds_count` | — |
| HTTP Latency P50/P95/P99 | `http_server_requests_seconds_bucket` | P99>2s cảnh báo |
| JVM Heap | `jvm_memory_used_bytes` | >85% cảnh báo |
| Redis Memory | `redis_memory_used_bytes` | — |
| PostgreSQL Connections | `pg_stat_activity_count` | — |

### Import dashboard cộng đồng (tùy chọn)

Grafana.com có sẵn dashboard miễn phí, import bằng ID:
- **Node Exporter Full**: ID `1860`
- **Spring Boot**: ID `12900`
- **Redis**: ID `11835`
- **PostgreSQL**: ID `9628`

Cách import: Grafana → Dashboards → Import → điền ID → Load

---

## Xem Logs (Loki + Promtail)

Backend và AI Service log được Promtail tự động thu thập từ Docker container logs, đẩy vào Loki, xem trực tiếp trong Grafana — không cần SSH vào VPS `docker logs` thủ công nữa.

### Cách xem

1. Grafana → **Explore** (icon la bàn ở sidebar)
2. Chọn datasource **Loki** ở góc trên
3. Gõ query LogQL, ví dụ:

```logql
# Toàn bộ log backend
{container="smartmart_backend"}

# Toàn bộ log AI service
{container="smartmart_ai_service"}

# Chỉ log lỗi (ERROR/WARN) của backend
{container="smartmart_backend"} |= "ERROR" or "WARN"

# Log liên quan AI agent/Gemini
{container="smartmart_backend"} |= "Gemini"

# Log request 5xx
{container="smartmart_backend"} |= "500" or "503"
```

> **Lưu ý:** Nhãn `level` chỉ bám vào dòng log đơn (không kèm stack trace) — với exception Java nhiều dòng, chỉ dòng đầu tiên (có timestamp) khớp được, các dòng `at ...` tiếp theo không mang label. Vì vậy nên **ưu tiên filter theo text** (`|= "ERROR"`) thay vì `level="ERROR"` để không bỏ sót.

4. Có thể **Split** view để xem logs song song với metrics Prometheus (đối chiếu thời điểm lỗi)

### Giới hạn hiện tại

- **Chỉ có Backend + AI Service** — Frontend host trên Vercel, không chạy Docker trên VPS nên Promtail không lấy được. Xem log FE tại Vercel Dashboard → Project → Deployments → Runtime/Build Logs.
- **Retention 7 ngày** — Loki tự xóa log cũ hơn 7 ngày để tránh phình đĩa VPS. Cần lưu lâu hơn thì tăng `retention_period` trong `observability/loki/loki-config.yaml`.
- **Không có log Postgres/Redis/Kafka** — chỉ scrape 2 service nghiệp vụ chính (`smartmart_backend`, `smartmart_ai_service`) theo filter trong `observability/promtail/promtail-config.yaml`. Muốn thêm service nào, sửa `filters.values` trong file đó.

### Deploy lần đầu / sau khi thêm Loki

```bash
docker compose \
  -f docker-compose.prod.yaml \
  -f docker-compose.monitoring.yaml \
  --env-file .env \
  up -d loki promtail grafana
```

---

## Alert Rules (Prometheus)

File: `docker/observability/prometheus-rules/alerts.yml`

| Alert | Điều kiện | Severity |
|-------|-----------|----------|
| BackendDown | Backend không phản hồi > 1 phút | critical |
| AiServiceDown | AI service không phản hồi > 2 phút | warning |
| HighMemoryUsage | RAM > 85% liên tục 5 phút | warning |
| HighCpuUsage | CPU > 90% liên tục 5 phút | warning |
| DiskSpaceLow | Disk > 80% | warning |
| DiskSpaceCritical | Disk > 95% | critical |
| HighErrorRate | Lỗi HTTP 5xx > 5% | warning |
| HighLatency | P99 latency > 2s | warning |
| PostgresDown | PostgreSQL không phản hồi > 1 phút | critical |
| RedisDown | Redis không phản hồi > 1 phút | critical |
| JvmHeapHigh | JVM Heap > 85% | warning |

---

## Metrics Spring Boot

Endpoint: `GET /actuator/prometheus`

Các metric quan trọng:

```
# HTTP
http_server_requests_seconds_count{status,uri,method}
http_server_requests_seconds_bucket{le,uri}

# JVM
jvm_memory_used_bytes{area}          # heap / non-heap
jvm_threads_live_threads
jvm_gc_pause_seconds_count

# HikariCP (connection pool)
hikaricp_connections_active
hikaricp_connections_pending
hikaricp_connections_timeout_total

# Cache (Redis)
cache_gets_total{result,name}

# Kafka
spring_kafka_listener_seconds_count
```

---

## Metrics FastAPI AI Service

Endpoint: `GET /metrics` (Prometheus format)

```
# Request rate
http_request_duration_seconds_count{handler,method,status_code}
http_request_duration_seconds_bucket

# In-progress
http_requests_inprogress{handler,method}
```

---

## Lệnh vận hành thường dùng

```bash
# Xem logs monitoring stack
docker logs smartmart_prometheus --tail 50
docker logs smartmart_grafana --tail 50
docker logs smartmart_uptime_kuma --tail 50

# Reload prometheus config (không cần restart)
curl -X POST http://localhost:9090/-/reload

# Kiểm tra targets prometheus
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Kiểm tra alerts đang fire
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[]'

# Backup Grafana dashboards
docker exec smartmart_grafana grafana-cli admin data-migration

# Dọn prometheus data cũ (nếu disk đầy)
docker exec smartmart_prometheus promtool tsdb list /prometheus
```

---

## Thêm biến .env cần thiết

```env
# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=YourStrongPassword123!

# Đã có sẵn trong prod .env (dùng chung)
POSTGRES_USER=smartmart_admin
POSTGRES_PASSWORD=...
POSTGRES_DB=smartmart_db
```

---

## Bảo mật

- Prometheus (`:9090`) và các exporter (`:9100`, `:9121`, `:9187`) chỉ bind `127.0.0.1` — không expose ra internet.
- Grafana (`:3000`) và Uptime Kuma (`:3001`) expose ra internet để xem dashboard từ xa.
- **Nên đặt sau Nginx** với basic auth hoặc IP whitelist nếu môi trường nhạy cảm.

Nginx snippet bảo vệ Grafana:
```nginx
location /grafana/ {
    proxy_pass http://localhost:3000/;
    auth_basic "Monitoring";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

---

## Troubleshooting

| Vấn đề | Kiểm tra |
|--------|----------|
| Prometheus không scrape được backend | `docker exec smartmart_backend wget -qO- http://localhost:8080/actuator/prometheus \| head` |
| Grafana không thấy data | Prometheus Targets: http://localhost:9090/targets |
| Node Exporter không có data | `curl http://localhost:9100/metrics \| grep node_cpu` |
| Redis Exporter fail | `docker logs smartmart_redis_exporter` |
| Uptime Kuma không ping được | Kiểm tra network `smartmart_network` có external: true |
