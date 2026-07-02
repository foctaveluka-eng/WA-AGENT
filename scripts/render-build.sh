#!/usr/bin/env bash
set -e

echo "=== Installing pnpm (user-local, evite EROFS) ==="
npm install -g pnpm --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"

echo "=== pnpm version ==="
pnpm --version

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== Building frontend ==="
BASE_PATH=/ pnpm --filter @workspace/whatsapp-agent run build

echo "=== Building API server ==="
pnpm --filter @workspace/api-server run build

echo "=== Build complete ==="
