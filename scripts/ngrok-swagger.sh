#!/usr/bin/env bash
# Kiểm tra backend + hướng dẫn / trạng thái tunnel Swagger qua ngrok.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yaml"
PID_DIR="$ROOT/.ngrok-run"

mkdir -p "$PID_DIR"
die() { echo "ERROR: $*" >&2; exit 1; }

if ! command -v ngrok >/dev/null 2>&1; then
  die "Chưa cài ngrok. brew install ngrok/ngrok/ngrok"
fi
if ! ngrok config check >/dev/null 2>&1; then
  die "Chưa có authtoken. Chạy: ngrok config add-authtoken <TOKEN>"
fi

echo "[1/2] Đảm bảo backend đang chạy..."
docker compose -f "$COMPOSE_FILE" up -d postgres redis kafka ai-service backend 2>/dev/null || true

for _ in $(seq 1 20); do
  if curl -sf "http://localhost:8080/v3/api-docs" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -sf "http://localhost:8080/v3/api-docs" >/dev/null \
  || die "Backend chưa sẵn sàng :8080"

echo "[2/2] Kiểm tra tunnel ngrok..."
PUBLIC_URL=""
for port in 4040 4041 4042; do
  PUBLIC_URL="$(curl -sf "http://127.0.0.1:${port}/api/tunnels" 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || true)"
  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
done

if [[ -n "$PUBLIC_URL" ]]; then
  echo "$PUBLIC_URL/swagger-ui/index.html" >"$PID_DIR/swagger-url.txt"
  echo ""
  echo "=============================================="
  echo "  Swagger đang ONLINE"
  echo "=============================================="
  echo "  $PUBLIC_URL/swagger-ui/index.html"
  echo ""
  echo "  Login: admin / admin123"
  echo "  Dừng ngrok: Ctrl+C ở terminal đang chạy ngrok"
  echo "=============================================="
else
  echo ""
  echo "=============================================="
  echo "  Backend OK — chưa có tunnel ngrok"
  echo "=============================================="
  echo "  Mở terminal MỚI, chạy và GIỮ MỞ:"
  echo ""
  echo "    ngrok http 8080"
  echo ""
  echo "  Rồi mở: https://<url-ngrok>/swagger-ui/index.html"
  echo "=============================================="
fi
