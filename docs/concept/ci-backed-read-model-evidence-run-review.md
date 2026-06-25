# CI-Backed Read-Model Evidence Run Review

Status: ci-backed-read-model-evidence-run-review / pr-informational-ci-evidence-pass-reviewed / non-enforcing-pr-run

## Review Purpose

This document records reviewed GitHub Actions runs for read-model Evidence, with the latest review covering the PR
informational workflow run:

```text
PBE Read-Model Evidence
```

The purpose is to verify that a real CI-backed Evidence run exists, that its uploaded artifact bundle is reviewable, that
the aggregate-enabled manifest is internally consistent, and that source-authority and non-promotion boundaries are
preserved.

This review supersedes the earlier blocked attempt that could not dispatch the workflow because local GitHub CLI was not
authenticated. User-authenticated manual workflow runs are now available and reviewed.

The aggregate-enabled manual workflow run is reviewed in this document. A later Node 24 CI hygiene run confirms that the
workflow action/runtime update still produces the same aggregate Evidence result without the prior Node.js 20
deprecation annotation. The PR informational run confirms that the non-enforcing `pull_request` trigger records PR
metadata and preserves Evidence-only boundaries. The older Todo Search-only run remains as historical CI-backed
Evidence for the first workflow shape.

## Boundary

This review is non-enforcing CI Evidence review only.

It does not:

- add branch protection
- create or require a PR check
- make the PR informational trigger required or enforcing
- add push or schedule triggers
- introduce CI enforcement
- change source authority
- expand the source-authority pilot scope beyond `examples/adoption/todo-search-slice`
- make `examples/valid/todo-app-pbe-run` parity-backed, pilot-marker-backed, or authority-bearing
- approve full Graph-source promotion
- perform public-doc cleanup
- retire tree-native artifacts
- hide retained warnings
- treat CI pass as user approval

## Reviewed PR Informational Workflow Run

| Field          | Observed value                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Workflow file  | `.github/workflows/read-model-evidence.yml`                                                                |
| Workflow name  | `PBE Read-Model Evidence`                                                                                  |
| Pull request   | `#1` / `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/pull/1`                            |
| PR status      | closed without merge; temporary remote branch deleted                                                      |
| Run ID         | `28207822252`                                                                                              |
| Run URL        | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207822252`                 |
| Event          | `pull_request`                                                                                             |
| Trigger mode   | `pull_request-informational`                                                                               |
| Head branch    | `pbe/pr-info-read-model-smoke-20260626`                                                                    |
| Head SHA       | `3f3987c46f37639b1c1b7a56639a088a859ade5e`                                                                 |
| Base branch    | `main`                                                                                                     |
| Base SHA       | `0e5ceb90ed095ffdfda2cf34f3f9ed05f9d56bd3`                                                                 |
| Source ref     | `refs/pull/1/merge`                                                                                        |
| Source commit  | `b2c664cfe658eaeb08c3bf28e8c8a22eec864fac`                                                                 |
| Status         | `completed`                                                                                                |
| Conclusion     | `success`                                                                                                  |
| Artifact name  | `pbe-todo-search-read-model-evidence`                                                                      |
| Job ID         | `83562348328`                                                                                              |
| Job URL        | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207822252/job/83562348328` |
| Job conclusion | `success`                                                                                                  |
| Job duration   | about 28 seconds                                                                                           |

The PR was a temporary draft smoke PR with a docs-only change on a path covered by the PR informational trigger. It was
closed without merge after artifact review, and the remote smoke branch was deleted.

## PR Informational Step Review Result

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

## PR Informational Artifact Review Result

The uploaded artifact bundle for run `28207822252` was downloaded, inspected, and then removed from the local temp
workspace. It contained the expected files:

- `adoption/todo-search-slice/generated/generated-read-model.json`
- `adoption/todo-search-slice/generated/generated-read-model.md`
- `adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json`
- `adoption/todo-search-slice/generated/read-model-evidence-manifest.json`
- `adoption/todo-search-slice/generated/read-model-parity-report.json`
- `adoption/todo-search-slice/generated/read-model-parity-report.md`
- `adoption/todo-search-slice/generated/read-model-validation-report.json`
- `adoption/todo-search-slice/generated/read-model-validation-report.md`
- `adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json`
- `valid/todo-app-pbe-run/generated/generated-read-model.json`
- `valid/todo-app-pbe-run/generated/generated-read-model.md`
- `valid/todo-app-pbe-run/generated/read-model-evidence-manifest.json`
- `valid/todo-app-pbe-run/generated/read-model-validation-report.json`
- `valid/todo-app-pbe-run/generated/read-model-validation-report.md`
- `read-model-aggregate/generated/read-model-aggregate-summary.json`
- `read-model-aggregate/generated/read-model-aggregate-summary.md`

## PR Informational CI Manifest Review Result

| Manifest field                     | Observed value                             | Review result |
| ---------------------------------- | ------------------------------------------ | ------------- |
| `status`                           | `ci-evidence-pass`                         | pass          |
| `evidenceLevel`                    | `ci-backed`                                | pass          |
| `eventName`                        | `pull_request`                             | pass          |
| `triggerMode`                      | `pull_request-informational`               | pass          |
| `runId`                            | `28207822252`                              | pass          |
| `runAttempt`                       | `1`                                        | pass          |
| `sourceCommit`                     | `b2c664cfe658eaeb08c3bf28e8c8a22eec864fac` | pass          |
| `sourceRef`                        | `refs/pull/1/merge`                        | pass          |
| `pr.number`                        | `1`                                        | pass          |
| `pr.headSha`                       | `3f3987c46f37639b1c1b7a56639a088a859ade5e` | pass          |
| `pr.baseSha`                       | `0e5ceb90ed095ffdfda2cf34f3f9ed05f9d56bd3` | pass          |
| `pr.headRef`                       | `pbe/pr-info-read-model-smoke-20260626`    | pass          |
| `pr.baseRef`                       | `main`                                     | pass          |
| `includedSlices`                   | Todo Search; Todo App PBE Run              | pass          |
| Todo Search validator/parity       | `validation-pass` / `comparison-pass`      | pass          |
| Todo Search node/edge/check counts | 40 nodes / 59 edges / 20 checks            | pass          |
| Todo App validator/parity          | `validation-pass` / `not-required`         | pass          |
| Todo App node/edge/check counts    | 22 nodes / 38 edges / 16 checks            | pass          |
| Aggregate status                   | `aggregate-pass`                           | pass          |
| `retainedWarningsRemainVisible`    | `true`                                     | pass          |
| Source authority boundary          | present                                    | pass          |
| Non-enforcement statement          | present                                    | pass          |
| Non-promotion statement            | present                                    | pass          |

## PR Informational Aggregate Artifact Review Result

| Aggregate field         | Observed value                  | Review result |
| ----------------------- | ------------------------------- | ------------- |
| `status`                | `aggregate-pass`                | pass          |
| `sliceCount`            | 2                               | pass          |
| `warningCount`          | 0                               | pass          |
| `blockingCount`         | 0                               | pass          |
| `decisionRequiredCount` | 0                               | pass          |
| source mode             | existing per-slice reports only | pass          |
| boundary                | Evidence-only / non-promotion   | pass          |

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

This annotation was a visible CI workflow maintenance warning, not a failed Evidence run. It did not block the reviewed
aggregate Evidence result. It was later addressed by updating the manual workflow to Node 24 action/runtime settings and
reviewing post-update run `28157938343`.

## Post-Update Node 24 CI Hygiene Run

After the workflow was updated to use `actions/checkout@v7`, `actions/setup-node@v6` with `node-version: 24`, and
`actions/upload-artifact@v7`, the manual workflow was dispatched again.

| Field          | Observed value                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Workflow file  | `.github/workflows/read-model-evidence.yml`                                                                |
| Workflow name  | `PBE Read-Model Evidence`                                                                                  |
| Run ID         | `28157938343`                                                                                              |
| Run URL        | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28157938343`                 |
| Target branch  | `main`                                                                                                     |
| Event          | `workflow_dispatch`                                                                                        |
| Status         | `completed`                                                                                                |
| Conclusion     | `success`                                                                                                  |
| Source commit  | `96da2c772ce1a662dc65d7b7b7d7b7c6ba98e19c`                                                                 |
| Artifact name  | `pbe-todo-search-read-model-evidence`                                                                      |
| Job ID         | `83390977558`                                                                                              |
| Job URL        | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28157938343/job/83390977558` |
| Job conclusion | `success`                                                                                                  |
| Job duration   | about 23 seconds                                                                                           |

The run was manually dispatched on `main`. It did not run as a PR check, push trigger, scheduled job, required check, or
branch-protection gate.

All relevant workflow steps completed successfully, including Todo Search generation/comparison/validation, Todo App
PBE Run structure-only generation/validation, aggregate summarize, focused tests, runtime fixture tests, PBE validation,
CI manifest creation, step summary creation, and artifact upload.

Log review did not observe the prior Node.js 20 deprecation annotation after the Node 24 action/runtime update. An
unrelated checkout Git hint appeared in the logs, but no Node.js 20 deprecation warning was present.

## Post-Update Artifact Review Result

The uploaded artifact bundle for run `28157938343` was downloaded, inspected, and then removed from the local temp
workspace.

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

## Post-Update CI Manifest Review Result

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
| `runId`                                 | `28157938343`                                | pass          |
| `runAttempt`                            | `1`                                          | pass          |
| `sourceCommit`                          | `96da2c772ce1a662dc65d7b7b7d7b7c6ba98e19c`   | pass          |
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

## Post-Update Aggregate Artifact Review Result

Reviewed file:

```text
read-model-aggregate/generated/read-model-aggregate-summary.json
```

| Aggregate field                 | Observed value / condition                                       | Review status |
| ------------------------------- | ---------------------------------------------------------------- | ------------- |
| `status`                        | `aggregate-pass`                                                 | pass          |
| `summary.sliceCount`            | 2                                                                | pass          |
| `summary.warningCount`          | 0                                                                | pass          |
| `summary.blockingCount`         | 0                                                                | pass          |
| `summary.decisionRequiredCount` | 0                                                                | pass          |
| `summary.retainedWarningCount`  | 6                                                                | pass          |
| source mode                     | existing per-slice validation reports only                       | pass          |
| boundary                        | Evidence-only; no source expansion, CI enforcement, or promotion | pass          |

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
- push/schedule triggers, required checks, branch protection, and CI enforcement remain unapproved
- Node.js 20 deprecation annotation is resolved for the manual workflow by the Node 24 action/runtime update and
  successful post-update run `28157938343`; future GitHub Actions runtime changes remain ordinary CI hygiene
- CI pass is Evidence only and does not approve source authority change or user acceptance

## Source Authority Boundary

Tree-native selected-slice artifacts remain current operational source.

The reviewed aggregate-enabled CI-backed Evidence confirms a non-enforcing manual workflow run over declared read-model
Evidence artifacts, and the reviewed PR informational run confirms that the non-enforcing `pull_request` trigger records
PR metadata and preserves Evidence boundaries. Todo Search remains the only scoped source-authority pilot. Todo App PBE
Run remains structure-only. The aggregate summary is Evidence-only over existing per-slice validation reports. This
review does not change source authority, approve full Graph-source promotion, retire tree-native or `.pbe` artifacts,
replace user acceptance, add branch protection, add push/schedule triggers, or make the workflow a required check.

## Next Decision Surface

The next step should be one of:

1. `Keep PR informational workflow non-enforcing and observe`
2. `Refine PR informational path filters after observing more PRs`
3. `Design CI enforcement / required check policy`
4. `Require public-doc cleanup before broader promotion`
5. `Prepare broader Graph-source promotion review`
6. `Rollback / defer scoped source-authority pilot`

Recommended next step:

```text
Keep the PR informational workflow non-enforcing and observe more PRs before deciding whether path filters need
refinement. Enforcement policy, cleanup, broader promotion review, and rollback/defer remain separate major branches.
```

Follow-up status: multi-slice validation design, Todo Search profile extraction, Todo App structure-only profile,
per-slice independence, aggregate summary, aggregate-enabled CI-backed run review, and PR informational trigger
implementation are now recorded. This does not add enforcement, `validate --all`, source authority expansion, or full
promotion; the first real PR informational run review is now recorded.

## Gate Self-Check

| Gate                             | Status | Result                                                                                                      |
| -------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Manual Workflow Run Gate         | pass   | Run `28156403793` completed successfully on `workflow_dispatch`.                                            |
| PR Informational Run Gate        | pass   | PR #1 triggered run `28207822252` on `pull_request` and completed successfully.                             |
| CI-Backed Artifact Review Gate   | pass   | Expanded artifact bundle `pbe-todo-search-read-model-evidence` was downloaded and inspected.                |
| CI Manifest Integrity Gate       | pass   | Manifest is `ci-backed` / `ci-evidence-pass` and includes Todo Search, Todo App, aggregate, and boundaries. |
| Validation Report Gate           | pass   | Todo Search and Todo App validation reports are `validation-pass` with 20 and 16 checks.                    |
| Parity Report Gate               | pass   | Todo Search parity is `comparison-pass`; Todo App parity remains `not-required`.                            |
| Aggregate Report Gate            | pass   | Aggregate summary is `aggregate-pass`, 2 slices, 0 warning/blocking/decision-required.                      |
| Non-Enforcing CI Gate            | pass   | Workflow remains informational only for manual and PR runs.                                                 |
| Non-Required-Check Gate          | pass   | No required check or branch protection was added.                                                           |
| Source Authority Boundary Gate   | pass   | Source authority remains unchanged; Todo App remains structure-only.                                        |
| Non-Full-Promotion Gate          | pass   | No full Graph-source promotion is recorded.                                                                 |
| Scope Containment Gate           | pass   | Source-authority pilot remains bounded to Todo Search only.                                                 |
| Node 24 CI Hygiene Gate          | pass   | Run `28157938343` succeeded after the workflow moved to Node 24 action/runtime settings.                    |
| Retained Warning Visibility Gate | pass   | Retained Evidence/source warnings remain documented; Node.js 20 deprecation is no longer active.            |
| User Approval Boundary Gate      | pass   | CI pass is not treated as user approval.                                                                    |
| Evidence Honesty Gate            | pass   | Only the observed CI run and downloaded artifact are recorded as reviewed Evidence.                         |

## Final Statement

This review records successful non-enforcing aggregate-enabled CI-backed Evidence for the declared read-model Evidence
bundle. It does not promote Maintainability Graph, change current source authority, expand source-authority pilot scope,
introduce CI enforcement, add required checks, retire tree-native artifacts, clean up public docs, or replace user
approval.
