# Graph-Source Required-Check Readiness

Status: policy package / readiness only / not enabled

## Purpose

This package defines when Graph-source health, E2E smoke, validate-all, and edgeIntent reporting could become required
checks. It does not enable required checks, branch protection, merge blocking, CI enforcement, user acceptance, or
tree-native retirement.

## Current State

Current observations are strong enough for a readiness discussion:

- local/manual observations: pass
- PR informational observations: pass
- tiny behavior-change dogfood: pass
- `graph read-model report-health --json`: `graph-source-health-pass`
- `npm run test:read-model:e2e`: `e2e-smoke-pass`
- `graph read-model report-intent --json`: `intent-report-pass`
- `graph read-model validate --all --json`: `aggregate-pass`
- enforcement status: `non-enforcing`
- tree-native retirement: not executed

The machine-readable status lives in
`examples/read-model-aggregate/graph-source-transition-status.json.enforcementReadiness`.

## Candidate Options

| Candidate                               | Scope                                                   | Current status                | Effect today                                                       |
| --------------------------------------- | ------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| A. Informational only                   | Manual/local/PR informational observation               | Active                        | No required check, no branch protection, no merge gate             |
| B. Health + E2E soft-required candidate | `report-health` plus `test:read-model:e2e`              | Candidate, not enabled        | No required check yet; first candidate for explicit approval       |
| C. Full read-model gate candidate       | `validate --all`, `report-health`, E2E, `report-intent` | Future candidate, not enabled | No required check yet; broader blocking semantics need more review |

## Recommended Path

Recommended sequence:

1. Stay non-enforcing while recording readiness.
2. Prepare Candidate B as a soft-required candidate only.
3. Require explicit user approval before any branch protection or required check is implemented.
4. Define waiver/failure policy before a check can block merge.
5. Keep enforcement readiness separate from tree-native retirement.

Candidate C should wait until Candidate B is reviewed or the user explicitly accepts broader read-model blocking
semantics.

## Candidate B Soft-Required Package

Candidate B is prepared as a policy candidate in
[graph-source-soft-required-candidate-b-package.md](graph-source-soft-required-candidate-b-package.md).

Candidate B is the narrow command pair:

```text
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

The package separates false positive handling, infrastructure failure handling, retained warning handling, and temporary
GitHub Actions failure handling. It is still not approved as a required check, branch protection rule, merge gate, or CI
enforcement mode.

## Required Approval Before Implementation

The following actions require explicit user approval and a separate implementation step:

- adding required checks;
- turning PR informational observation into a merge gate;
- enabling branch protection;
- treating health, E2E, validate-all, or intent report as user acceptance;
- retiring tree-native artifacts.

## Readiness Gaps

Current blockers:

- no explicit user approval for required checks;
- waiver/failure policy exists only as an unapproved Candidate B package and is not active;
- tree-native retirement remains not approved and must not be bundled into enforcement readiness;
- Candidate B has not been run as a named soft-required package with review signoff.

## Boundary

This package is a decision surface. It changes documentation and readiness metadata only.
