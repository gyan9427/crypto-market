# Go-Live Readiness Checklist

Complete before first **production** staged rollout.

## Pipeline verification

- [ ] Play Internal deployment verified (`develop-build.yml` → `deploy_internal` → `verify_deployment`)
- [ ] Version/tag validation working (`release.yml` rejects tag ≠ `app.json` version)
- [ ] Production approval gate tested (`production-release` environment)
- [ ] PR validation passing on `main`

## Recovery & provenance

- [ ] Rollback tested once on Internal track
- [ ] Release artifact recovery tested (download AAB from GitHub Release)
- [ ] `release-manifest.json` attached to test GitHub Release
- [ ] EAS credentials backed up to org vault

## Security & access

- [ ] Secrets rotation documented (`docs/CREDENTIAL_ROTATION_SOP.md`)
- [ ] ≥2 maintainers onboarded
- [ ] Release ownership matrix agreed (`docs/MAINTAINER_ONBOARDING.md`)
- [ ] Branch + environment protection active

## Observability

- [ ] Sentry receiving events (see `docs/SENTRY_SETUP.md`)
- [ ] Crash-free session baseline for Internal `versionCode`
- [ ] Failure notifications configured (Slack webhook optional)

## Operational readiness

- [ ] `docs/RELEASE_CHECKLIST.md`, `docs/INCIDENT_RESPONSE.md`, `docs/FAILED_ROLLOUT_CHECKLIST.md` published
- [ ] Release freeze policy communicated
- [ ] EAS outage fallback understood (`docs/CI_CD_RUNBOOK.md`)

## Production rehearsal (required)

- [ ] **Fake production rehearsal:** `release.yml` → `production-release.yml` against Internal/Closed track
- [ ] Deploy + rollback drill with ≥2 maintainers
- [ ] Post-drill gaps documented in `docs/CI_CD_RUNBOOK.md`
