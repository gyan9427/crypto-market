# Sentry Setup (Phase 2+)

Optional crash monitoring integration.

## Install

```bash
npx expo install @sentry/react-native
npx @sentry/wizard@latest -i reactNative
```

## CI integration

1. Add `SENTRY_AUTH_TOKEN` to GitHub secrets
2. Add EAS secret for source map upload
3. Tag releases: `com.nayft.app@{version}+{versionCode}`

## Release health targets

| Track | Crash-free sessions |
|-------|---------------------|
| Internal | ≥ 98% |
| Production promotion | ≥ 99% |

## Workflow hook (add to `deploy-production.yml` when ready)

```yaml
- name: Sentry release
  if: env.SENTRY_AUTH_TOKEN != ''
  run: |
    npx sentry-cli releases new "com.nayft.app@${VERSION}+${VERSION_CODE}"
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```
