#!/usr/bin/env node
/**
 * Writes artifacts/release-manifest.json for release provenance.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const version = appJson.expo.version;
const versionCode = String(appJson.expo.android?.versionCode ?? '');

const aabPath = process.argv[2];
let aabSha256 = null;
if (aabPath && fs.existsSync(aabPath)) {
  const buf = fs.readFileSync(aabPath);
  aabSha256 = crypto.createHash('sha256').update(buf).digest('hex');
}

const manifest = {
  version,
  versionCode,
  gitSha: process.env.GITHUB_SHA || process.env.EAS_BUILD_GIT_COMMIT_HASH || 'unknown',
  gitTag: process.env.GITHUB_REF_NAME || null,
  easBuildId: process.env.EAS_BUILD_ID || process.env.EAS_BUILD_ID_OUTPUT || null,
  aabSha256,
  aabPath: aabPath || null,
  playTrack: process.env.PLAY_TRACK || 'internal',
  deployedAt: new Date().toISOString(),
  deployedBy: process.env.GITHUB_ACTOR || 'local',
  workflow: process.env.GITHUB_WORKFLOW || null,
  runId: process.env.GITHUB_RUN_ID || null,
};

const outDir = path.join('artifacts');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'release-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Wrote', outPath);
console.log(JSON.stringify(manifest, null, 2));
