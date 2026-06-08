# Building Android with EAS

This project uses **Expo managed workflow** with cloud builds via EAS. Native `android/` is prebuild-generated and not committed.

## Package & versioning

- **Package:** `com.nayft.app` (`app.json` → `android.package`)
- **Firebase:** `./google-services.json` (must match package name)
- **Version source:** `app.json` (`version`, `android.versionCode`)
- **EAS profiles:** `staging` (internal AAB), `production` (store AAB with `autoIncrement`)

## Prerequisites

1. Expo account — [expo.dev](https://expo.dev)
2. EAS CLI — `npm run eas` or `npx eas-cli`
3. `EXPO_TOKEN` for CI (see `docs/GITHUB_SECRETS_SETUP.md`)

## Build commands

```bash
# Internal / staging AAB (Play Internal track via CI)
npm run build:android

# Production store AAB
npm run build:android:prod

# Direct EAS
npx eas-cli build -p android --profile staging --non-interactive
```

## First-time setup

```bash
npx eas-cli login
npx eas-cli build:configure   # if prompted
```

## After the build

- Cloud build URL appears in terminal and [expo.dev](https://expo.dev) dashboard
- CI downloads AAB and deploys to Play Internal via Fastlane
- Install on device: use EAS build URL or `npx eas-cli build:run -p android --latest`

## CI/CD

See `docs/CI_CD_RUNBOOK.md` for GitHub Actions + Fastlane deployment.
