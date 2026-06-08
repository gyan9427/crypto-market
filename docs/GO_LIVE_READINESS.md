# Go-Live Readiness Checklist

Complete before first **production** deploy.

## Pipeline verification

- [ ] Play Internal deployment verified (`deploy-internal.yml` push trigger on `develop`)
- [ ] Production manual trigger verified (`deploy-production.yml` via `workflow_dispatch` only)
- [ ] Production approval gate tested (`production-release` environment)
- [ ] PR validation passing on `main`

## Recovery & provenance

- [ ] Manual rollback tested in Play Console once
- [ ] Last known-good production release documented for emergency promotion
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

- [ ] **Fake production rehearsal:** `deploy-internal.yml` then `deploy-production.yml` on a controlled release window
- [ ] Deploy + rollback drill with ≥2 maintainers
- [ ] Post-drill gaps documented in `docs/CI_CD_RUNBOOK.md`
