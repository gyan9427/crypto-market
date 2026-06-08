# Release Checklist

## Pre-release

- [ ] Version bumped in `app.json` and `package.json` (same semver)
- [ ] `RELEASE_NOTES.md` updated
- [ ] PR validation green on release commit
- [ ] No active backend migration or infrastructure incident
- [ ] Not Friday evening (production releases)
- [ ] Release owner + backup maintainer available for 2 hr post-deploy

## Release freeze (soft)

Avoid production deploys during:
- Major crypto market volatility events
- 48–72 hr before major marketing launch
- Active Play Console or Expo outages

Internal/staging deploys OK during freeze.

## Tag & build

- [ ] Target commit deployed to Internal successfully (`deploy-internal.yml`)
- [ ] Production environment approval reviewers available
- [ ] `EXPO_TOKEN` and `PLAY_STORE_SERVICE_ACCOUNT_JSON` confirmed valid

## Deploy

- [ ] Run **Deploy Production** workflow manually (`deploy-production.yml`)
- [ ] Confirm Play Production release contains the new binary
- [ ] Confirm no deploy ran from non-manual trigger

## Post-release monitoring

| Checkpoint | Action |
|------------|--------|
| T+30 min | Play crash/ANR review; Sentry new issues |
| T+2 hr | Verify stability trend remains normal |
| T+24 hr | Confirm no latent crash spike |

## Rollout pause triggers

- Crash-free sessions drop >1% below baseline
- Sentry P0 or Play ANR spike >2× baseline
→ Pause rollout in Play Console and execute manual rollback SOP from `docs/CI_CD_RUNBOOK.md`
