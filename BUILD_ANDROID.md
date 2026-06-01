# Building Android APK for Testing

This project is configured to generate APK files for testing using EAS Build. The `google-services.json` (Firebase) is wired for package `com.nayft.market`.

## Prerequisites

1. **Expo account** – Sign up at [expo.dev](https://expo.dev) if needed
2. **EAS CLI** – Use `npx eas-cli` (the package is `eas-cli`, not `eas`)

## Build APK

```bash
# Preview APK (for internal testing, installable on device/emulator)
npm run build:android

# Or directly:
npx eas-cli build -p android --profile preview
```

## First-time setup

1. **Log in to Expo:**
   ```bash
   npx eas-cli login
   ```

2. **Configure the project** (if prompted):
   ```bash
   npx eas-cli build:configure
   ```

3. **Run the build:**
   ```bash
   npm run build:android
   ```

## After the build

- EAS Build runs in the cloud; you’ll get a URL to download the APK when it finishes
- Install on a device: open the URL on the device and download/install the APK
- Install on an emulator: `npx eas-cli build:run -p android --latest`

## Configuration

- **app.json** – `android.package`: `com.nayft.market`, `googleServicesFile`: `./google-services.json`
- **eas.json** – `preview` profile uses `buildType: "apk"` for direct installation
