# Fastlane

## Setup

```bash
bundle install
cp /path/to/downloaded-key.json secrets/play-store-key.json
export EXPO_TOKEN=<token-from-expo.dev/settings/access-tokens>
export PLAY_STORE_JSON_KEY_PATH=./secrets/play-store-key.json
```

## Lanes

| Lane | Description |
|------|-------------|
| `android lint` | ESLint + color checks |
| `android test` | Typecheck + Vitest |
| `android build_staging` | EAS staging AAB |
| `android build_prod` | EAS production AAB |
| `android deploy_internal` | Upload to Play Internal |
| `android deploy_production` | Staged production rollout |
| `android verify_deployment` | Play versionCode check |
| `android rollback_release` | Halt rollout / promote previous |

## Docs

See `docs/CI_CD_RUNBOOK.md`.
