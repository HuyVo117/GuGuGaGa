---
name: gugugaga-project-governance
description: Use for GuGuGaGa project planning, WBS and WBS Dictionary, 15-week schedules, sprint planning, milestones, GitHub issue mapping, risks, RACI, stakeholder reviews, and evidence governance.
---

# GuGuGaGa project governance

## Scope and source of truth
- Project: GuGuGaGa Hybrid Modernization, Pathway 1. Legacy repository is an inherited product; do not describe all existing code as newly developed.
- Team roles: Huy = PM/Scrum Master; Tiến = Technical Lead/Architect/DevOps; Minh = Backend; Bảo = Frontend and QA. These are roles; verify GitHub usernames before assigning issues.
- Read actual instructor Project-Guidelines and other provided documents before making compliance claims. If absent, label requirements **UNVERIFIED**; never silently substitute defaults.
- The 15-week plan is a planning assumption until official dates, effort, and baseline approval are verified.
- Maintain transparent distinction: Planned / Actual / Pending evidence / Approved.

## WBS workflow
1. Collect instructor requirements, project scope, old/new module inventory, and actual team capacity.
2. Build deliverable-oriented WBS respecting the 100% Rule: exclusive, complete coverage, no overlapping work packages.
3. For each WP record: WBS ID, output, in/out of scope, owner, contributors, estimate with method, dependencies (FS/SS), acceptance criteria, test/evidence, priority, milestone, GitHub issue and status.
4. Use MoSCoW on confirmed MVP; mark unconfirmed AI/payment/maps as conditional, not automatic Must-haves.
5. Derive schedule from estimated WP durations and dependencies; calculate CPM only when durations are confirmed. Do not label a dependency chain as calculated critical path without float computations.
6. Plan sprint goals, review, retrospective, burndown snapshots and risk evolution, adjusting from observed velocity rather than inventing numbers.
7. Map Requirements -> WBS -> Issue -> PR -> Tests -> Evidence and report missing links.

## GitHub workflow
- Inspect existing issues and labels before suggesting or creating new ones; known management issues include #11 Charter, #12 WBS, #13 Schedule, #14 Risk, #15 Scrum, #16 Stakeholder/Change Control, #18 Closure; #17 Backend. Verify current descriptions.
- Proposal first; only create or modify GitHub assets when the user explicitly authorizes that action. Use feature branches and reviewed PRs where possible.
- Project board columns: Backlog, Ready, In Progress, In Review, Done.
- Issue minimum: Objective, WBS ID, dependency, owner, milestone, acceptance criteria, testing, evidence, Definition of Done.
- Never backdate commits, synthesize contribution history, invent meetings, signatures, stakeholder approvals, risk incidents, or burndown data.

## Output
Provide a traceability table, planning assumptions, prioritized risk list, weekly plan, proposed GitHub changes, and decisions needed from Huy.
