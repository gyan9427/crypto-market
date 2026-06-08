# Failed Rollout Checklist

## Immediate (first 15 min)

- [ ] Halt staged rollout in Play Console on `production`
- [ ] Check Sentry for new crash clusters tied to release tag
- [ ] Check Play Console → Android vitals → crashes/ANRs
- [ ] Confirm scope: rollout % vs 100% users

## Contain

- [ ] If critical: bump backend `minAppVersion` (blocks old + bad clients)
- [ ] If binary bad: promote previous known-good production release in Play Console
- [ ] Verify release ID/versionCode matches known-good release record

## Recover

- [ ] Confirm rollback release is active in Play Console
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
