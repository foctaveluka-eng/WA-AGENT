#!/bin/bash
set -e

# Build frontend only if not already built
if [ ! -f "/home/runner/workspace/artifacts/whatsapp-agent/dist/public/index.html" ]; then
  echo "=== Building frontend ==="
  cd /home/runner/workspace/artifacts/whatsapp-agent
  PORT=5000 BASE_PATH=/ pnpm run build
fi

echo "=== Building API server ==="
cd /home/runner/workspace/artifacts/api-server
pnpm run build

echo "=== Freeing port 5000 ==="
# Kill any process holding port 5000 (fuser + fallback pkill)
fuser -k 5000/tcp 2>/dev/null || true
pkill -f "dist/index.mjs" 2>/dev/null || true
sleep 2

echo "=== Starting server on port 5000 ==="
PORT=5000 exec node --enable-source-maps ./dist/index.mjs
