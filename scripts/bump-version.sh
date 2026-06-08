#!/usr/bin/env bash
# Bump semver in app.json and package.json. Optionally bump versionCode.
# Usage: ./scripts/bump-version.sh [patch|minor|major] [--bump-code]
set -euo pipefail

PART="${1:-patch}"
BUMP_CODE=false
if [[ "${2:-}" == "--bump-code" ]]; then
  BUMP_CODE=true
fi

node -e "
const fs = require('fs');
const appPath = 'app.json';
const pkgPath = 'package.json';
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const v = app.expo.version.split('.').map(Number);
const part = process.argv[1];
if (part === 'major') { v[0]++; v[1]=0; v[2]=0; }
else if (part === 'minor') { v[1]++; v[2]=0; }
else { v[2]++; }
const next = v.join('.');
app.expo.version = next;
pkg.version = next;
if (process.argv[2] === 'true') {
  app.expo.android.versionCode = (app.expo.android.versionCode || 0) + 1;
}
fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Bumped to', next, 'versionCode:', app.expo.android.versionCode);
" "$PART" "$BUMP_CODE"
