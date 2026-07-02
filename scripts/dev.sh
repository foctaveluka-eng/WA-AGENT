#!/bin/bash

# Kill anything on our ports first
kill $(cat /tmp/wa-api.pid 2>/dev/null) 2>/dev/null || true
kill $(cat /tmp/wa-frontend.pid 2>/dev/null) 2>/dev/null || true
sleep 1

# Start API server in background
cd /home/runner/workspace/artifacts/api-server
PORT=8080 pnpm run dev &
echo $! > /tmp/wa-api.pid

# Start frontend dev server
cd /home/runner/workspace/artifacts/whatsapp-agent
PORT=5000 BASE_PATH=/ pnpm run dev
