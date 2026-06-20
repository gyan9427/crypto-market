#!/usr/bin/env bash
# Exit 0 when the Play track already has the current app versionCode and EAS build was reused.
set -euo pipefail

TRACK="${1:?usage: check-play-deployed.sh <internal|production>}"

if [ "${EAS_BUILD_REUSED:-false}" != "true" ]; then
  exit 1
fi

EXPECTED_VC="$(
  node -e "process.stdout.write(String(require('./app.json').expo.android.versionCode))"
)"

TRACK_VC="$(
  bundle exec fastlane android track_version_code track:"$TRACK" 2>/dev/null | tail -n 1 | tr -d '[:space:]'
)"

if [ -z "$TRACK_VC" ]; then
  exit 1
fi

if [ "$TRACK_VC" = "$EXPECTED_VC" ]; then
  echo "Play track '${TRACK}' already has versionCode ${EXPECTED_VC}; deploy can be skipped"
  exit 0
fi

exit 1
