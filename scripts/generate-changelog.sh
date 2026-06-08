#!/usr/bin/env bash
# Generate Play Store changelog from git commits between tags.
# Usage: ./scripts/generate-changelog.sh <versionCode> [from_tag] [to_tag]
set -euo pipefail

VERSION_CODE="${1:?versionCode required}"
FROM_TAG="${2:-}"
TO_TAG="${3:-HEAD}"

OUT_DIR="fastlane/metadata/android/en-US/changelogs"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/${VERSION_CODE}.txt"

if [ -n "$FROM_TAG" ]; then
  RANGE="${FROM_TAG}..${TO_TAG}"
  git log "$RANGE" --pretty=format:'- %s' --no-merges > "$OUT_FILE" || echo "- Release ${VERSION_CODE}" > "$OUT_FILE"
else
  git log -20 --pretty=format:'- %s' --no-merges > "$OUT_FILE"
fi

# Play Store limit ~500 chars per locale
head -c 480 "$OUT_FILE" > "${OUT_FILE}.tmp" && mv "${OUT_FILE}.tmp" "$OUT_FILE"
echo "Changelog written to $OUT_FILE"
