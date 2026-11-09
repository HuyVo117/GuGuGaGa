---
name: gugugaga-ci-release-security
description: Use for GuGuGaGa GitHub Actions, pull-request quality gates, secret safety, build verification, HTTPS staging/deployment, Flutter APK packaging and rollback planning.
---

# CI, quality gates and release

## Security defaults
- Never print or commit secrets. Use env.example containing names only; use GitHub encrypted secrets and least privilege.
- No deployment to production, key rotation, DNS change, database migration, credential provisioning or branch-protection changes without explicit approval.
- Check current workflows and dependency scripts before writing new CI; use minimum required GitHub Actions permissions and pin trusted actions appropriately.

## CI tracks
1. Backend: dependency install, actual lint/format scripts if present, tests, syntax/build validation.
2. Admin React/Vite: install, lint, production build, smoke checks.
3. Flutter customer: flutter analyze, flutter test, build APK if platform SDK and secrets support it.
4. Flutter shipper: same as customer, with its own directory and build requirements.
5. Python AI: dependency inspection, syntax/unit tests and health checks if server dependencies are available.
6. Do not claim a missing test suite is passing; report NOT CONFIGURED and propose additions.

## Release workflow
- Review PR -> one independent approval -> passing checks -> merge by repo policy.
- Prepare staging, safe test data, smoke checklist, tagged release candidate and changelog.
- Verify HTTPS endpoint or installable APK before marking instructor Authenticity Gate satisfied.
- UAT by lecturer requires recorded scenario results and authentic sign-off; unsigned or unapproved remains Pending.
- Document rollback commands and recovery owners with actual deployed resources (no fabricated URLs).

## Report
For each stage show commands/config, result, link to actual CI run, artifact location, blockers, security findings, residual risk and rollback decision.
