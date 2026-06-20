#!/usr/bin/env bash
# Resolve/build EAS artifact, optionally skip download when Play already has this version.
set -euo pipefail

PROFILE="${1:?usage: prepare-android-deploy.sh <staging|production> <internal|production> <build.json> <output.aab>}"
PLAY_TRACK="${2:?usage: prepare-android-deploy.sh <profile> <track> <build.json> <output.aab>}"
BUILD_JSON="${3:?usage: prepare-android-deploy.sh <profile> <track> <build.json> <output.aab>}"
OUT_AAB="${4:?usage: prepare-android-deploy.sh <profile> <track> <build.json> <output.aab>}"

write_env() {
  if [ -n "${GITHUB_ENV:-}" ]; then
    printf '%s\n' "$1" >> "$GITHUB_ENV"
  fi
}

bash scripts/resolve-eas-android-build.sh "$PROFILE" "$BUILD_JSON"

if bash scripts/check-play-deployed.sh "$PLAY_TRACK"; then
  write_env "DEPLOY_SKIPPED=true"
  write_env "PLAY_UPLOAD_STATUS=PLAY_UPLOAD_SKIPPED_ALREADY_DEPLOYED"
  echo "Skipping AAB download and Play upload"
  exit 0
fi

write_env "DEPLOY_SKIPPED=false"
bash scripts/download-eas-aab.sh "$BUILD_JSON" "$OUT_AAB"
