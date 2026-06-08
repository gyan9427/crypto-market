# GitHub Secrets Setup

Configure these in the **crypto-market** GitHub repository before running deploy workflows.

## Required secrets

| Secret | How to create | Used by |
|--------|---------------|---------|
| `EXPO_TOKEN` | https://expo.dev/settings/access-tokens → Create token (`nayft_user`) | EAS build in deploy workflows |
| `PLAY_STORE_SERVICE_ACCOUNT_JSON` | Full contents of `secrets/play-store-key.json` (see `secrets/README.md`) | Fastlane `upload_to_play_store` |

Only these two secret names are supported in deployment workflows. Do not add aliases.

## GitHub Environments

Create environments in **Settings → Environments**:

### `internal-deploy`

Used by: `deploy-internal.yml`

- `EXPO_TOKEN`
- `PLAY_STORE_SERVICE_ACCOUNT_JSON`

### `production-release`

Used by: `deploy-production.yml`

- `EXPO_TOKEN`
- `PLAY_STORE_SERVICE_ACCOUNT_JSON`
- **Required reviewers:** ≥1
- Deployment branches: `main` only

### Local machine

Copy JSON to `secrets/play-store-key.json` and set in `.env`:

```bash
PLAY_STORE_JSON_KEY_PATH=./secrets/play-store-key.json
EXPO_TOKEN=<same token as GitHub>
```

## Play Console service account

1. Play Console → **Setup → API access** → link Google Cloud project
2. Create service account with **Release to testing tracks** (add production permission later)
3. **Invite service account email** under Users and permissions
4. Download JSON key → paste into `PLAY_STORE_SERVICE_ACCOUNT_JSON`

> GitHub org and Play Console org may differ — the service account must be explicitly invited in Play Console.

## EAS credentials backup

```bash
npx eas-cli credentials -p android
# Export keystore backup to org vault (1Password / GCP Secret Manager)
```

## Verification

```bash
# Local
export EXPO_TOKEN=<token>
npx eas-cli whoami

# Play JSON
export PLAY_STORE_JSON_KEY_PATH=/path/to/key.json
bundle exec fastlane android deploy_internal aab_path:/tmp/example.aab
```
