# Graph-Source Required-Check Readiness

Status: policy package / repo-side Candidate B check surface present / branch protection not configured

## Purpose

This package defines when Graph-source health, E2E smoke, validate-all, and edgeIntent reporting could become required
checks. Candidate B now has a named repository-side script and CI job, but this package does not configure GitHub branch
protection, source-authority expansion, user acceptance, or tree-native retirement.

## Current State

Current observations are strong enough for a readiness discussion:

- local/manual observations: pass
- PR informational observations: pass
- tiny behavior-change dogfood: pass
- `graph read-model report-health --json`: `graph-source-health-pass`
- `npm run test:read-model:e2e`: `e2e-smoke-pass`
- Candidate B repo-side command: `npm run check:graph-source:candidate-b`
- Candidate B CI surface: `PBE CI / Candidate B Read-Model Check`
- `graph read-model report-intent --json`: `intent-report-pass`
- `graph read-model validate --all --json`: `aggregate-pass`
- branch protection status: `not-configured`
- tree-native retirement: not executed

The machine-readable status lives in
`examples/read-model-aggregate/graph-source-transition-status.json.enforcementReadiness`.

## Candidate Options

| Candidate                         | Scope                                                   | Current status                 | Effect today                                                       |
| --------------------------------- | ------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| A. Informational only             | Manual/local/PR informational observation               | Active                         | No required check, no branch protection, no merge gate             |
| B. Health + E2E check surface     | `report-health` plus `test:read-model:e2e`              | Repo-side check surface exists | Named script and CI job exist; branch protection still manual      |
| C. Full read-model gate candidate | `validate --all`, `report-health`, E2E, `report-intent` | Future candidate, not enabled  | No required check yet; broader blocking semantics need more review |

## Recommended Path

Recommended sequence:

1. Stay non-enforcing while recording readiness.
2. Keep Candidate B as the first named repo-side check surface.
3. Require explicit user approval before branch protection requires Candidate B.
4. Define waiver/failure policy before Candidate B can block merge through branch protection.
5. Keep enforcement readiness separate from tree-native retirement.

Candidate C should wait until Candidate B is reviewed or the user explicitly accepts broader read-model blocking
semantics.

## Candidate B Soft-Required Package

Candidate B is recorded in
[graph-source-soft-required-candidate-b-package.md](graph-source-soft-required-candidate-b-package.md).

Candidate B is the narrow command pair:

```text
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

The named repository command is:

```text
npm.cmd run check:graph-source:candidate-b
```

The CI surface is:

```text
PBE CI / Candidate B Read-Model Check
```

The package separates false positive handling, infrastructure failure handling, retained warning handling, and temporary
GitHub Actions failure handling. It is still not configured as a branch protection rule, GitHub required-check setting,
source-authority promotion, Product acceptance, user acceptance, or tree-native retirement approval.

## Required Approval Before Implementation

The following actions require explicit user approval and a separate settings or implementation step:

- configuring branch protection to require Candidate B;
- turning Candidate B into a merge gate;
- enabling branch protection;
- treating health, E2E, validate-all, or intent report as user acceptance;
- retiring tree-native artifacts.

## Readiness Gaps

Current blockers:

- no explicit user approval for branch protection;
- waiver/failure policy exists as Candidate B documentation but is not a branch-protection policy;
- GitHub branch protection is not configured from this repository change;
- tree-native retirement remains not approved and must not be bundled into enforcement readiness;
- Candidate B has not yet been reviewed as a branch-protection-required PR check.

## Step 6 Branch Protection Evaluation

Step 6 of the approved external-dogfooding/readiness sequence re-evaluated Candidate B after:

- fresh external init validation passed without the visual placeholder blocker;
- external initialized project smoke coverage was hardened;
- the first graph-native execution contract report surface was added;
- the source-authority pilot retry kept Todo App `structure-only`;
- third external dogfooding passed `profile recommend -> init -> status -> validate` on `mdn/todo-vue`.

Local and repository observations are positive:

- `npm.cmd run check:graph-source:candidate-b`: pass locally;
- latest observed `PBE CI` push run: success;
- latest observed `PBE CI / Candidate B Read-Model Check` job: success;
- `graph read-model report-health --json`: `graph-source-health-pass`;
- `test:read-model:e2e`: `e2e-smoke-pass`.

Read-only GitHub branch protection check:

```text
gh api repos/youngtae7280/Project-Blueprint-Engine-Plugin/branches/main/protection
```

returned:

```text
Branch not protected
```

Decision:

```text
Keep Candidate B as a repo-side/manual and CI-observed check for now. Do not configure branch protection in this step.
```

Reason:

- branch protection is not currently configured;
- Candidate B has a stable named script and CI job, but it is not yet accepted as a blocking merge policy;
- Step 4 kept Todo App blocked beyond `structure-only`;
- Step 5 proved external init/status/validate, but did not complete a real external feature implementation and review
  loop;
- source-authority expansion, tree-native retirement, and user acceptance remain separate decisions.

If the repository owner later chooses to promote Candidate B, the manual GitHub settings action is to require the
existing GitHub Actions job:

```text
PBE CI / Candidate B Read-Model Check
```

which runs:

```text
npm run check:graph-source:candidate-b
```

Before enabling that branch protection rule, confirm the exact required-check name in the GitHub branch protection UI
and explicitly accept the failure/waiver policy.

## Boundary

This package is a decision surface plus a named repo-side check surface. It changes package script/CI naming,
documentation, and readiness metadata only; it does not configure branch protection or change source authority.
