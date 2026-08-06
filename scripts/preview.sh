#!/usr/bin/env bash
# Launch a local preview of Universal Compress.
# Runs the dev server in the foreground — press Ctrl-C to stop.
#
#   Usage:  ./scripts/preview.sh [port]     (default 5200)
#
# 5200 is this app's port in the registry (Docs_UNI_SIM/dev-preview.md).
# --strictPort means a port clash fails loudly instead of silently serving this
# app on another app's port.
# First run installs deps if node_modules is missing.
#
# NOTE — video compression needs a browser with a WebCodecs H.264 ENCODER, which
# means Chrome, Edge or Safari 16.4+. Firefox will load the page and refuse the
# video panel, which is the behaviour to check, not a fault. PDFs, images and
# audio work everywhere. Nothing here needs the internet.
set -euo pipefail
cd "$(dirname "$0")/.."

port="${1:-5200}"

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)..."
  npm install
fi

echo "Universal Compress -> http://localhost:$port"
npm run dev -- --port "$port" --strictPort
