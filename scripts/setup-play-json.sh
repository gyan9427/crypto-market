#!/usr/bin/env bash
# Writes PLAY_STORE_SERVICE_ACCOUNT_JSON secret to a temp file for Fastlane.
set -euo pipefail

if [ -z "${PLAY_STORE_SERVICE_ACCOUNT_JSON:-}" ]; then
  echo "::error::PLAY_STORE_SERVICE_ACCOUNT_JSON is not set. Add it to the GitHub environment (internal-deploy or production-release). See docs/GITHUB_SECRETS_SETUP.md"
  exit 1
fi

OUT="${PLAY_STORE_JSON_KEY_PATH:-$(mktemp)}"
echo "$PLAY_STORE_SERVICE_ACCOUNT_JSON" > "$OUT"
chmod 600 "$OUT"
echo "PLAY_STORE_JSON_KEY_PATH=$OUT" >> "${GITHUB_ENV:-/dev/null}" 2>/dev/null || export PLAY_STORE_JSON_KEY_PATH="$OUT"
echo "$OUT"
