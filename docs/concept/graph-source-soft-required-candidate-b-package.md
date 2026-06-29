# Graph-Source Soft-Required Candidate B Package

Status: repo-side check surface present / branch protection not configured / user acceptance not replaced

## Purpose

This package records the Graph-source required-check Candidate B surface.

Candidate B now has a named repository-side command and CI job, but GitHub branch protection is not configured by this
package. It does not change GitHub settings, expand source authority, approve Product acceptance, replace user
acceptance, or retire tree-native artifacts.

## Candidate B Definition

Candidate B is the smallest recommended soft-required Graph-source check package:

```text
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

The repository-side named command is:

```text
npm.cmd run check:graph-source:candidate-b
```

The CI check surface is:

```text
PBE CI / Candidate B Read-Model Check
```

The package intentionally excludes broader Candidate C scope such as `graph read-model validate --all --json`,
`graph read-model report-intent --json`, invalid fixture CI enrollment, source-authority expansion, and tree-native
artifact retirement.

## Current Status

Candidate B is promoted to a repository-side named check surface:

- `package.json` script: `check:graph-source:candidate-b`
- GitHub Actions job: `PBE CI / Candidate B Read-Model Check`

This promotion is intentionally limited to the repository surface. It is not a GitHub branch protection setting and it
does not make Candidate B required before merge unless the repository owner configures branch protection separately.

It is not:

- a branch protection rule;
- a GitHub settings change;
- a source-authority promotion;
- Product acceptance;
- user acceptance;
- tree-native artifact retirement.

The current machine-readable transition status remains
`examples/read-model-aggregate/graph-source-transition-status.json.enforcementReadiness.status`:

```text
candidate-b-repo-side-check-surface-present
```

## Required Approval Before Branch Protection

Candidate B must not become a branch-protection-required check until all of the following are explicitly approved:

1. User approval to make Candidate B branch-protection-blocking.
2. Waiver/failure policy for false positives, infrastructure failures, retained warnings, and temporary GitHub Actions
   failures.
3. Branch protection decision, including whether Candidate B should be required before merge.
4. Clear statement that CI pass does not replace user acceptance, Product acceptance, source-authority promotion, or
   tree-native retirement approval.

If any of these are missing, Candidate B remains a repo-side check surface without branch protection.

## Failure And Waiver Policy Draft

This policy governs review of Candidate B failures. It must be explicitly accepted before branch protection uses
Candidate B as a required merge condition.

| Failure type                     | Meaning                                                                 | Default handling before branch protection                                   | If Candidate B becomes branch-protection required later                     |
| -------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Candidate B health failure       | `report-health` reports a blocking Graph-source transition condition.   | Treat as repo check failure evidence; investigate before branch protection. | Block merge unless user-approved waiver names scope, owner, and expiry.     |
| E2E smoke failure                | `test:read-model:e2e` fails or reports non-pass status.                 | Treat as repo check failure evidence; rerun locally and inspect output.     | Block merge unless failure is proven unrelated infrastructure.              |
| False positive                   | Candidate B reports failure but artifacts and reviewed behavior are OK. | Record diagnosis; do not require via branch protection until resolved.      | Waiver must include reproduction, affected check, reason, and expiry.       |
| Infrastructure failure           | Dependency, runner, file-lock, checkout, or GitHub Actions issue.       | Rerun sequentially or in a clean runner; do not treat as source failure.    | Temporary bypass may be allowed only with user approval and rerun evidence. |
| Retained warning                 | Known warning remains visible and intentionally not hidden.             | Keep visible; do not claim clean promotion from warning-containing output.  | Warning must be classified as accepted risk, deferred, or blocking.         |
| Temporary GitHub Actions failure | GitHub service or runner instability causes a transient failure.        | Record as temporary CI failure; rerun before drawing product conclusions.   | Do not merge on temporary failure unless branch protection policy allows it |
|                                  |                                                                         |                                                                             | and the user approves the waiver.                                           |

## Non-Replacement Boundaries

Candidate B passing means only that the declared health and E2E checks passed for the current configured read-model
surface.

It does not:

- accept work on behalf of the user;
- approve Product acceptance;
- approve broader Graph-source promotion;
- expand source authority;
- approve Todo App beyond `structure-only`;
- retire or delete tree-native artifacts;
- approve a public-doc cleanup waiver;
- hide retained warnings;
- enroll invalid fixtures as positive CI;
- replace review of generated Evidence artifacts.

## Suggested Branch Protection Sequence

If the user later approves Candidate B branch protection, use a separate settings step:

1. Confirm the exact Candidate B command pair.
2. Confirm the waiver/failure policy.
3. Confirm whether branch protection should require the check.
4. Review the existing `PBE CI / Candidate B Read-Model Check` job on a PR.
5. Confirm local verification still passes sequentially.
6. Configure required check or branch protection only if explicitly approved.

## Current Branch Protection Decision

Current decision after the Step 6 evaluation:

```text
Candidate B remains repo-side/manual and CI-observed. It is not promoted to branch protection in this step.
```

Observed facts:

- the named script `npm.cmd run check:graph-source:candidate-b` passes locally;
- the `PBE CI / Candidate B Read-Model Check` GitHub Actions job exists and the latest observed push run succeeded;
- a read-only GitHub API check reported `main` as not branch-protected;
- no GitHub settings were changed.

The manual branch protection candidate, if approved later, is the existing CI job:

```text
PBE CI / Candidate B Read-Model Check
```

It runs:

```text
npm run check:graph-source:candidate-b
```

Do not enable it as a required check until the repository owner explicitly accepts the waiver/failure policy and confirms
the exact required-check name in GitHub settings.

## Next User Decision

The next decision is an external repository setting decision:

```text
Should GitHub branch protection require PBE CI / Candidate B Read-Model Check before merge?
```

Until that answer is explicit, Candidate B remains a repo-side check surface without branch-protection enforcement.
