# CI/CD Runbook

## Architecture

- **GitHub Actions** — orchestration
- **EAS Build** — signed AAB production (cloud)
- **Fastlane** — Play Store upload, verification, rollback

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `pr-validation.yml` | PR → `develop`/`main` | Lint, test, lockfile, expo-doctor |
| `develop-build.yml` | `workflow_dispatch` or push `develop` | EAS staging build → Play Internal |
| `release.yml` | Tag `v*.*.*` | EAS production build + GitHub Release |
| `production-release.yml` | Manual | Deploy AAB to Play (staged rollout) |
| `rollback.yml` | Manual | Halt rollout / promote previous AAB |
| `dependency-audit.yml` | Weekly Monday | `npm audit` |

## Common operations

### Internal deploy (manual)

1. Ensure `EXPO_TOKEN` and `PLAY_STORE_SERVICE_ACCOUNT_JSON` in `internal-deploy` environment
2. Actions → **Develop Build** → Run workflow
3. Verify `verify_deployment` step passes

### Production release

1. Merge release to `main`, bump `app.json` version
2. Tag: `git tag v1.0.0 && git push origin v1.0.0`
3. Wait for **Release Build** workflow
4. Actions → **Production Release** → select tag, rollout `0.01`
5. Monitor Sentry + Play Console for 30 min before increasing rollout

### Resume failed deploy (no rebuild)

1. Re-run **Production Release** with same tag
2. Or use `resume_from: deploy` input

## EAS outage fallback (emergency only)

| Issue | Action |
|-------|--------|
| EAS Build outage | Check [status.expo.dev](https://status.expo.dev); wait 30 min |
| Auth failure | Rotate `EXPO_TOKEN`; re-run job |
| Queue >60 min | Do not start duplicate builds |
| Download failure | Retry 3×; use GitHub Release AAB |

### Local emergency build

```bash
export EXPO_TOKEN=<token>
npx eas-cli build -p android --profile production --local
```

Then manual Play upload or `bundle exec fastlane android deploy_internal aab_path:<path>`.

## Secrets

See `docs/GITHUB_SECRETS_SETUP.md` and `docs/CREDENTIAL_ROTATION_SOP.md`.

## Go-live checklist

See plan §16 — complete before first production rollout.
