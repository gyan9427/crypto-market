#!/usr/bin/env bash
# Detects native-impacting file changes (OTA-unsafe) in a PR diff.
set -euo pipefail

BASE_REF="${1:-origin/main}"
NATIVE_PATTERNS='^(app\.json|app\.config\.(ts|js)|eas\.json|google-services\.json|package\.json|package-lock\.json|patches/)'

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "Base ref $BASE_REF not found — skipping native drift check"
  exit 0
fi

CHANGED=$(git diff --name-only "$BASE_REF"...HEAD || true)

if [ -z "$CHANGED" ]; then
  echo "No changed files — native drift check passed"
  exit 0
fi

NATIVE_HITS=""
while IFS= read -r file; do
  if echo "$file" | grep -Eq "$NATIVE_PATTERNS"; then
    if echo "$file" | grep -q 'package.json'; then
      if git diff "$BASE_REF"...HEAD -- package.json | grep -E '^\+.*"(expo|react-native|@react-native)' >/dev/null 2>&1; then
        NATIVE_HITS="${NATIVE_HITS}\n  - $file (native dependency change)"
      fi
    else
      NATIVE_HITS="${NATIVE_HITS}\n  - $file"
    fi
  fi
done <<< "$CHANGED"

if [ -n "$NATIVE_HITS" ]; then
  echo "::warning title=Native change detected::OTA-only deploy is NOT safe for this PR. Requires EAS build + store release."
  printf 'Native-impacting changes:%b\n' "$NATIVE_HITS"
  exit 0
fi

echo "Native drift check passed"
exit 0
