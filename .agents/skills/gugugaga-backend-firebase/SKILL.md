---
name: gugugaga-backend-firebase
description: Use when making or reviewing Node.js/Express Backend changes in GuGuGaGa, particularly Firebase Authentication, Firestore, JWT compatibility, API contracts, modularization, validation and authorization.
---

# Backend + Firebase modernization

## First inspect
- Read Backend/package.json, routing structure, Firebase Admin setup, token creation/verification, service-account configuration, Firestore rules and actual client request formats.
- Treat JWT and Firebase Auth coexistence as a migration risk; never remove one flow before tracing all client consumers.
- Do not log tokens, secrets or service-account contents; do not change production collections without a reviewed migration and backup/rollback plan.

## Implementation style
1. Define Issue/WBS ID, acceptance criteria, and affected client APIs.
2. Identify minimal vertical slice. For each relevant module: route -> controller -> service -> repository; add validation and tests; avoid directories with no real responsibility.
3. Validate request bodies and query params; centralize errors; avoid leaking internal stack traces; explicitly enforce auth and RBAC server-side.
4. Never trust client-supplied role. Verify token server-side using the intended provider and document roles/access.
5. Keep old API/response shapes or write a versioned adapter until Flutter and Admin are migrated.
6. For Firestore transactional order/status transitions, review idempotency, concurrent updates, document access rules and retry behavior.
7. Mock Firebase/external APIs in unit tests; run integration tests against explicit safe test resources when configured.
8. Update API specification, ADRs and risk register when behavior, contract or data model changes.

## Completion criteria
- Existing tests/commands run and results recorded (or marked NOT RUN with reason).
- Security and negative tests for unauthenticated, wrong role and malformed requests.
- Traceability to Issue, PR, code review, CI and test output.
- Never claim a test passed without executable evidence.
