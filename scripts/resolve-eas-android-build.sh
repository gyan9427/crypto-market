#!/usr/bin/env bash
# Reuse a finished EAS Android build for the current commit when possible; otherwise build.
set -euo pipefail

PROFILE="${1:?usage: resolve-eas-android-build.sh <staging|production> <output.json>}"
OUT_JSON="${2:?usage: resolve-eas-android-build.sh <profile> <output.json>}"
GIT_SHA="${GITHUB_SHA:-}"

mkdir -p "$(dirname "$OUT_JSON")"

VERSION_META="$(
  node -e "
    const app = require('./app.json').expo;
    process.stdout.write(JSON.stringify({
      version: app.version,
      versionCode: String(app.android?.versionCode ?? ''),
    }));
  "
)"
APP_VERSION="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).version)" "$VERSION_META")"
APP_BUILD_VERSION="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).versionCode)" "$VERSION_META")"

write_env() {
  if [ -n "${GITHUB_ENV:-}" ]; then
    printf '%s\n' "$1" >> "$GITHUB_ENV"
  fi
}

parse_build_id() {
  node -e "
    const fs = require('fs');
    const raw = fs.readFileSync(process.argv[1], 'utf8');
    let data;
    try { data = JSON.parse(raw); } catch { process.exit(2); }
    const entry = Array.isArray(data) ? data[0] : data;
    const id = entry?.id || '';
    if (!id || id === 'null' || id === 'undefined') process.exit(3);
    process.stdout.write(String(id));
  " "$OUT_JSON"
}

find_reusable_build() {
  local args=(
    eas-cli build:list
    --platform android
    --build-profile "$PROFILE"
    --status finished
    --limit 10
    --json
    --non-interactive
  )
  if [ -n "$GIT_SHA" ]; then
    args+=(--git-commit-hash "$GIT_SHA")
  fi

  local list_json
  list_json="$(npx "${args[@]}")"

  node -e "
    const builds = JSON.parse(process.argv[1]);
    const expectedVersion = process.argv[2];
    const expectedBuild = process.argv[3];
    const items = Array.isArray(builds) ? builds : [];
    const match = items.find((build) =>
      build.status === 'FINISHED' &&
      build.buildProfile === process.argv[4] &&
      build.platform === 'ANDROID' &&
      build.appVersion === expectedVersion &&
      String(build.appBuildVersion) === expectedBuild &&
      (build.artifacts?.buildUrl || build.artifacts?.applicationArchiveUrl)
    );
    if (!match) process.exit(1);
    process.stdout.write(JSON.stringify(match));
  " "$list_json" "$APP_VERSION" "$APP_BUILD_VERSION" "$PROFILE"
}

if EXISTING_JSON="$(find_reusable_build 2>/dev/null)"; then
  BUILD_ID="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).id)" "$EXISTING_JSON")"
  printf '%s\n' "$EXISTING_JSON" > "$OUT_JSON"
  echo "Reusing EAS build ${BUILD_ID} for profile=${PROFILE} commit=${GIT_SHA:-unknown} version=${APP_VERSION} (${APP_BUILD_VERSION})"
  write_env "EAS_BUILD_REUSED=true"
else
  echo "No reusable EAS build for profile=${PROFILE} commit=${GIT_SHA:-unknown}; starting new EAS build"
  BUILD_JSON="$(npx eas-cli build --platform android --profile "$PROFILE" --non-interactive --wait --json)"
  printf '%s\n' "$BUILD_JSON" > "$OUT_JSON"
  write_env "EAS_BUILD_REUSED=false"
fi

BUILD_ID="$(parse_build_id)"
write_env "EAS_BUILD_ID=${BUILD_ID}"
