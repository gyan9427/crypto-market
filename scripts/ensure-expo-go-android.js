#!/usr/bin/env node
/**
 * Downloads the Expo Go APK matching this project's SDK and optionally installs
 * it on a USB-connected Android device via adb.
 *
 * Play Store Expo Go does not ship SDK 56 yet; sideloading is required.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const expoVersion = pkg.dependencies?.expo ?? '';
const sdkMajor = expoVersion.match(/(\d+)/)?.[1];

if (!sdkMajor) {
  console.error('Could not parse expo version from package.json');
  process.exit(1);
}

const sdkVersion = `${sdkMajor}.0.0`;
const cacheDir = path.join(__dirname, '..', '.expo', 'expo-go-cache');

function resolveAdb() {
  const localAdb = path.join(__dirname, '..', '.tools', 'platform-tools', 'adb');
  if (fs.existsSync(localAdb)) {
    return localAdb;
  }
  return 'adb';
}

async function fetchVersions() {
  const res = await fetch('https://exp.host/--/api/v2/versions');
  if (!res.ok) {
    throw new Error(`Failed to fetch Expo versions (${res.status})`);
  }
  return res.json();
}

async function downloadApk(url, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download Expo Go APK (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

async function main() {
  const versions = await fetchVersions();
  const sdkEntry =
    versions.sdkVersions?.[sdkVersion] ??
    Object.entries(versions.sdkVersions ?? {}).find(([key]) => key.startsWith(`${sdkMajor}.`))?.[1];

  if (!sdkEntry?.androidClientUrl) {
    console.error(`No Android Expo Go download found for SDK ${sdkMajor}.`);
    process.exit(1);
  }

  const clientVersion = sdkEntry.androidClientVersion ?? 'unknown';
  const apkName = `Expo-Go-${clientVersion}.apk`;
  const apkPath = path.join(cacheDir, apkName);

  if (!fs.existsSync(apkPath)) {
    console.log(`Downloading Expo Go ${clientVersion} for SDK ${sdkMajor}...`);
    await downloadApk(sdkEntry.androidClientUrl, apkPath);
    console.log(`Saved to ${apkPath}`);
  } else {
    console.log(`Using cached Expo Go ${clientVersion}: ${apkPath}`);
  }

  const adb = resolveAdb();
  const devices = spawnSync(adb, ['devices'], { encoding: 'utf8' });
  const connected = (devices.stdout ?? '')
    .split('\n')
    .slice(1)
    .some((line) => line.trim().endsWith('\tdevice'));

  if (connected) {
    console.log('Android device detected. Installing Expo Go (replacing Play Store version)...');
    spawnSync(adb, ['uninstall', 'host.exp.exponent'], { stdio: 'inherit' });
    const install = spawnSync(adb, ['install', '-r', apkPath], { stdio: 'inherit' });
    if (install.status === 0) {
      console.log('Expo Go installed. Scan the QR code again from `npm run dev`.');
      return;
    }
    console.warn('adb install failed. Install the APK on your phone manually.');
  }

  console.log('\nExpo Go for SDK 56 is not on the Play Store yet.');
  console.log('On your Android phone:');
  console.log('  1. Uninstall the Play Store version of Expo Go');
  console.log(`  2. Install the APK: ${apkPath}`);
  console.log(`     Or open: ${sdkEntry.androidClientUrl}`);
  console.log('  3. Re-scan the QR code from the dev server\n');
  console.log('Tip: enable USB debugging and rerun this script to install automatically.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
