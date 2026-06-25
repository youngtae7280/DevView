# CI-Backed Read-Model Evidence Run Review

Status: ci-backed-read-model-evidence-run-review / aggregate-ci-evidence-pass-reviewed / non-enforcing-manual-run

## Review Purpose

This document records reviewed GitHub Actions runs for read-model Evidence, with the latest review covering the
aggregate-enabled workflow:

```text
PBE Read-Model Evidence
```

The purpose is to verify that a real CI-backed Evidence run exists, that its uploaded artifact bundle is reviewable, that
the aggregate-enabled manifest is internally consistent, and that source-authority and non-promotion boundaries are
preserved.

This review supersedes the earlier blocked attempt that could not dispatch the workflow because local GitHub CLI was not
authenticated. A user-authenticated manual workflow run is now available and reviewed.

The later aggregate-enabled manual workflow run is now reviewed in this document. The older Todo Search-only run remains
as historical CI-backed Evidence for the first workflow shape.

## Boundary

This review is non-enforcing CI Evidence review only.

It does not:

- add branch protection
- create or require a PR check
- add PR or push triggers
- introduce CI enforcement
- change source authority
- expand the source-authority pilot scope beyond `examples/adoption/todo-search-slice`
- make `examples/valid/todo-app-pbe-run` parity-backed, pilot-marker-backed, or authority-bearing
- approve full Graph-source promotion
- perform public-doc cleanup
- retire tree-native artifacts
- hide retained warnings
- treat CI pass as user approval

## Reviewed Aggregate-Enabled Workflow Run

| Field          | Observed value                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Workflow file  | `.github/workflows/read-model-evidence.yml`                                                                |
| Workflow name  | `PBE Read-Model Evidence`                                                                                  |
| Run ID         | `28156403793`                                                                                              |
| Run URL        | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28156403793`                 |
| Target branch  | `main`                                                                                                     |
| Event          | `workflow_dispatch`                                                                                        |
| Status         | `completed`                                                                                                |
| Conclusion     | `success`                                                                                                  |
| Source commit  | `3673e34d2501f9e10cb79748bdaffe994d09a27a`                                                                 |
| Artifact name  | `pbe-todo-search-read-model-evidence`                                                                      |
| Job ID         | `83385952186`                                                                                              |
| Job URL        | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28156403793/job/83385952186` |
| Job conclusion | `success`                                                                                                  |
| Job duration   | about 25 seconds                                                                                           |

The run was manually dispatched on `main`. It did not run as a PR check, push trigger, scheduled job, required check, or
branch-protection gate.

## Aggregate-Enabled Step Review Result

All relevant workflow steps completed successfully:

- Build CLI
- Generate Todo Search read-model Evidence
- Compare Todo Search generated and manual read-model Evidence
- Validate Todo Search read-model Evidence
- Generate Todo App PBE Run structure-only read-model Evidence
- Validate Todo App PBE Run structure-only read-model Evidence
- Summarize aggregate read-model Evidence
- Focused read-model Evidence tests
- Todo Search runtime fixture tests
- Validate PBE plugin files
- Validate PBE tree schemas
- Write CI evidence manifest
- Write evidence summary
- Upload read-model Evidence artifacts

GitHub emitted one maintenance annotation:

```text
Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4, actions/upload-artifact@v4.
```

This annotation is a visible CI workflow maintenance warning, not a failed Evidence run. It should be tracked for CI
hygiene follow-up and does not block the reviewed aggregate Evidence result.

## Aggregate-Enabled Artifact Review Result

The uploaded artifact bundle was downloaded, inspected, and then removed from the local temp workspace.

Expected and observed files:

| Artifact file                                                                    | Review status |
| -------------------------------------------------------------------------------- | ------------- |
| `adoption/todo-search-slice/generated/generated-read-model.json`                 | present       |
| `adoption/todo-search-slice/generated/generated-read-model.md`                   | present       |
| `adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json`      | present       |
| `adoption/todo-search-slice/generated/read-model-evidence-manifest.json`         | present       |
| `adoption/todo-search-slice/generated/read-model-parity-report.json`             | present       |
| `adoption/todo-search-slice/generated/read-model-parity-report.md`               | present       |
| `adoption/todo-search-slice/generated/read-model-validation-report.json`         | present       |
| `adoption/todo-search-slice/generated/read-model-validation-report.md`           | present       |
| `adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json` | present       |
| `valid/todo-app-pbe-run/generated/generated-read-model.json`                     | present       |
| `valid/todo-app-pbe-run/generated/generated-read-model.md`                       | present       |
| `valid/todo-app-pbe-run/generated/read-model-evidence-manifest.json`             | present       |
| `valid/todo-app-pbe-run/generated/read-model-validation-report.json`             | present       |
| `valid/todo-app-pbe-run/generated/read-model-validation-report.md`               | present       |
| `read-model-aggregate/generated/read-model-aggregate-summary.json`               | present       |
| `read-model-aggregate/generated/read-model-aggregate-summary.md`                 | present       |

Artifact review status:

```text
aggregate-enabled ci-backed artifact bundle reviewed
```

## Aggregate-Enabled CI Manifest Review Result

Reviewed file:

```text
adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json
```

| Manifest field                          | Observed value / condition                   | Review status |
| --------------------------------------- | -------------------------------------------- | ------------- |
| `evidenceLevel`                         | `ci-backed`                                  | pass          |
| `status`                                | `ci-evidence-pass`                           | pass          |
| `workflowName`                          | `PBE Read-Model Evidence`                    | pass          |
| `triggerMode`                           | `workflow_dispatch`                          | pass          |
| `runId`                                 | `28156403793`                                | pass          |
| `runAttempt`                            | `1`                                          | pass          |
| `sourceCommit`                          | `3673e34d2501f9e10cb79748bdaffe994d09a27a`   | pass          |
| `sourceRef`                             | `refs/heads/main`                            | pass          |
| `includedSlices`                        | Todo Search and Todo App PBE Run             | pass          |
| `todoSearch.validatorStatus`            | `validation-pass`                            | pass          |
| `todoSearch.parityStatus`               | `comparison-pass`                            | pass          |
| `todoSearch.checkCount`                 | 20                                           | pass          |
| `todoSearch.nodeCount` / `edgeCount`    | 40 / 59                                      | pass          |
| `todoAppPbeRun.validatorStatus`         | `validation-pass`                            | pass          |
| `todoAppPbeRun.parityStatus`            | `not-required`                               | pass          |
| `todoAppPbeRun.checkCount`              | 16                                           | pass          |
| `todoAppPbeRun.nodeCount` / `edgeCount` | 22 / 38                                      | pass          |
| `aggregate.status`                      | `aggregate-pass`                             | pass          |
| `aggregate.includedSliceCount`          | 2                                            | pass          |
| `aggregate.sourceMode`                  | `existing per-slice validation reports only` | pass          |
| `retainedWarningsRemainVisible`         | `true`                                       | pass          |
| `sourceAuthorityBoundary`               | present and scoped                           | pass          |
| `nonEnforcementStatement`               | present                                      | pass          |
| `nonPromotionStatement`                 | present                                      | pass          |

## Aggregate Artifact Review Result

Reviewed file:

```text
read-model-aggregate/generated/read-model-aggregate-summary.json
```

| Aggregate field                    | Observed value / condition                                                        | Review status |
| ---------------------------------- | --------------------------------------------------------------------------------- | ------------- |
| `status`                           | `aggregate-pass`                                                                  | pass          |
| `summary.sliceCount`               | 2                                                                                 | pass          |
| `summary.warningCount`             | 0                                                                                 | pass          |
| `summary.blockingCount`            | 0                                                                                 | pass          |
| `summary.decisionRequiredCount`    | 0                                                                                 | pass          |
| `summary.retainedWarningCount`     | 6                                                                                 | pass          |
| source mode                        | existing per-slice validation reports only                                        | pass          |
| boundary                           | Evidence-only; no source expansion, CI enforcement, or promotion                  | pass          |
| Todo Search per-slice summary      | `todo-search-selected-slice`, `pilot-marker-backed`, `validation-pass`, 20 checks | pass          |
| Todo App PBE Run per-slice summary | `todo-app-pbe-run-structure-only`, `structure-only`, `validation-pass`, 16 checks | pass          |

## Historical Todo Search-Only Workflow Run

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
- Node.js 20 deprecation annotation from GitHub Actions remains a CI hygiene warning
- CI pass is Evidence only and does not approve source authority change or user acceptance

## Source Authority Boundary

Tree-native selected-slice artifacts remain current operational source.

The reviewed aggregate-enabled CI-backed Evidence confirms a non-enforcing manual workflow run over declared read-model
Evidence artifacts. Todo Search remains the only scoped source-authority pilot. Todo App PBE Run remains structure-only.
The aggregate summary is Evidence-only over existing per-slice validation reports. This review does not change source
authority, approve full Graph-source promotion, retire tree-native or `.pbe` artifacts, replace user acceptance, add
branch protection, add PR/push triggers, or make the workflow a required check.

## Next Decision Surface

The next step should be one of:

1. `Keep aggregate-enabled workflow manual/non-enforcing and observe`
2. `Plan Node.js/action version CI hygiene update`
3. `Design PR informational trigger`
4. `Design CI enforcement / required check policy`
5. `Require public-doc cleanup before broader promotion`
6. `Prepare broader Graph-source promotion review`
7. `Rollback / defer scoped source-authority pilot`

Recommended next step:

```text
Plan Node.js/action version CI hygiene update or keep workflow manual/non-enforcing and observe, unless the user wants the next major branch: PR informational trigger, enforcement policy, cleanup, broader promotion review, or rollback/defer.
```

Follow-up status: multi-slice validation design, Todo Search profile extraction, Todo App structure-only profile,
per-slice independence, aggregate summary, and aggregate-enabled CI-backed run review are now recorded. This does not add
PR triggers, enforcement, `validate --all`, source authority expansion, or full promotion.

## Gate Self-Check

| Gate                             | Status | Result                                                                                                      |
| -------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Manual Workflow Run Gate         | pass   | Run `28156403793` completed successfully on `workflow_dispatch`.                                            |
| CI-Backed Artifact Review Gate   | pass   | Expanded artifact bundle `pbe-todo-search-read-model-evidence` was downloaded and inspected.                |
| CI Manifest Integrity Gate       | pass   | Manifest is `ci-backed` / `ci-evidence-pass` and includes Todo Search, Todo App, aggregate, and boundaries. |
| Validation Report Gate           | pass   | Todo Search and Todo App validation reports are `validation-pass` with 20 and 16 checks.                    |
| Parity Report Gate               | pass   | Todo Search parity is `comparison-pass`; Todo App parity remains `not-required`.                            |
| Aggregate Report Gate            | pass   | Aggregate summary is `aggregate-pass`, 2 slices, 0 warning/blocking/decision-required.                      |
| Non-Enforcing CI Gate            | pass   | Workflow remains manual and informational only.                                                             |
| Non-Required-Check Gate          | pass   | No required check or branch protection was added.                                                           |
| Source Authority Boundary Gate   | pass   | Source authority remains unchanged; Todo App remains structure-only.                                        |
| Non-Full-Promotion Gate          | pass   | No full Graph-source promotion is recorded.                                                                 |
| Scope Containment Gate           | pass   | Source-authority pilot remains bounded to Todo Search only.                                                 |
| Retained Warning Visibility Gate | pass   | Warnings remain documented, including Node.js 20 CI hygiene warning.                                        |
| User Approval Boundary Gate      | pass   | CI pass is not treated as user approval.                                                                    |
| Evidence Honesty Gate            | pass   | Only the observed CI run and downloaded artifact are recorded as reviewed Evidence.                         |

## Final Statement

This review records successful non-enforcing aggregate-enabled CI-backed Evidence for the declared read-model Evidence
bundle. It does not promote Maintainability Graph, change current source authority, expand source-authority pilot scope,
introduce CI enforcement, add required checks, retire tree-native artifacts, clean up public docs, or replace user
approval.
