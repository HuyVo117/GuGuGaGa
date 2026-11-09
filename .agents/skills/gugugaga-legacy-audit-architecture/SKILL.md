---
name: gugugaga-legacy-audit-architecture
description: Use for inspecting GuGuGaGa legacy code, mapping modules and data flows, identifying technical debt, comparing architecture options, writing ADRs and proposing incremental Hybrid Modernization.
---

# Legacy audit and architecture decisions

## Guardrails
- Inspect before modifying; Gate 0/1 is strictly read-only.
- No bulk rewrites, deletion, database migration, credential reads, production changes, or deployments during audit.
- Distinguish verified working behavior (executed and tested) from source-code presence and README claims.
- The target architecture is provisional until checked against instructor technical requirements.

## Audit checklist
1. Identify actual package managers, languages and entry points for Backend, Admin, Flutter customer, Flutter shipper, Python AI service.
2. Inventory routes/controllers/services, Firebase Auth/JWT handling, Firestore collections and access patterns, permissions, API clients, secret handling, CI tests and deployment configuration.
3. Classify features: WORKING / PARTIAL / BROKEN / NOT IMPLEMENTED / UNKNOWN; record path, line, command/test and result.
4. Document external dependencies and risks: Cloudinary, map/geocoding, Gemini, payment, AI inference. Verify integrations before describing them as functional.
5. Create Legacy -> Target matrix with RETAIN / REFACTOR / REPLACE / REMOVE / PENDING, rationale and reversible migration sequence.
6. Identify contract tests before touching interfaces or auth. Preserve existing APIs until client migration is validated.

## Architecture decision
- Prefer modular monolith Node.js/Express, existing Flutter clients and React admin, Firestore and a separately callable Python AI service **only when supported by audit and teacher requirements**.
- Do not add PostgreSQL, Kafka, Kubernetes, microservices or other infrastructure without evidence of need and impact assessment.
- ADR fields: Status (Proposed/Accepted/Superseded), Context, Constraints, Options, Decision, Rationale, Consequences, Security, Compatibility, Migration, Rollback, Validation, Approval.
- Architecture gates require Huy/team approval before implementation.

## Expected files
- docs/architecture/LEGACY_SYSTEM_AUDIT.md
- docs/architecture/REQUIREMENT_GAP_ANALYSIS.md
- docs/architecture/LEGACY_TO_TARGET_MAPPING.md
- docs/architecture/ADR/ADR-001-hybrid-modernization.md

Create only when requested, preserving existing versions and not inventing implementation evidence.
