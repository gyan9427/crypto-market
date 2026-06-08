#!/usr/bin/env node
/**
 * Validates git tag matches app.json and package.json versions.
 * Usage: node scripts/validate-version-tag.js [tag]
 *   tag defaults to GITHUB_REF_NAME or argv[2]
 */
const fs = require('fs');
const path = require('path');

const tag =
  process.argv[2] ||
  process.env.GITHUB_REF_NAME ||
  process.env.GITHUB_REF?.replace('refs/tags/', '');

if (!tag) {
  console.log('No tag provided — skipping version tag validation');
  process.exit(0);
}

const prereleasePattern = /-(alpha|beta|rc)/i;
if (process.env.REJECT_PRERELEASE === 'true' && prereleasePattern.test(tag)) {
  console.error(`Prerelease tag not allowed for production: ${tag}`);
  process.exit(1);
}

const semverFromTag = tag.replace(/^v/, '');
const appJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')
);
const pkgJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

const appVersion = appJson.expo.version;
const pkgVersion = pkgJson.version;

if (semverFromTag !== appVersion) {
  console.error(
    `Tag version mismatch: tag ${tag} (${semverFromTag}) != app.json version ${appVersion}`
  );
  process.exit(1);
}

if (pkgVersion !== appVersion) {
  console.error(
    `package.json version ${pkgVersion} != app.json version ${appVersion}`
  );
  process.exit(1);
}

console.log(`Version tag validation passed: ${tag} === ${appVersion}`);
process.exit(0);
