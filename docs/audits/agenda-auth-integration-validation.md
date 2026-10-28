# Agenda authorization integration validation

## Purpose

Validate the Agenda event school-membership authorization change against the institutional schema foundation proposed in PR #32.

## Integration branch

- Branch: `test/agenda-auth-with-institutional-foundation`
- Foundation parent: `fix/edi-qi-local-migration-prerequisites` (PR #32)
- Authorization changes: PR #36's school ID normalization, membership-period helper, event route validation, and synthetic harness.
- This branch is a disposable validation branch. It is not a production release candidate.

## Required checks

1. Supabase local initialization must apply the institutional foundation before migration `018_institutional_intelligence_governance.sql`.
2. The EDI-QI database test step must execute, not be skipped.
3. Positive authorization: an authenticated user with an active, in-period membership for the exact school can create a school-associated event.
4. Negative authorization: absent membership, different school, future access start, expired access, malformed identifiers, and membership-query failure must fail closed.
5. Verify that events without a school identifier retain the documented existing behavior.
6. Confirm Escala regression and the application build/preview.

## Safety constraints

- No merge of PR #32, #36, or this integration PR.
- No remote Supabase schema/data changes.
- No claims of integration success until the relevant database and route-level tests have actually run.
