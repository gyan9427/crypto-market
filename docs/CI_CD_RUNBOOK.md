# CI/CD Runbook

## Architecture

- **GitHub Actions** — orchestration
- **EAS Build** — Android AAB build only
- **Fastlane** — Play Store upload only

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `pr-validation.yml` | PR → `develop`/`main` | Lint, test, lockfile, expo-doctor |
| `deploy-internal.yml` | Push to `develop` | EAS staging build → Play Internal |
| `deploy-production.yml` | Manual (`workflow_dispatch`) | EAS production build → Play Production |
| `dependency-audit.yml` | Weekly Monday | `npm audit` |

## Deployment success criteria (mandatory)

A deployment is successful only when all checks below are true:

1. The executed workflow is **Deploy Internal** or **Deploy Production**.
2. Workflow logs contain `UPLOAD_COMPLETED`.
3. Play Console shows a new release number on the target track.

If any check is missing, treat the run as **not deployed** even if GitHub Actions shows green.

## Common operations

### Internal deploy (automatic)

1. Ensure `EXPO_TOKEN` and `PLAY_STORE_SERVICE_ACCOUNT_JSON` in `internal-deploy` environment
2. Push commit to `develop`
3. Actions → verify **Deploy Internal** runs and logs show `UPLOAD_COMPLETED`
4. Confirm new release number is visible in Play Internal testing track

### Production release

1. Validate internal deployment on target commit
2. Actions → run **Deploy Production** manually
3. Verify logs show `UPLOAD_COMPLETED`
4. Confirm new release number is visible in Play Production
5. Monitor Play Console vitals and Sentry for at least 30 minutes

## EAS outage fallback (emergency only)

| Issue | Action |
|-------|--------|
| EAS Build outage | Check [status.expo.dev](https://status.expo.dev); wait 30 min |
| Auth failure | Rotate `EXPO_TOKEN`; re-run job |
| Queue >60 min | Do not start duplicate builds |
| Download failure | Re-run workflow; it rebuilds and downloads by exact build ID |

### Local emergency build

```bash
export EXPO_TOKEN=<token>
npx eas-cli build -p android --profile production --local
```

Then manual Play upload or `bundle exec fastlane android deploy_internal aab_path:<path>`.

## Manual rollback SOP (no rollback automation)

1. Play Console → App releases → Production.
2. Pause or stop rollout for the affected release.
3. Promote last known-good release in Play Console, or upload last known-good AAB manually.
4. If incident is severe, activate release freeze and require incident lead approval before any new deploy.
5. Document timeline, decision, and final state in post-mortem.

## Validation matrix

### Internal validation

- Push to `develop` triggers `deploy-internal.yml`.
- Workflow uploads `artifacts/app-internal.aab` to Play Internal.
- Internal testers receive the build.
- Concurrent pushes cancel older internal deploy runs.

### Production validation

- Only manual `workflow_dispatch` can run production deploy.
- Workflow uploads `artifacts/app-production.aab` to Play Production.
- No internal/beta track path exists in production workflow.
- No deployment-time version comparison gates against `app.json`.

## Explicit non-goals (stability phase)

- Rollback automation
- Staged rollout automation
- Beta deployment pipeline
- Release manifest orchestration
- Metadata/images/screenshots uploads
- Changelog automation in deployment path
- Auto production deploy
- Artifact promotion chains
- Multi-track dynamic deployment logic

## Secrets

See `docs/GITHUB_SECRETS_SETUP.md` and `docs/CREDENTIAL_ROTATION_SOP.md`.

## Go-live checklist

See `docs/GO_LIVE_READINESS.md` before first production rollout.
