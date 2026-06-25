# CI-Backed Read-Model Evidence Run Review

Status: ci-backed-read-model-evidence-run-review / ci-evidence-pass-reviewed / non-enforcing-manual-run

## Review Purpose

This document records the reviewed GitHub Actions run for Todo Search read-model Evidence:

```text
PBE Read-Model Evidence
```

The purpose is to verify that a real CI-backed Evidence run exists, that its uploaded artifact bundle is reviewable, and
that its CI manifest preserves source-authority and non-promotion boundaries.

This review supersedes the earlier blocked attempt that could not dispatch the workflow because local GitHub CLI was not
authenticated. A user-authenticated manual workflow run is now available and reviewed.

## Boundary

This review is non-enforcing CI Evidence review only.

It does not:

- add branch protection
- create or require a PR check
- add PR or push triggers
- introduce CI enforcement
- change source authority
- expand the pilot scope beyond `examples/adoption/todo-search-slice`
- approve full Graph-source promotion
- perform public-doc cleanup
- retire tree-native artifacts
- hide retained warnings
- treat CI pass as user approval

## Reviewed Workflow Run

| Field            | Observed value                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Workflow file    | `.github/workflows/read-model-evidence.yml`                                                                             |
| Workflow name    | `PBE Read-Model Evidence`                                                                                               |
| Run ID           | `28151296796`                                                                                                           |
| Run URL          | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28151296796`                              |
| Target branch    | `main`                                                                                                                  |
| Event            | `workflow_dispatch`                                                                                                     |
| Status           | `completed`                                                                                                             |
| Conclusion       | `success`                                                                                                               |
| Source commit    | `f7ab62d06ba33056a33cb433134353b9ed8a5cd4`                                                                              |
| Artifact name    | `pbe-todo-search-read-model-evidence`                                                                                   |
| Job name         | `Todo Search Read-Model Evidence`                                                                                       |
| Job URL          | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28151296796/job/83369398505`              |
| Download path    | `.tmp/read-model-evidence-run-28151296796`                                                                              |
| Review command   | `gh run view 28151296796 --json databaseId,status,conclusion,event,headBranch,headSha,url`                              |
| Download command | `gh run download 28151296796 --name pbe-todo-search-read-model-evidence --dir .tmp/read-model-evidence-run-28151296796` |

The downloaded artifact stays under `.tmp/` and is not committed.

## Job / Step Review Result

Reviewed command:

```bash
gh run view 28151296796 --json jobs
```

Observed job:

| Field      | Observed value                    |
| ---------- | --------------------------------- |
| Job        | `Todo Search Read-Model Evidence` |
| Status     | `completed`                       |
| Conclusion | `success`                         |
| Started    | `2026-06-25T06:26:57Z`            |
| Completed  | `2026-06-25T06:27:21Z`            |

The following workflow steps completed successfully:

- Checkout
- Setup Node.js
- Install dependencies
- Build CLI
- Generate read-model Evidence
- Compare generated and manual read-model Evidence
- Validate read-model Evidence
- Focused read-model Evidence tests
- Todo Search runtime fixture tests
- Validate PBE plugin files
- Validate PBE tree schemas
- Write CI evidence manifest
- Write evidence summary
- Upload read-model Evidence artifacts

## Artifact Review Result

The uploaded artifact bundle was downloaded and inspected.

Expected and observed files:

| Artifact file                               | Review status |
| ------------------------------------------- | ------------- |
| `generated-read-model.json`                 | present       |
| `generated-read-model.md`                   | present       |
| `read-model-evidence-manifest.json`         | present       |
| `read-model-parity-report.json`             | present       |
| `read-model-parity-report.md`               | present       |
| `read-model-validation-report.json`         | present       |
| `read-model-validation-report.md`           | present       |
| `read-model-ci-evidence-manifest.json`      | present       |
| `scoped-source-authority-pilot-marker.json` | present       |

Artifact review status:

```text
ci-backed artifact bundle reviewed
```

## CI Manifest Review Result

Reviewed file:

```text
.tmp/read-model-evidence-run-28151296796/read-model-ci-evidence-manifest.json
```

| Manifest field                  | Observed value / condition                 | Review status |
| ------------------------------- | ------------------------------------------ | ------------- |
| `evidenceLevel`                 | `ci-backed`                                | pass          |
| `status`                        | `ci-evidence-pass`                         | pass          |
| `workflowName`                  | `PBE Read-Model Evidence`                  | pass          |
| `triggerMode`                   | `workflow_dispatch`                        | pass          |
| `runId`                         | `28151296796`                              | pass          |
| `runAttempt`                    | `1`                                        | pass          |
| `sourceCommit`                  | `f7ab62d06ba33056a33cb433134353b9ed8a5cd4` | pass          |
| `sourceRef`                     | `refs/heads/main`                          | pass          |
| `sourceSlice`                   | `examples/adoption/todo-search-slice`      | pass          |
| `validatorStatus`               | `validation-pass`                          | pass          |
| `parityStatus`                  | `comparison-pass`                          | pass          |
| `retainedWarningsRemainVisible` | `true`                                     | pass          |
| `sourceAuthorityBoundary`       | present                                    | pass          |
| `nonPromotionStatement`         | present                                    | pass          |

CI manifest summary:

```json
{
  "evidenceLevel": "ci-backed",
  "status": "ci-evidence-pass",
  "sourceSlice": "examples/adoption/todo-search-slice",
  "validatorStatus": "validation-pass",
  "parityStatus": "comparison-pass",
  "retainedWarningsRemainVisible": true
}
```

## Validation Report Review Result

Reviewed file:

```text
.tmp/read-model-evidence-run-28151296796/read-model-validation-report.json
```

| Validation field                | Observed value            | Review status |
| ------------------------------- | ------------------------- | ------------- |
| `status`                        | `validation-pass`         | pass          |
| `evidenceLevel`                 | `validator-backed`        | pass          |
| `scopeLevel`                    | `scoped-slice-validation` | pass          |
| `summary.checkCount`            | 20                        | pass          |
| `summary.passCount`             | 20                        | pass          |
| `summary.warningCount`          | 0                         | pass          |
| `summary.blockingCount`         | 0                         | pass          |
| `summary.decisionRequiredCount` | 0                         | pass          |

## Parity Report Review Result

Reviewed file:

```text
.tmp/read-model-evidence-run-28151296796/read-model-parity-report.json
```

| Parity field                    | Observed value    | Review status |
| ------------------------------- | ----------------- | ------------- |
| `summary.status`                | `comparison-pass` | pass          |
| `summary.mismatchCount`         | 0                 | pass          |
| `summary.blockingCount`         | 0                 | pass          |
| `summary.decisionRequiredCount` | 0                 | pass          |

## Retained Warnings

The retained warnings remain active and visible:

- bounded fixture Evidence is not full Todo app implementation
- partial UI screenshot/manual visual Evidence remains partial
- ACEP task-card public-doc cleanup remains deferred
- PR/push triggers and CI enforcement remain unapproved
- CI pass is Evidence only and does not approve source authority change or user acceptance

## Source Authority Boundary

Tree-native selected-slice artifacts remain current operational source.

The reviewed CI-backed Evidence confirms a non-enforcing manual workflow run for the Todo Search selected slice. It does
not change source authority, approve full Graph-source promotion, retire tree-native artifacts, replace user acceptance,
add branch protection, add PR/push triggers, or make the workflow a required check.

## Next Decision Surface

The next step should be one of:

1. `Keep workflow manual/non-enforcing and observe`
2. `Design PR informational trigger`
3. `Design CI enforcement / required check policy`
4. `Prepare multi-slice validation design`
5. `Require public-doc cleanup before broader promotion`
6. `Prepare broader Graph-source promotion review`
7. `Rollback / defer scoped source-authority pilot`

Recommended next step:

```text
Keep workflow manual/non-enforcing and observe, unless the user wants the next major branch: PR informational trigger, enforcement policy, multi-slice validation, cleanup, broader promotion review, or rollback/defer.
```

Follow-up status: multi-slice validation design is now recorded, and the first implementation step extracted an explicit
Todo Search `SliceReadModelConfig` profile without intended behavior change. This does not alter the reviewed CI-backed
run result and does not add PR triggers, enforcement, or a second slice.

## Gate Self-Check

| Gate                             | Status | Result                                                                                         |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Manual Workflow Run Gate         | pass   | Run `28151296796` completed successfully on `workflow_dispatch`.                               |
| CI-Backed Artifact Review Gate   | pass   | Artifact bundle `pbe-todo-search-read-model-evidence` was downloaded and inspected.            |
| CI Manifest Integrity Gate       | pass   | CI manifest is `ci-backed` / `ci-evidence-pass` and includes run/source/scope/boundary fields. |
| Validation Report Gate           | pass   | Validation report is `validation-pass`, 20 checks, 0 warning/blocking/decision-required.       |
| Parity Report Gate               | pass   | Parity report is `comparison-pass`, 0 mismatch/blocking/decision-required.                     |
| Non-Enforcing CI Gate            | pass   | Workflow remains manual and informational only.                                                |
| Non-Required-Check Gate          | pass   | No required check or branch protection was added.                                              |
| Source Authority Boundary Gate   | pass   | Source authority remains unchanged.                                                            |
| Non-Full-Promotion Gate          | pass   | No full Graph-source promotion is recorded.                                                    |
| Scope Containment Gate           | pass   | Scope remains Todo Search selected slice only.                                                 |
| Retained Warning Visibility Gate | pass   | Warnings remain documented.                                                                    |
| User Approval Boundary Gate      | pass   | CI pass is not treated as user approval.                                                       |
| Evidence Honesty Gate            | pass   | Only the observed CI run and downloaded artifact are recorded as reviewed Evidence.            |

## Final Statement

This review records successful non-enforcing CI-backed Evidence for the Todo Search selected slice. It does not promote
Maintainability Graph, change current source authority, expand pilot scope, introduce CI enforcement, add required
checks, retire tree-native artifacts, clean up public docs, or replace user approval.
