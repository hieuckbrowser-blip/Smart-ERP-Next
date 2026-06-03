#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "[vi-fallback] Hardcoded Vietnamese outside packages/i18n"
rg -n "[\p{L}]" apps/web/src apps/mobile/src apps/desktop/src || true
