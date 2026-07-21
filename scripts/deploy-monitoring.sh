#!/usr/bin/env bash
# =============================================================================
# SmartMart — Deploy Monitoring Stack (Prometheus + Grafana)
# Chạy trên VPS với: bash deploy-monitoring.sh
# =============================================================================
set -euo pipefail

REPO_DIR="/opt/smartai"
DOCKER_DIR="$REPO_DIR/docker"
ENV_FILE="$DOCKER_DIR/.env"
COMPOSE_PROD="$DOCKER_DIR/docker-compose.prod.yaml"
COMPOSE_MON="$DOCKER_DIR/docker-compose.monitoring.yaml"
REPO_URL="https://github.com/datnguyencoder/smartAI.git"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $*${NC}"; }
warn() { echo -e "${YELLOW}[!] $*${NC}"; }
err()  { echo -e "${RED}[✘] $*${NC}"; exit 1; }

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SmartMart Monitoring Deploy  $(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}\n"

# ── 1. Kiểm tra Docker ────────────────────────────────────────────────────────
log "Kiểm tra Docker..."
docker --version || err "Docker chưa cài. Chạy: curl -fsSL https://get.docker.com | sh"
docker compose version || err "Docker Compose plugin chưa có."

# ── 2. Clone / Pull repo ──────────────────────────────────────────────────────
if [ -d "$REPO_DIR/.git" ]; then
  log "Repo đã có, pulling latest..."
  git -C "$REPO_DIR" pull --rebase origin main
else
  log "Clone repo về $REPO_DIR..."
  git clone "$REPO_URL" "$REPO_DIR"
fi

# ── 3. Tạo / cập nhật .env ───────────────────────────────────────────────────
log "Kiểm tra .env..."
if [ ! -f "$ENV_FILE" ]; then
  warn ".env chưa có — tạo mới với giá trị mặc định..."
  cat > "$ENV_FILE" <<'ENVEOF'
# ── PostgreSQL ──────────────────────────────────────────────────────────────
POSTGRES_DB=smartmart_db
POSTGRES_USER=smartmart_admin
POSTGRES_PASSWORD=SmartMart@2026!

# ── JWT ─────────────────────────────────────────────────────────────────────
JWT_SECRET=smartmart-super-secret-key-for-production-2026-very-long
JWT_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_MS=604800000

# ── AI Keys (điền vào) ───────────────────────────────────────────────────────
GEMINI_API_KEY=
CEREBRAS_API_KEY=

# ── Monitoring ───────────────────────────────────────────────────────────────
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=SmartMart@Grafana2026!
ENVEOF
  warn "⚠️  Hãy điền GEMINI_API_KEY và CEREBRAS_API_KEY vào $ENV_FILE trước khi dùng AI chat!"
fi

# Đảm bảo GRAFANA_ADMIN_PASSWORD tồn tại
if ! grep -q "GRAFANA_ADMIN_PASSWORD" "$ENV_FILE"; then
  echo "" >> "$ENV_FILE"
  echo "GRAFANA_ADMIN_USER=admin" >> "$ENV_FILE"
  echo "GRAFANA_ADMIN_PASSWORD=SmartMart@Grafana2026!" >> "$ENV_FILE"
  log "Đã thêm GRAFANA_ADMIN_PASSWORD vào .env"
fi

# ── 4. Tạo external network nếu chưa có ─────────────────────────────────────
log "Kiểm tra Docker network smartmart_network..."
docker network inspect smartmart_network >/dev/null 2>&1 \
  || docker network create smartmart_network
log "Network smartmart_network OK"

# ── 5. Start prod stack (nếu chưa chạy) ──────────────────────────────────────
log "Kiểm tra prod containers..."
BACKEND_RUNNING=$(docker ps --filter "name=smartmart_backend" --filter "status=running" -q)
if [ -z "$BACKEND_RUNNING" ]; then
  warn "Prod stack chưa chạy. Khởi động..."
  docker compose -f "$COMPOSE_PROD" --env-file "$ENV_FILE" up -d \
    postgres redis kafka ai-service backend
  log "Đang chờ backend healthy..."
  sleep 20
fi

# ── 6. Deploy monitoring stack ───────────────────────────────────────────────
log "Deploy monitoring stack..."
docker compose \
  -f "$COMPOSE_PROD" \
  -f "$COMPOSE_MON" \
  --env-file "$ENV_FILE" \
  pull --quiet \
  node-exporter cadvisor postgres-exporter redis-exporter \
  prometheus grafana 2>&1 | tail -5

docker compose \
  -f "$COMPOSE_PROD" \
  -f "$COMPOSE_MON" \
  --env-file "$ENV_FILE" \
  up -d \
  node-exporter cadvisor postgres-exporter redis-exporter \
  prometheus grafana

log "Đang chờ services khởi động (30s)..."
sleep 30

# ── 7. Health check ───────────────────────────────────────────────────────────
echo ""
log "═══ Health Check ═══"

check_service() {
  local name=$1 url=$2
  if curl -sf "$url" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✔ $name${NC}"
  else
    echo -e "  ${RED}✘ $name — $url${NC}"
  fi
}

check_service "Prometheus"     "http://localhost:9090/-/healthy"
check_service "Grafana"        "http://localhost:3000/api/health"
check_service "Node Exporter"  "http://localhost:9100/metrics"
check_service "cAdvisor"       "http://localhost:8082/healthz"
check_service "PG Exporter"    "http://localhost:9187/metrics"
check_service "Redis Exporter" "http://localhost:9121/metrics"

echo ""
log "═══ Prometheus Targets ═══"
sleep 5
curl -sf "http://localhost:9090/api/v1/targets" \
  | python3 -c "
import json,sys
data = json.load(sys.stdin)
for t in data.get('data',{}).get('activeTargets',[]):
    job = t['labels'].get('job','?')
    health = t['health']
    icon = '✔' if health == 'up' else '✘'
    print(f'  {icon} {job}: {health}')
" 2>/dev/null || warn "Prometheus targets chưa sẵn sàng, chờ thêm 30s..."

VPS_IP=$(curl -sf https://ipinfo.io/ip 2>/dev/null || echo "localhost")

# ── 8. Tổng kết ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deploy Hoàn Thành!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📊 Grafana:      ${YELLOW}http://$VPS_IP:3000${NC}"
echo -e "     Login:        admin / SmartMart@Grafana2026!"
echo -e "     Dashboard:    SmartMart > System Overview (auto-loaded)"
echo ""
echo -e "  🔥 Prometheus:   ${YELLOW}http://localhost:9090${NC} (nội bộ)"
echo ""
echo -e "  📋 Xem tất cả containers:"
echo -e "     docker ps --format 'table {{.Names}}\t{{.Status}}'"
echo ""
echo -e "${YELLOW}  ⚠️  Việc cần làm thủ công:${NC}"
echo -e "  1. Grafana: Alerting > Contact Points > thêm Telegram/Email"
echo -e "  2. Điền GEMINI_API_KEY + CEREBRAS_API_KEY vào $ENV_FILE"
echo -e "     rồi: docker compose -f $COMPOSE_PROD --env-file $ENV_FILE up -d backend"
echo ""
