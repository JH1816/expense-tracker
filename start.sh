#!/usr/bin/env bash
set -e

# ── Backend ──────────────────────────────────────────────────────────────────
echo "Setting up backend…"
cd "$(dirname "$0")/backend"
pip install -r requirements.txt -q
python app.py &
BACKEND_PID=$!
echo "Backend running (PID $BACKEND_PID) on http://localhost:5000"

# ── Frontend ─────────────────────────────────────────────────────────────────
echo "Setting up frontend…"
cd "../frontend"
npm install --silent
echo "Frontend starting on http://localhost:5173"
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
