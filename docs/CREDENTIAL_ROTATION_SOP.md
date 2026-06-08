# Credential Rotation SOP

## EXPO_TOKEN

**When:** Annually, or on maintainer departure / suspected leak

1. `npx eas-cli token:create` on dedicated machine account
2. Update GitHub secret `EXPO_TOKEN` in `internal-deploy` environment
3. Update GitHub secret `EXPO_TOKEN` in `production-release` environment
4. Revoke old token: `npx eas-cli token:revoke <id>`
5. Verify: re-run **Deploy Internal** workflow

## Play service account JSON

**When:** Annually, or on suspected leak

1. Google Cloud Console → IAM → Service account → Keys → Create new JSON
2. Update `PLAY_STORE_SERVICE_ACCOUNT_JSON` in GitHub environments
3. Delete old key in GCP
4. Verify: re-run **Deploy Internal** workflow

## EAS Secrets (`EXPO_PUBLIC_*`)

**When:** OAuth client rotation or API URL change

```bash
npx eas-cli env:create --name EXPO_PUBLIC_API_BASE_URL --value <url> --environment production
npx eas-cli env:delete --name EXPO_PUBLIC_API_BASE_URL --environment production  # old
```

## Android keystore (EAS)

**When:** Only if compromised (high friction)

1. Export backup before any change: `npx eas-cli credentials -p android`
2. Coordinate with Play App Signing support if upload key must change
3. Document in incident post-mortem

## GitHub environment secrets

| Environment | Secrets |
|-------------|---------|
| `internal-deploy` | `EXPO_TOKEN`, `PLAY_STORE_SERVICE_ACCOUNT_JSON` |
| `production-release` | `PLAY_STORE_SERVICE_ACCOUNT_JSON` (prod-scoped recommended) |

## Audit log

Record rotations in team vault with: date, rotated by, systems updated, verification run URL.
