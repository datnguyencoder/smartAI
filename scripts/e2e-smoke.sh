#!/usr/bin/env bash
# Smoke test full stack — chạy khi Docker đã up (docker compose ps = healthy)
set -euo pipefail
API="${API_BASE:-http://localhost:8080}"
AI="${AI_BASE:-http://localhost:8000}"
FE="${FE_BASE:-http://localhost:5173}"

pass=0
fail=0

check() {
  local name="$1"
  shift
  if bash -c "$*"; then
    echo "OK  $name"
    pass=$((pass + 1))
  else
    echo "FAIL $name"
    fail=$((fail + 1))
  fi
}

echo "=== SmartMart E2E smoke ==="

check "AI health" "curl -sf '$AI/ai/health' | grep -q '\"status\"'"
check "BE OpenAPI" "curl -sf '$API/v3/api-docs' | grep -q openapi"
check "Media static" "test \"\$(curl -sf -o /dev/null -w '%{http_code}' '$API/media/items/milk-vnm-1l.svg')\" = 200"
check "FE home" "test \"\$(curl -sf -o /dev/null -w '%{http_code}' '$FE/')\" = 200"

login() {
  curl -sf -X POST "$API/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"$2\"}"
}

STAFF_TOKEN=$(login staff staff123 | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])')
ADMIN_TOKEN=$(login admin admin123 | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])')

check "Staff items list" "curl -sf -H 'Authorization: Bearer $STAFF_TOKEN' '$API/api/v1/items' | python3 -c \"
import sys, json
d = json.load(sys.stdin)
assert d['success'] and len(d['data']) > 0 and d['data'][0].get('imageUrl')
\""

check "Staff logout" "
  curl -sf -X POST '$API/api/v1/auth/logout' -H 'Authorization: Bearer $STAFF_TOKEN' | python3 -c \"import sys,json; assert json.load(sys.stdin)['success']\"
  code=\$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $STAFF_TOKEN' '$API/api/v1/items')
  test \"\$code\" = 401
"

STAFF_TOKEN2=$(login staff staff123 | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])')
check "Staff RBAC users forbidden" "test \"\$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $STAFF_TOKEN2' '$API/api/v1/users')\" = 403"

check "Admin users list" "curl -sf -H 'Authorization: Bearer $ADMIN_TOKEN' '$API/api/v1/users' | python3 -c \"import sys,json; assert json.load(sys.stdin)['success']\""

WH_TOKEN=$(login warehouse warehouse123 | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])')
check "Warehouse POS forbidden" "test \"\$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $WH_TOKEN' -X POST '$API/api/v1/orders' -H 'Content-Type: application/json' -d '{\"customerName\":\"x\",\"items\":[{\"itemId\":1,\"quantity\":1}]}')\" = 403"

check "Inventory alerts API" "curl -sf -H 'Authorization: Bearer $STAFF_TOKEN2' '$API/api/v1/inventory-alerts' | python3 -c \"import sys,json; assert json.load(sys.stdin)['success']\""

check "AI model metrics" "curl -sf '$AI/ai/model/metrics' | python3 -c \"import sys,json; d=json.load(sys.stdin); assert 'model_type' in d or 'mae' in d\" || test \"\$(curl -s -o /dev/null -w '%{http_code}' '$AI/ai/model/metrics')\" = 404"

check "Forecast train admin" "curl -sf -X POST -H 'Authorization: Bearer $ADMIN_TOKEN' '$API/api/v1/forecast/train' | python3 -c \"import sys,json; assert json.load(sys.stdin)['success']\""

check "Forecast recommendations admin" "curl -sf -H 'Authorization: Bearer $ADMIN_TOKEN' '$API/api/v1/forecast/recommendations' | python3 -c \"import sys,json; assert json.load(sys.stdin)['success']\""

check "Forecast recommendations staff forbidden" "test \"\$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $STAFF_TOKEN2' '$API/api/v1/forecast/recommendations')\" = 403"

check "Order print endpoint" "
  FIRST_ORDER=\$(curl -sf -H 'Authorization: Bearer $STAFF_TOKEN2' '$API/api/v1/orders' | python3 -c 'import sys,json; d=json.load(sys.stdin).get(\"data\") or []; print(d[0][\"id\"] if d else \"\")')
  if [ -z \"\$FIRST_ORDER\" ]; then exit 0; fi
  test \"\$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $STAFF_TOKEN2' '$API/api/v1/orders/'\$FIRST_ORDER'/print')\" = 200
"

echo "=== Kết quả: $pass passed, $fail failed ==="
test "$fail" -eq 0
