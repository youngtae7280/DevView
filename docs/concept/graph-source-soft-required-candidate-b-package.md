# Graph-Source Soft-Required Candidate B Package

Status: policy package / not enabled / user approval required

## Purpose

This package prepares Graph-source required-check Candidate B as a soft-required policy candidate.

It does not enable required checks, branch protection, merge blocking, CI enforcement, GitHub settings, source-authority
expansion, Product acceptance, user acceptance, or tree-native retirement.

## Candidate B Definition

Candidate B is the smallest recommended soft-required Graph-source check package:

```text
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

The package intentionally excludes broader Candidate C scope such as `graph read-model validate --all --json`,
`graph read-model report-intent --json`, invalid fixture CI enrollment, source-authority expansion, and tree-native
artifact retirement.

## Current Status

Candidate B is prepared as a policy candidate only.

It is not:

- a required check;
- a branch protection rule;
- a merge gate;
- CI enforcement;
- a source-authority promotion;
- Product acceptance;
- user acceptance;
- tree-native artifact retirement.

The current machine-readable transition status remains
`examples/read-model-aggregate/graph-source-transition-status.json.enforcementReadiness.status`:

```text
soft-required-candidate-not-approved
```

## Required Approval Before Enabling

Candidate B must not become a required check until all of the following are explicitly approved:

1. User approval to make Candidate B blocking.
2. Waiver/failure policy for false positives, infrastructure failures, retained warnings, and temporary GitHub Actions
   failures.
3. Branch protection decision, including whether Candidate B should be required before merge.
4. Clear statement that CI pass does not replace user acceptance, Product acceptance, source-authority promotion, or
   tree-native retirement approval.

If any of these are missing, Candidate B remains non-enforcing.

## Failure And Waiver Policy Draft

This policy is a draft decision surface. It must be accepted by the user before enforcement is implemented.

| Failure type                     | Meaning                                                                 | Default handling before approval                                           | If Candidate B becomes required later                                       |
| -------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Candidate B health failure       | `report-health` reports a blocking Graph-source transition condition.   | Treat as non-enforcing blocker evidence; investigate before promotion.     | Block merge unless user-approved waiver names scope, owner, and expiry.     |
| E2E smoke failure                | `test:read-model:e2e` fails or reports non-pass status.                 | Treat as non-enforcing blocker evidence; rerun locally and inspect output. | Block merge unless failure is proven unrelated infrastructure.              |
| False positive                   | Candidate B reports failure but artifacts and reviewed behavior are OK. | Record diagnosis; keep non-enforcing until the false positive is resolved. | Waiver must include reproduction, affected check, reason, and expiry.       |
| Infrastructure failure           | Dependency, runner, file-lock, checkout, or GitHub Actions issue.       | Rerun sequentially or in a clean runner; do not treat as source failure.   | Temporary bypass may be allowed only with user approval and rerun evidence. |
| Retained warning                 | Known warning remains visible and intentionally not hidden.             | Keep visible; do not claim clean promotion from warning-containing output. | Warning must be classified as accepted risk, deferred, or blocking.         |
| Temporary GitHub Actions failure | GitHub service or runner instability causes a transient failure.        | Record as temporary CI failure; rerun before drawing product conclusions.  | Do not merge on temporary failure unless branch protection policy allows it |
|                                  |                                                                         |                                                                            | and the user approves the waiver.                                           |

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

## Suggested Enabling Sequence

If the user later approves Candidate B enforcement, use a separate implementation step:

1. Confirm the exact Candidate B command pair.
2. Confirm the waiver/failure policy.
3. Confirm whether branch protection should require the check.
4. Implement CI/check naming without broadening scope.
5. Run local verification sequentially.
6. Review a PR informational run before making it required.
7. Only then configure required check or branch protection if explicitly approved.

## Next User Decision

The next decision is not technical execution. It is approval or rejection of this policy package:

```text
Should Candidate B become a required check candidate for implementation, with the failure/waiver policy above?
```

Until that answer is explicit, Candidate B remains prepared but non-enforcing.
