# Mobile Incident Response

## Severity

| Level | Examples | Response time |
|-------|----------|---------------|
| P0 | App crash on launch, auth broken, funds/data risk | Immediate |
| P1 | Major feature broken, elevated crash rate | < 1 hr |
| P2 | Minor UI bug, non-critical regression | Next business day |

## P0 playbook

1. **Assess scope** — Sentry, Play Console vitals, support tickets
2. **Halt rollout** if staged production deploy active:
   - Actions → **Rollback Release** → `halt_rollout`
3. **Block bad clients** (fastest):
   - Bump backend `minAppVersion` via runtime-hints API
4. **Rollback binary** if needed:
   - **Rollback Release** → `promote_previous` with last good tag
5. **Communicate** — status to team + users if widespread
6. **Post-mortem** within 48 hr

## P1 playbook

1. Confirm affected `versionCode` on Play track
2. Decide: hotfix release vs OTA (JS-only, if `expo-updates` enabled)
3. Monitor crash-free rate for 2 hr after fix

## Contacts

| Role | Owner |
|------|-------|
| Release owner | Tech lead |
| Rollback execution | Release owner |
| Backend `minAppVersion` | Backend maintainer |
| Play Console | Mobile maintainer |

## Evidence to collect

- `release-manifest.json` for affected release
- Sentry issue links
- Play Console ANR/crash clusters
- GitHub Actions run URL
