# GuGuGaGa Codex working agreement

This repository is the **legacy foundation** for GuGuGaGa Hybrid Modernization (software project management course, Pathway 1).

## Instructions before any task
1. Inspect actual source and instructor-provided Project-Guidelines before proposing architecture or compliance changes.
2. Read matching repo skills in `.agents/skills/`:
   - `gugugaga-project-governance` for WBS, schedule, sprint, GitHub evidence.
   - `gugugaga-legacy-audit-architecture` for read-only audit and ADR.
   - `gugugaga-backend-firebase` for Backend/Auth/Firestore.
   - `gugugaga-client-integration-qa` for Flutter, Admin and regression QA.
   - `gugugaga-ci-release-security` for CI, security and release.
   - `gugugaga-academic-evidence` for course artifacts and sign-off.
3. Team: Huy (PM), Tiến (Tech Lead/DevOps), Minh (Backend), Bảo (Frontend + QA).
4. Work in reviewable increments tied to WBS -> GitHub Issue -> PR -> test -> evidence.
5. Do not backdate commits or fabricate activity, sign-off, UAT results, CI passes or deployed URLs.
6. Initial audit is read-only. No migration, auth replacement, production change, credentials handling, branch/ruleset modification or deployment without explicit authorization.
7. Preserve working legacy behavior; document compatibility and rollback plans before architecture changes.
8. Use proposed/pending/verified statuses precisely. Do not assume a planning schedule is actual history.

Repo-local skills are team instructions. They do **not** install package dependencies, configure GitHub permissions, or connect external accounts.

## Scope drift warning
Existing GitHub issues #19–#24 currently describe a **standalone User Management System**, which may conflict with the earlier whole-platform GuGuGaGa Hybrid Modernization plan. Before creating WBS, architecture work or new issues, compare the latest instructor-approved scope, these issue descriptions, and inherited repository modules. Ask PM to resolve any mismatch; do not silently expand the independent system to all GuGuGaGa apps.
