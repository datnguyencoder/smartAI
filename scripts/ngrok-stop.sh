#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT/.ngrok-run"

stop_pid() {
  local f="$1"
  if [[ -f "$f" ]]; then
    local pid
    pid="$(cat "$f")"
    kill "$pid" 2>/dev/null || true
    rm -f "$f"
  fi
}

stop_pid "$PID_DIR/vite.pid"
stop_pid "$PID_DIR/ngrok.pid"
pkill -f "ngrok start --all" 2>/dev/null || true
echo "Đã dừng ngrok và Vite dev."
