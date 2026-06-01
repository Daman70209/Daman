#!/bin/bash
# JARVIS Startup Script
set -e

echo "╔═══════════════════════════════════════╗"
echo "║   J.A.R.V.I.S — STARK INDUSTRIES     ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Start backend
echo "[1/2] Starting AI Core (FastAPI backend)..."
cd "$(dirname "$0")/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

# Wait for backend
sleep 2

# Start frontend
echo "[2/2] Initializing Holographic Interface (Next.js)..."
cd "$(dirname "$0")/frontend"
npm run dev -- --port 3000 &
FRONTEND_PID=$!
echo "      Frontend PID: $FRONTEND_PID"

echo ""
echo "═══════════════════════════════════════════"
echo "  JARVIS is now ONLINE at http://localhost:3000"
echo "  API running at   http://localhost:8000"
echo "═══════════════════════════════════════════"
echo ""
echo "  Set your API key: edit jarvis/backend/.env"
echo "  ANTHROPIC_API_KEY=your_key_here"
echo ""
echo "  Press Ctrl+C to shut down."

wait
