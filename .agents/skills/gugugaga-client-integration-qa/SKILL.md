---
name: gugugaga-client-integration-qa
description: Use for GuGuGaGa Flutter Customer/Shipper and React Admin changes, API integration, state handling, UI acceptance testing, QA matrix and regression validation across three clients.
---

# Flutter and React integration + QA

## Pre-work
- Inventory existing Flutter pubspec.yaml files and Admin/package.json scripts; identify framework versions and existing API clients.
- Use the approved API contract and RBAC matrix, not speculative endpoints or permissions.
- Do not casually replace Provider/Zustand/router or redesign UI unless the task requires it.

## Workflow
1. Link change to WP/Issue and concrete user journey (customer, shipper or admin).
2. Map screen -> API request -> expected response -> loading/empty/error behavior -> authorization -> data persistence.
3. Prefer smallest compatible implementation; document any breaking API impact and coordinate with Minh.
4. Cover authentication refresh/error, offline/network failure, invalid inputs, order-state concurrency, and role restrictions where relevant.
5. Create test case IDs mapped to acceptance criteria; classify results PASS / FAIL / BLOCKED / NOT RUN and attach evidence.
6. Run available Flutter analyze/test, Admin lint/build and integration checks, reporting commands and outcomes exactly.
7. Bảo coordinates QA, but code authors must self-test; Tiến/Minh conduct independent peer review where appropriate.

## Regression priorities
- Customer: login, product/branch browsing, cart/checkout, order status.
- Shipper: login, assignment, accept/reject and delivery state changes, map when in scope.
- Admin: login, role permissions, product/branch/order maintenance.
- Cross-client order state consistency and no unauthorized role transitions.
- External map/payment/AI integrations are scoped by actual WBS and verified configuration.

## Deliverables
User journey map, API-client traceability, test matrix, defect list, screenshots/logs where safe, test run status and release blockers.
