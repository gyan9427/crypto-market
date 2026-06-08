# Maintainer Onboarding

## Minimum team

- **≥2 maintainers** with deploy access (avoid single point of failure)

## Access required

| System | Permission | Notes |
|--------|------------|-------|
| GitHub `crypto-market` | Write + Actions | Environment approver for `production-release` |
| Expo (`nayft_user`) | Project member | `d3f86c59-3e74-49ce-a53a-e6963ec1226b` |
| Play Console | Internal track release (prod later) | Service account preferred over personal |
| Sentry (optional) | Project member | Crash monitoring |

## Setup steps

1. Clone repo; `npm ci`; `bundle install`
2. Copy `.env.example` → `.env` for local dev
3. Read `docs/GITHUB_SECRETS_SETUP.md`
4. Read `docs/CI_CD_RUNBOOK.md`
5. Run local validation: `npm run ci:validate`

## Release responsibility matrix

| Responsibility | Suggested owner |
|----------------|-----------------|
| Production deploy approval | Tech lead / release owner |
| Internal deploy monitoring | Mobile maintainer (weekly rotation) |
| Secret rotation | DevOps / senior maintainer |
| Rollback execution | Release owner |
| Play Console access | ≤3 restricted maintainers |
| EAS credential management | Senior maintainer only |
| Expo/RN dependency upgrades | Senior maintainer |

## First tasks for new maintainer

- [ ] Observe one Internal deploy (`deploy-internal.yml`)
- [ ] Participate in deploy + rollback drill
- [ ] Verify access to Expo builds dashboard
- [ ] Confirm listed as backup release owner

## Quarterly

- [ ] Access review: revoke departed maintainers
- [ ] Credential rotation check (`docs/CREDENTIAL_ROTATION_SOP.md`)
