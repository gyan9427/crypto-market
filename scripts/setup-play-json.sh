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
RAW_JSON=""

if [ -n "${PLAY_STORE_SERVICE_ACCOUNT_JSON:-}" ]; then
  RAW_JSON="$PLAY_STORE_SERVICE_ACCOUNT_JSON"
else
  RAW_JSON="$(printf '%s' "$PLAY_STORE_SERVICE_ACCOUNT_JSON_B64" | base64 -d)"
fi

PLAY_JSON_RAW="$RAW_JSON" node -e "const raw=process.env.PLAY_JSON_RAW||'';if(!raw.trim()){console.error('PLAY credential payload is empty');process.exit(1)}let parsed;try{parsed=JSON.parse(raw)}catch(e){console.error('Play credential payload is invalid JSON');process.exit(1)}const required=['type','project_id','client_email','private_key'];const missing=required.filter((key)=>!parsed[key]||String(parsed[key]).trim()==='');if(missing.length){console.error('Play credential payload missing required fields: '+missing.join(', '));process.exit(1)}"

printf '%s' "$RAW_JSON" > "$OUT"
chmod 600 "$OUT"
echo "PLAY_STORE_JSON_KEY_PATH=$OUT" >> "${GITHUB_ENV:-/dev/null}" 2>/dev/null || export PLAY_STORE_JSON_KEY_PATH="$OUT"
echo "$OUT"
