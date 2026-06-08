# Fastlane

## Setup

```bash
bundle install
cp /path/to/downloaded-key.json secrets/play-store-key.json
export PLAY_STORE_JSON_KEY_PATH=./secrets/play-store-key.json
```

## Lanes

| Lane | Description |
|------|-------------|
| `android deploy_internal` | Upload existing AAB to Play Internal |
| `android deploy_production` | Upload existing AAB to Play Production |

## Docs

See `docs/CI_CD_RUNBOOK.md`.
