#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/.ngrok-run/ngrok-swagger.pid"
if [[ -f "$PID_FILE" ]]; then
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
  rm -f "$PID_FILE"
fi
pkill -f "ngrok http 8080" 2>/dev/null || true
echo "Đã dừng ngrok Swagger."
