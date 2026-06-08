#!/usr/bin/env node
/**
 * Asserts Expo SDK major version aligns with expected range.
 */
const pkg = require('../package.json');

const expoVersion = pkg.dependencies?.expo ?? '';
const rnVersion = pkg.dependencies?.['react-native'] ?? '';

const expoMajor = expoVersion.match(/(\d+)/)?.[1];
if (!expoMajor) {
  console.error('Could not parse expo version from package.json');
  process.exit(1);
}

// crypto-market targets Expo SDK 56
const expectedMajor = '56';
if (expoMajor !== expectedMajor) {
  console.error(
    `Expo SDK major ${expoMajor} != expected ${expectedMajor}. Update scripts/check-expo-sdk-compat.js after SDK upgrade.`
  );
  process.exit(1);
}

if (!rnVersion) {
  console.error('react-native dependency missing');
  process.exit(1);
}

console.log(`Expo SDK compat OK: expo@${expoVersion}, react-native@${rnVersion}`);
process.exit(0);
