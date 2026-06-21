#!/usr/bin/env bash
# Exit 0 when the Play track already has the current app versionCode.
set -euo pipefail

TRACK="${1:?usage: check-play-deployed.sh <internal|production>}"

EXPECTED_VC="$(
  node -e "process.stdout.write(String(require('./app.json').expo.android.versionCode))"
)"

if [ -z "${PLAY_STORE_JSON_KEY_PATH:-}" ] && [ -z "${PLAY_STORE_SERVICE_ACCOUNT_JSON:-}" ]; then
  echo "Play credentials unavailable; cannot check track version"
  exit 1
fi

TRACK_VC="$(
  bundle exec fastlane android track_version_code track:"$TRACK" 2>/dev/null \
    | grep -E '^[0-9]+$' \
    | tail -n 1 \
    | tr -d '[:space:]'
)"

if [ -z "$TRACK_VC" ]; then
  echo "Could not read versionCode from Play track '${TRACK}'"
  exit 1
fi

echo "Play track '${TRACK}' versionCode=${TRACK_VC}; app.json versionCode=${EXPECTED_VC}"

if [ "$TRACK_VC" -ge "$EXPECTED_VC" ] 2>/dev/null; then
  echo "Play track '${TRACK}' already has versionCode ${TRACK_VC} (>= ${EXPECTED_VC}); deploy can be skipped"
  exit 0
fi

exit 1
