#!/usr/bin/env bash
# Writes Play service account credentials to a temp file for Fastlane.
# Accepts one of:
# - PLAY_STORE_JSON_KEY_PATH (existing file path)
# - PLAY_STORE_SERVICE_ACCOUNT_JSON (raw JSON)
# - PLAY_STORE_SERVICE_ACCOUNT_JSON_B64 (base64-encoded JSON)
set -euo pipefail

if [ -n "${PLAY_STORE_JSON_KEY_PATH:-}" ] && [ -f "${PLAY_STORE_JSON_KEY_PATH}" ]; then
  echo "PLAY_STORE_JSON_KEY_PATH=${PLAY_STORE_JSON_KEY_PATH}" >> "${GITHUB_ENV:-/dev/null}" 2>/dev/null || true
  echo "${PLAY_STORE_JSON_KEY_PATH}"
  exit 0
fi

if [ -z "${PLAY_STORE_SERVICE_ACCOUNT_JSON:-}" ] && [ -z "${PLAY_STORE_SERVICE_ACCOUNT_JSON_B64:-}" ]; then
  echo "::error::Missing Play credentials. Set one of PLAY_STORE_SERVICE_ACCOUNT_JSON, PLAY_STORE_SERVICE_ACCOUNT_JSON_B64, or PLAY_STORE_JSON_KEY_PATH in the GitHub environment. See docs/GITHUB_SECRETS_SETUP.md"
  exit 1
fi

OUT="${PLAY_STORE_JSON_KEY_PATH:-$(mktemp)}"

if [ -n "${PLAY_STORE_SERVICE_ACCOUNT_JSON:-}" ]; then
  printf '%s' "$PLAY_STORE_SERVICE_ACCOUNT_JSON" > "$OUT"
else
  printf '%s' "$PLAY_STORE_SERVICE_ACCOUNT_JSON_B64" | base64 -d > "$OUT"
fi

chmod 600 "$OUT"
echo "PLAY_STORE_JSON_KEY_PATH=$OUT" >> "${GITHUB_ENV:-/dev/null}" 2>/dev/null || export PLAY_STORE_JSON_KEY_PATH="$OUT"
echo "$OUT"
