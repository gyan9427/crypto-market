# Local secrets (never commit JSON keys)

Place your Play service account file here:

```
secrets/play-store-key.json
```

Then set in `.env` (local only):

```
PLAY_STORE_JSON_KEY_PATH=./secrets/play-store-key.json
```

For CI, paste the **same JSON contents** into GitHub:

- Environment `internal-deploy` → secret `PLAY_STORE_SERVICE_ACCOUNT_JSON`
- Environment `production-release` → secret `PLAY_STORE_SERVICE_ACCOUNT_JSON`

`EXPO_TOKEN` → GitHub only (https://expo.dev/settings/access-tokens), not this folder.
