#!/usr/bin/env bash
# Download an Android AAB from EAS build --json output without eas build:download.
# eas-cli removed --id/--output from build:download; artifact URLs in build JSON are stable.
set -euo pipefail

BUILD_JSON="${1:?usage: download-eas-aab.sh <eas-build.json> <output.aab>}"
OUT="${2:?usage: download-eas-aab.sh <eas-build.json> <output.aab>}"

ARTIFACT_URL="$(
  node -e "
    const fs = require('fs');
    const raw = fs.readFileSync(process.argv[1], 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('EAS build JSON is invalid');
      process.exit(2);
    }
    const entry = Array.isArray(data) ? data[0] : data;
    const url =
      entry?.artifacts?.buildUrl ||
      entry?.artifacts?.applicationArchiveUrl ||
      entry?.applicationArchiveUrl ||
      '';
    if (!url || url === 'null' || url === 'undefined') {
      console.error('EAS build JSON missing artifacts.buildUrl');
      process.exit(3);
    }
    process.stdout.write(String(url));
  " "$BUILD_JSON"
)"

mkdir -p "$(dirname "$OUT")"
curl -fL "$ARTIFACT_URL" -o "$OUT"
