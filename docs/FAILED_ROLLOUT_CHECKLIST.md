# Failed Rollout Checklist

## Immediate (first 15 min)

- [ ] Halt staged rollout: **Rollback Release** → `halt_rollout` on `production`
- [ ] Check Sentry for new crash clusters tied to release tag
- [ ] Check Play Console → Android vitals → crashes/ANRs
- [ ] Confirm scope: rollout % vs 100% users

## Contain

- [ ] If critical: bump backend `minAppVersion` (blocks old + bad clients)
- [ ] If binary bad: **promote_previous** with last known-good GitHub Release tag
- [ ] Verify SHA-256 of rollback AAB against `release-manifest.json`

## Recover

- [ ] Re-run `verify_deployment` on rollback `versionCode`
- [ ] Confirm crash rate returns to baseline (T+30 min)
- [ ] Document incident in post-mortem

## Communicate

- [ ] Notify team in Slack/status channel
- [ ] User-facing comms if widespread (product owner)

## Post-incident

- [ ] Root cause identified
- [ ] Fix merged with additional test coverage if applicable
- [ ] Update `docs/RELEASE_CHECKLIST.md` if process gap found
- [ ] Schedule fake production rehearsal if rollback was manual/break-glass
