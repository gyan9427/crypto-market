# Release Checklist

## Pre-release

- [ ] Version bumped in `app.json` and `package.json` (same semver)
- [ ] `RELEASE_NOTES.md` updated
- [ ] PR validation green on release branch
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

- [ ] Tag matches version: `v1.2.0` → `app.json` `version: "1.2.0"`
- [ ] Push tag → **Release Build** workflow completes
- [ ] GitHub Release has AAB + `release-manifest.json`
- [ ] Changelog generated in `fastlane/metadata/android/en-US/changelogs/{versionCode}.txt`

## Deploy

- [ ] **Production Release** workflow with approval gate
- [ ] Start staged rollout at 1% (`rollout: 0.01`)
- [ ] `verify_deployment` passes
- [ ] API smoke: `/public/runtime-hints` returns 200

## Post-release monitoring

| Checkpoint | Action |
|------------|--------|
| T+30 min | Play crash/ANR review; Sentry new issues |
| T+2 hr | Crash-free sessions ≥ 99%; promote to 10% if OK |
| T+24 hr | Soak at 50% before 100% |

## Rollout pause triggers

- Crash-free sessions drop >1% below baseline
- Sentry P0 or Play ANR spike >2× baseline
→ Halt rollout (`rollback.yml` → `halt_rollout`)
