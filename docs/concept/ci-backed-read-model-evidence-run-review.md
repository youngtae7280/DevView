# CI-Backed Read-Model Evidence Run Review

Status: ci-backed-read-model-evidence-run-review / e2e-smoke-manual-ci-reviewed /
non-enforcing-manual-run

## Review Purpose

This document records reviewed GitHub Actions runs for read-model Evidence, with the latest review covering the manual
workflow run after Todo App bounded non-authority projection-contract enrollment entered positive validate-all:

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
deprecation annotation. The PR informational runs confirm that the non-enforcing `pull_request` trigger records PR
metadata and preserves Evidence-only boundaries. The latest manual and PR runs confirm that the workflow can use local
registry-backed `validate --all` while preserving the same artifact and boundary surface. PR #3 / run `28213236499`
also satisfies the observation policy's three-real-PR-run count threshold without changing path filters or enforcement.
The older Todo Search-only run remains as historical CI-backed Evidence for the first workflow shape.

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

## Reviewed Validate-All Workflow Run

Run identity:

| Field      | Value                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Workflow   | `PBE Read-Model Evidence`                                                                                  |
| Run ID     | `28210541509`                                                                                              |
| Run URL    | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210541509>                 |
| Event      | `workflow_dispatch`                                                                                        |
| Branch     | `main`                                                                                                     |
| Commit     | `972dbc1674e1e083f20dc76808a71903b6a1ea95`                                                                 |
| Job ID     | `83570692575`                                                                                              |
| Job URL    | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210541509/job/83570692575> |
| Conclusion | `success`                                                                                                  |
| Duration   | about 27 seconds                                                                                           |

The run executed the switched read-model command sequence:

```text
npm run build:cli
node dist/cli/index.js graph read-model validate --all --json
npx vitest run cli/src/__tests__/read-model-evidence.test.ts
npx vitest run examples/adoption/todo-search-slice/runtime-fixture
npm run validate:pbe
npm run validate:pbe:v2
```

All relevant steps completed successfully, including `Validate all registry-backed read-model Evidence`, focused tests,
runtime fixture tests, PBE validation, CI manifest writing, Step Summary writing, and artifact upload.

### Validate-All Artifact Review Result

Artifact:

```text
pbe-todo-search-read-model-evidence
```

Reviewed files included:

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

Downloaded review artifacts were removed from `.tmp/` after inspection.

### Validate-All CI Manifest Review Result

Reviewed file:

```text
adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json
```

| Manifest field                    | Observed value                             | Review status |
| --------------------------------- | ------------------------------------------ | ------------- |
| `status`                          | `ci-evidence-pass`                         | pass          |
| `evidenceLevel`                   | `ci-backed`                                | pass          |
| `eventName`                       | `workflow_dispatch`                        | pass          |
| `triggerMode`                     | `workflow_dispatch`                        | pass          |
| `runId`                           | `28210541509`                              | pass          |
| `runAttempt`                      | `1`                                        | pass          |
| `sourceCommit`                    | `972dbc1674e1e083f20dc76808a71903b6a1ea95` | pass          |
| `sourceRef`                       | `refs/heads/main`                          | pass          |
| `sourceMode`                      | `registry-backed validate-all`             | pass          |
| `validateAllStatus`               | `aggregate-pass`                           | pass          |
| `aggregateStatus`                 | `aggregate-pass`                           | pass          |
| `includedSlices`                  | Todo Search; Todo App PBE Run              | pass          |
| Todo Search validator/parity      | `validation-pass` / `comparison-pass`      | pass          |
| Todo Search node/edge/check count | 40 nodes / 59 edges / 20 checks            | pass          |
| Todo App validator/parity         | `validation-pass` / `not-required`         | pass          |
| Todo App node/edge/check count    | 22 nodes / 38 edges / 16 checks            | pass          |
| aggregate warning/blocking/DR     | 0 / 0 / 0                                  | pass          |
| retained warnings visible         | `true`                                     | pass          |
| source authority boundary         | present                                    | pass          |
| non-enforcement statement         | present                                    | pass          |
| non-promotion statement           | present                                    | pass          |

### Validate-All Aggregate Review Result

Reviewed file:

```text
read-model-aggregate/generated/read-model-aggregate-summary.json
```

| Aggregate field                         | Observed value                   | Review status |
| --------------------------------------- | -------------------------------- | ------------- |
| `status`                                | `aggregate-pass`                 | pass          |
| `summary.warningCount`                  | 0                                | pass          |
| `summary.blockingCount`                 | 0                                | pass          |
| `summary.decisionRequiredCount`         | 0                                | pass          |
| `summary.retainedWarningCount`          | 6                                | pass          |
| Todo Search per-slice summary           | `validation-pass`, 20 checks     | pass          |
| Todo App PBE Run per-slice summary      | `validation-pass`, 16 checks     | pass          |
| Source mode note in aggregate artifact  | existing validation reports only | pass          |
| Source mode note in CI manifest wrapper | `registry-backed validate-all`   | pass          |

## Reviewed Validate-All PR Informational Run

Run identity:

| Field             | Value                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Workflow          | `PBE Read-Model Evidence`                                                                                  |
| PR                | `#2`; draft smoke PR; closed without merge                                                                 |
| PR URL            | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/pull/2>                                   |
| Run ID            | `28210904900`                                                                                              |
| Run URL           | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210904900>                 |
| Event             | `pull_request`                                                                                             |
| Head branch       | `pbe/pr-info-validate-all-smoke-20260626`                                                                  |
| Base branch       | `main`                                                                                                     |
| Head SHA          | `dadc1fd415a57342e7e1084c561868e242b39c54`                                                                 |
| Base SHA          | `ffad659d620e034bce0a24c18c6b41298e376451`                                                                 |
| Manifest ref      | `refs/pull/2/merge`                                                                                        |
| Manifest commit   | `88affca60d9f5081c848c03e65a2801f90733968`                                                                 |
| Job ID            | `83571819410`                                                                                              |
| Job URL           | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210904900/job/83571819410> |
| Conclusion        | `success`                                                                                                  |
| Duration          | about 28 seconds                                                                                           |
| Changed path type | `docs/concept/**` smoke change                                                                             |

The run executed the validate-all-centered workflow through the `pull_request` trigger. All relevant steps completed
successfully, including `Validate all registry-backed read-model Evidence`, focused tests, runtime fixture tests, PBE
validation, CI manifest writing, Step Summary writing, and artifact upload.

### Validate-All PR Artifact Review Result

Artifact:

```text
pbe-todo-search-read-model-evidence
```

Reviewed files included:

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

Downloaded review artifacts were removed from `.tmp/` after inspection.

### Validate-All PR CI Manifest Review Result

Reviewed file:

```text
adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json
```

| Manifest field                    | Observed value                             | Review status |
| --------------------------------- | ------------------------------------------ | ------------- |
| `status`                          | `ci-evidence-pass`                         | pass          |
| `evidenceLevel`                   | `ci-backed`                                | pass          |
| `eventName`                       | `pull_request`                             | pass          |
| `triggerMode`                     | `pull_request-informational`               | pass          |
| `pullRequest.number`              | `2`                                        | pass          |
| `pullRequest.headRef`             | `pbe/pr-info-validate-all-smoke-20260626`  | pass          |
| `pullRequest.baseRef`             | `main`                                     | pass          |
| `pullRequest.headSha`             | `dadc1fd415a57342e7e1084c561868e242b39c54` | pass          |
| `pullRequest.baseSha`             | `ffad659d620e034bce0a24c18c6b41298e376451` | pass          |
| `runId`                           | `28210904900`                              | pass          |
| `runAttempt`                      | `1`                                        | pass          |
| `sourceCommit`                    | `88affca60d9f5081c848c03e65a2801f90733968` | pass          |
| `sourceRef`                       | `refs/pull/2/merge`                        | pass          |
| `sourceMode`                      | `registry-backed validate-all`             | pass          |
| `validateAllStatus`               | `aggregate-pass`                           | pass          |
| `aggregateStatus`                 | `aggregate-pass`                           | pass          |
| `includedSlices`                  | Todo Search; Todo App PBE Run              | pass          |
| Todo Search validator/parity      | `validation-pass` / `comparison-pass`      | pass          |
| Todo Search node/edge/check count | 40 nodes / 59 edges / 20 checks            | pass          |
| Todo App validator/parity         | `validation-pass` / `not-required`         | pass          |
| Todo App node/edge/check count    | 22 nodes / 38 edges / 16 checks            | pass          |
| aggregate warning/blocking/DR     | 0 / 0 / 0                                  | pass          |
| retained warnings visible         | `true`                                     | pass          |
| source authority boundary         | present                                    | pass          |
| non-enforcement statement         | present                                    | pass          |
| non-promotion statement           | present                                    | pass          |

### Validate-All PR Aggregate Review Result

Reviewed file:

```text
read-model-aggregate/generated/read-model-aggregate-summary.json
```

| Aggregate field                    | Observed value               | Review status |
| ---------------------------------- | ---------------------------- | ------------- |
| `status`                           | `aggregate-pass`             | pass          |
| `summary.sliceCount`               | 2                            | pass          |
| `summary.warningCount`             | 0                            | pass          |
| `summary.blockingCount`            | 0                            | pass          |
| `summary.decisionRequiredCount`    | 0                            | pass          |
| `summary.retainedWarningCount`     | 6                            | pass          |
| Todo Search per-slice summary      | `validation-pass`, 20 checks | pass          |
| Todo App PBE Run per-slice summary | `validation-pass`, 16 checks | pass          |

## Reviewed Third PR Informational Run

Run identity:

| Field             | Value                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Workflow          | `PBE Read-Model Evidence`                                                                                  |
| PR                | `#3`; draft smoke PR; closed without merge                                                                 |
| PR URL            | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/pull/3>                                   |
| Run ID            | `28213236499`                                                                                              |
| Run URL           | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28213236499>                 |
| Event             | `pull_request`                                                                                             |
| Head branch       | `pbe/pr-info-observation-smoke-20260626-3`                                                                 |
| Base branch       | `main`                                                                                                     |
| Head SHA          | `b9f2048541b884fb6eb74234f7fecd844102abc8`                                                                 |
| Base SHA          | `e7722e0faaa4cbe90d9d24ae7ad1cc69c18d58dd`                                                                 |
| Manifest ref      | `refs/pull/3/merge`                                                                                        |
| Manifest commit   | `a1ff90963040f43abec3ce3ef80efd1d25263199`                                                                 |
| Job ID            | `83578792524`                                                                                              |
| Job URL           | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28213236499/job/83578792524> |
| Conclusion        | `success`                                                                                                  |
| Duration          | about 19 seconds                                                                                           |
| Changed path type | `docs/concept/**` smoke change                                                                             |

The run executed the validate-all-centered workflow through the `pull_request` trigger. All relevant steps completed
successfully, including `Validate all registry-backed read-model Evidence`, focused tests, runtime fixture tests, PBE
validation, CI manifest writing, Step Summary writing, and artifact upload.

### Third PR Artifact Review Result

Artifact:

```text
pbe-todo-search-read-model-evidence
```

The artifact bundle was downloaded, reviewed, and removed from `.tmp/` after inspection. It contained the expected
positive read-model Evidence files:

- Todo Search generated read-model, evidence manifest, parity report, validation report, and scoped pilot marker
- Todo App PBE Run generated read-model, evidence manifest, and validation report
- aggregate summary JSON/Markdown
- CI evidence manifest

No invalid read-model fixture artifacts were included.

### Third PR CI Manifest Review Result

Reviewed file:

```text
adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json
```

| Manifest field                    | Observed value                                | Review status |
| --------------------------------- | --------------------------------------------- | ------------- |
| `status`                          | `ci-evidence-pass`                            | pass          |
| `evidenceLevel`                   | `ci-backed`                                   | pass          |
| `eventName`                       | `pull_request`                                | pass          |
| `triggerMode`                     | `pull_request-informational`                  | pass          |
| `pr.number`                       | `3`                                           | pass          |
| `pr.headRef`                      | `pbe/pr-info-observation-smoke-20260626-3`    | pass          |
| `pr.baseRef`                      | `main`                                        | pass          |
| `pr.headSha`                      | `b9f2048541b884fb6eb74234f7fecd844102abc8`    | pass          |
| `pr.baseSha`                      | `e7722e0faaa4cbe90d9d24ae7ad1cc69c18d58dd`    | pass          |
| `runId`                           | `28213236499`                                 | pass          |
| `runAttempt`                      | `1`                                           | pass          |
| `sourceCommit`                    | `a1ff90963040f43abec3ce3ef80efd1d25263199`    | pass          |
| `sourceRef`                       | `refs/pull/3/merge`                           | pass          |
| `sourceMode`                      | `registry-backed validate-all`                | pass          |
| `validateAllStatus`               | `aggregate-pass`                              | pass          |
| `aggregateStatus`                 | `aggregate-pass`                              | pass          |
| `includedSlices`                  | Todo Search; Todo App PBE Run                 | pass          |
| Todo Search validator/parity      | `validation-pass` / `comparison-pass`         | pass          |
| Todo Search node/edge/check count | 40 nodes / 59 edges / 20 checks               | pass          |
| Todo App validator/parity         | `validation-pass` / `not-required`            | pass          |
| Todo App node/edge/check count    | 22 nodes / 38 edges / 16 checks               | pass          |
| aggregate warning/blocking/DR     | 0 / 0 / 0                                     | pass          |
| retained warnings visible         | `true`                                        | pass          |
| invalid fixture inclusion         | not included in positive registry or artifact | pass          |
| source authority boundary         | present                                       | pass          |
| non-enforcement statement         | present                                       | pass          |
| non-promotion statement           | present                                       | pass          |

### Third PR Aggregate Review Result

Reviewed file:

```text
read-model-aggregate/generated/read-model-aggregate-summary.json
```

| Aggregate field                    | Observed value               | Review status |
| ---------------------------------- | ---------------------------- | ------------- |
| `status`                           | `aggregate-pass`             | pass          |
| `summary.sliceCount`               | 2                            | pass          |
| `summary.warningCount`             | 0                            | pass          |
| `summary.blockingCount`            | 0                            | pass          |
| `summary.decisionRequiredCount`    | 0                            | pass          |
| `summary.retainedWarningCount`     | 6                            | pass          |
| Todo Search per-slice summary      | `validation-pass`, 20 checks | pass          |
| Todo App PBE Run per-slice summary | `validation-pass`, 16 checks | pass          |

## Retained Warnings

The retained warnings remain active and visible:

- bounded fixture Evidence is not full Todo app implementation
- partial UI screenshot/manual visual Evidence remains partial
- ACEP task-card public-doc cleanup remains deferred
- push/schedule triggers, required checks, branch protection, and CI enforcement remain unapproved
- Node.js 20 deprecation annotation is resolved for the manual workflow by the Node 24 action/runtime update and
  successful post-update run `28157938343`; future GitHub Actions runtime changes remain ordinary CI hygiene
- PR #2 and PR #3 were smoke PRs; they satisfy the run-count threshold but should still be interpreted as docs-path
  observation, not automatic path-filter refinement or enforcement approval
- CI pass is Evidence only and does not approve source authority change or user acceptance

## Source Authority Boundary

Tree-native selected-slice artifacts remain current operational source.

The reviewed validate-all CI-backed Evidence confirms both a non-enforcing manual workflow run and non-enforcing
`pull_request` informational runs over the declared registry profiles and read-model Evidence artifacts. PR #2 and PR #3
confirm that the validate-all-centered workflow records PR metadata, `pull_request-informational` trigger mode,
`validateAllStatus: aggregate-pass`, and Evidence boundaries. Todo Search remains the only scoped source-authority pilot.
Todo App PBE Run remains structure-only. Invalid fixtures remain local-only and are not part of the positive aggregate
path. The aggregate summary is Evidence-only over produced per-slice validation reports. This review does not change
source authority, approve full Graph-source promotion, retire tree-native or `.pbe` artifacts, replace user acceptance,
add branch protection, add push/schedule triggers, or make the workflow a required check.

## Next Decision Surface

The next step should be one of:

1. `Design PR informational path-filter / failure-semantics refinement`
2. `Keep PR informational workflow non-enforcing and continue observing`
3. `Design CI enforcement / required check policy`
4. `Require public-doc cleanup before broader promotion`
5. `Prepare broader Graph-source promotion review`
6. `Rollback / defer scoped source-authority pilot`

Recommended next step:

```text
The three-real-PR observation count is now satisfied. Keep the PR informational workflow non-enforcing, and consider a
separate path-filter / failure-semantics refinement decision surface next. Enforcement policy, cleanup, broader
promotion review, and rollback/defer remain separate major branches.
```

Follow-up status: multi-slice validation design, Todo Search profile extraction, Todo App structure-only profile,
per-slice independence, aggregate summary, aggregate-enabled CI-backed run review, PR informational trigger
implementation, local validate-all, and validate-all-switched manual CI review are now recorded. This does not add
enforcement, source authority expansion, or full promotion; the validate-all PR observations now include PR #2 / run
`28210904900` and PR #3 / run `28213236499`.

The observation policy for later PR informational runs is recorded in
[pr-informational-observation-policy.md](pr-informational-observation-policy.md). Future PR run notes should use that
policy before changing path filters, failure semantics, required-check policy, or validation scope.

The append-only observation log and runbook for repeatable future PR run review is recorded in
[pr-informational-observation-log.md](pr-informational-observation-log.md). It records the manual baseline run
`28207696557`, PR `#1` run `28207822252`, PR `#2` run `28210904900`, PR `#3` run `28213236499`, PR `#4` run
`28218854329`, and the template/checklist for future observations without changing workflow triggers or enforcement.

## Projection-Contract CI Capture Review

Manual run `28218687289` reviewed the validate-all workflow after CI began capturing graph-source projection contract
status.

| Field         | Value                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Run ID        | `28218687289`                                                                                                       |
| Run URL       | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28218687289>                          |
| Event         | `workflow_dispatch`                                                                                                 |
| Commit        | `a968d3661f22f7c06647080310e8ea1f87e79d0a`                                                                          |
| Conclusion    | `success`                                                                                                           |
| Job ID        | `83595024984`                                                                                                       |
| Manifest      | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`                          |
| Projection    | Todo Search `projection-contract-pass`; Todo App PBE Run `not-configured`                                           |
| Artifact      | `read-model-validate-all-output.json` and `graph-source-read-model-projection.json` present                         |
| Boundary      | Non-enforcing Evidence only; no source authority expansion or Todo App promotion                                    |
| Review result | Manual projection-status observation reviewed; PR projection-status observation later reviewed by run `28218854329` |

PR run `28218854329` then reviewed the same projection-status capture path through the non-enforcing
`pull_request-informational` trigger.

| Field         | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| PR            | `#4`; draft temporary smoke PR; closed without merge                                        |
| Run ID        | `28218854329`                                                                               |
| Run URL       | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28218854329>  |
| Event         | `pull_request`                                                                              |
| Trigger mode  | `pull_request-informational`                                                                |
| Head SHA      | `38c8ef4b0a631b9a1e95fca55c171d3a58abc58a`                                                  |
| Base SHA      | `417f5d06166d8e9c062dc46de479af19e586681e`                                                  |
| Manifest ref  | `refs/pull/4/merge`                                                                         |
| Manifest      | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`  |
| Projection    | Todo Search `projection-contract-pass`; Todo App PBE Run `not-configured`                   |
| Artifact      | `read-model-validate-all-output.json` and `graph-source-read-model-projection.json` present |
| Boundary      | Non-enforcing Evidence only; no source authority expansion or Todo App promotion            |
| Cleanup       | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted       |
| Review result | Projection-status capture reviewed in both manual and PR informational modes                |

Manual run `28219396764` reviewed the workflow after Todo Search default read-model generation became graph-source-backed
for the limited promoted scope.

| Field                 | Value                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Run ID                | `28219396764`                                                                                       |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28219396764>          |
| Event                 | `workflow_dispatch`                                                                                 |
| Commit                | `e2456e3338c55f0390a426af8179082f8bba1629`                                                          |
| Conclusion            | `success`                                                                                           |
| Job ID                | `83597142022`                                                                                       |
| Manifest              | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`          |
| Todo Search           | 40 nodes / 59 edges; `comparison-pass`; `validation-pass`; 20 checks                                |
| Generation source     | Generated read-model metadata records `readModelSourceMode: graph-source-backed`                    |
| Graph source metadata | Generated read-model metadata records `examples/adoption/todo-search-slice/graph-source.json`       |
| Projection            | Todo Search `projection-contract-pass`; Todo App PBE Run `not-configured`                           |
| Artifact              | Generated read-model, evidence manifest, validate-all output, and graph projection present          |
| Boundary              | Non-enforcing Evidence only; no repo-wide promotion, enforcement, retirement, or Todo App promotion |
| Cleanup               | Artifact temp directory removed                                                                     |
| Review result         | Manual CI confirms graph-source-backed Todo Search generation health                                |

PR run `28219583619` then reviewed graph-source-backed Todo Search generation through the non-enforcing
`pull_request-informational` trigger.

| Field                 | Value                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| PR                    | `#5`; draft temporary smoke PR; closed without merge                                                |
| Run ID                | `28219583619`                                                                                       |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28219583619>          |
| Event                 | `pull_request`                                                                                      |
| Trigger mode          | `pull_request-informational`                                                                        |
| Head SHA              | `47ed16a208bde2881145c53e1758a00a73483078`                                                          |
| Base SHA              | `673edf81ddad20d2cfbd5cadb54597f0a2ebf447`                                                          |
| Manifest ref          | `refs/pull/5/merge`                                                                                 |
| Manifest              | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`          |
| Todo Search           | 40 nodes / 59 edges; `comparison-pass`; `validation-pass`; 20 checks                                |
| Generation source     | Generated read-model metadata records `readModelSourceMode: graph-source-backed`                    |
| Graph source metadata | Generated read-model metadata records `examples/adoption/todo-search-slice/graph-source.json`       |
| Projection            | Todo Search `projection-contract-pass`; Todo App PBE Run `not-configured`                           |
| Boundary              | Non-enforcing Evidence only; no repo-wide promotion, enforcement, retirement, or Todo App promotion |
| Cleanup               | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted               |
| Review result         | PR informational CI confirms graph-source-backed Todo Search generation health                      |

Manual run `28222731063` reviewed the workflow after Todo App bounded non-authority projection-contract enrollment
entered local positive validate-all.

| Field                 | Value                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Run ID                | `28222731063`                                                                                                |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28222731063>                   |
| Event                 | `workflow_dispatch`                                                                                          |
| Commit                | `b60b315b25da6767db73c0f6b8a082d06d61192d`                                                                   |
| Conclusion            | `success`                                                                                                    |
| Manifest              | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`                   |
| Todo Search           | graph-source-backed; 40 nodes / 59 edges; `projection-contract-pass`                                         |
| Todo App              | `validation-pass`; positive validate-all `candidate-projection-contract-pass`; 22 nodes / 38 edges / 7 views |
| Candidate observation | `candidate-observation-pass`; remains separate observation metadata                                          |
| Artifact              | validate-all output, candidate observation output, Todo Search projection, Todo App candidate projection     |
| Boundary              | Non-enforcing Evidence only; no Todo App source authority, promotion, enforcement, or tree retirement        |
| Cleanup               | Artifact temp directory removed                                                                              |
| Review result         | Manual CI confirms Todo App positive non-authority projection contract enrollment health                     |

PR run `28223010185` then reviewed the same Todo App positive projection status through the non-enforcing
`pull_request-informational` trigger.

| Field                 | Value                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| PR                    | `#7`; draft temporary smoke PR; closed without merge                                                     |
| Run ID                | `28223010185`                                                                                            |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28223010185>               |
| Event                 | `pull_request`                                                                                           |
| Trigger mode          | `pull_request-informational`                                                                             |
| Head branch           | `pbe/pr-info-todo-app-projection-smoke-20260626`                                                         |
| Base branch           | `main`                                                                                                   |
| Manifest              | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`               |
| Todo Search           | graph-source-backed; 40 nodes / 59 edges; `projection-contract-pass`                                     |
| Todo App              | positive validate-all `candidate-projection-contract-pass`; 22 nodes / 38 edges / 7 views                |
| Candidate observation | `candidate-observation-pass`; remains separate observation metadata                                      |
| Artifact              | validate-all output, candidate observation output, Todo Search projection, Todo App candidate projection |
| Boundary              | Non-enforcing Evidence only; no Todo App source authority, promotion, enforcement, or tree retirement    |
| Cleanup               | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted                    |
| Review result         | PR CI confirms Todo App positive non-authority projection contract enrollment health                     |

Manual run `28223860233` reviewed the workflow after local read-model E2E smoke became a non-enforcing CI observation
artifact.

| Field                 | Value                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Run ID                | `28223860233`                                                                                             |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28223860233>                |
| Event                 | `workflow_dispatch`                                                                                       |
| Commit                | `3b58e5e234b733fc58f2709b3fd42a4490e4e120`                                                                |
| Conclusion            | `success`                                                                                                 |
| Manifest              | `ci-evidence-pass`; `e2eSmokeStatus: e2e-smoke-pass`; `validateAllStatus: aggregate-pass`                 |
| Todo Search           | graph-source-backed; 40 nodes / 59 edges / 7 views; `projection-contract-pass`                            |
| Todo App              | positive validate-all `candidate-projection-contract-pass`; 22 nodes / 38 edges / 7 views                 |
| Candidate observation | `candidate-observation-pass`; remains separate observation metadata                                       |
| Artifact              | validate-all output, candidate observation output, E2E smoke output, Todo Search and Todo App projections |
| Boundary              | Non-enforcing Evidence only; no Todo App source authority, promotion, enforcement, or tree retirement     |
| Cleanup               | Artifact temp directory removed                                                                           |
| Review result         | Manual CI confirms E2E smoke status is visible in manifest and uploaded artifact output                   |

PR run `28224088829` then reviewed the same E2E smoke status through the non-enforcing `pull_request-informational`
trigger.

| Field                 | Value                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| PR                    | `#8`; draft temporary smoke PR; closed without merge                                                      |
| Run ID                | `28224088829`                                                                                             |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28224088829>                |
| Event                 | `pull_request`                                                                                            |
| Trigger mode          | `pull_request-informational`                                                                              |
| Head branch           | `pbe/pr-info-e2e-smoke-20260626`                                                                          |
| Base branch           | `main`                                                                                                    |
| Manifest              | `ci-evidence-pass`; `e2eSmokeStatus: e2e-smoke-pass`; `validateAllStatus: aggregate-pass`                 |
| Todo Search           | graph-source-backed; 40 nodes / 59 edges / 7 views; `projection-contract-pass`                            |
| Todo App              | positive validate-all `candidate-projection-contract-pass`; 22 nodes / 38 edges / 7 views                 |
| Candidate observation | `candidate-observation-pass`; remains separate observation metadata                                       |
| Artifact              | validate-all output, candidate observation output, E2E smoke output, Todo Search and Todo App projections |
| Boundary              | Non-enforcing Evidence only; no Todo App source authority, promotion, enforcement, or tree retirement     |
| Cleanup               | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted                     |
| Review result         | PR CI confirms E2E smoke status is visible in manifest and uploaded artifact output                       |

Manual run `28224636333` reviewed the workflow after Todo App structure-only generation became graph-source-candidate
backed.

| Field                 | Value                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Run ID                | `28224636333`                                                                                          |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28224636333>             |
| Event                 | `workflow_dispatch`                                                                                    |
| Commit                | `0f593bf79dcc6d4c40fcce8448057b35ad633a89`                                                             |
| Conclusion            | `success`                                                                                              |
| Manifest              | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `e2eSmokeStatus: e2e-smoke-pass`              |
| Todo Search           | graph-source-backed; 40 nodes / 59 edges / 7 views; `projection-contract-pass`                         |
| Todo App generation   | `readModelSourceMode: graph-source-backed`; `graphSourceAuthorityStatus: non-authority-structure-only` |
| Todo App Evidence     | 22 nodes / 38 edges / 7 views; `validation-pass`; `candidate-projection-contract-pass`                 |
| Candidate observation | `candidate-observation-pass`; remains separate observation metadata                                    |
| Boundary              | CI observation only; no Todo App source authority, promotion, enforcement, or tree retirement          |
| Cleanup               | Artifact temp directory removed                                                                        |
| Review result         | Manual CI confirms Todo App candidate-backed generation metadata is visible in uploaded artifacts      |

PR run `28224878648` then reviewed the same Todo App candidate-backed generation metadata through the non-enforcing
`pull_request-informational` trigger.

| Field                 | Value                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| PR                    | `#9`; draft temporary smoke PR; closed without merge                                                   |
| Run ID                | `28224878648`                                                                                          |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28224878648>             |
| Event                 | `pull_request`                                                                                         |
| Trigger mode          | `pull_request-informational`                                                                           |
| Head branch           | `pbe/pr-info-todo-app-graph-source-generation-20260626`                                                |
| Base branch           | `main`                                                                                                 |
| Manifest              | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `e2eSmokeStatus: e2e-smoke-pass`              |
| Todo Search           | graph-source-backed; 40 nodes / 59 edges / 7 views; `projection-contract-pass`                         |
| Todo App generation   | `readModelSourceMode: graph-source-backed`; `graphSourceAuthorityStatus: non-authority-structure-only` |
| Todo App Evidence     | 22 nodes / 38 edges / 7 views; `validation-pass`; `candidate-projection-contract-pass`                 |
| Candidate observation | `candidate-observation-pass`; remains separate observation metadata                                    |
| Boundary              | PR observation only; no Todo App source authority, promotion, enforcement, or tree retirement          |
| Cleanup               | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted                  |
| Review result         | PR CI confirms Todo App candidate-backed generation metadata is visible in uploaded artifacts          |

Manual run `28226270934` reviewed the workflow after Todo App structure-only status was confirmed as graph-source-backed
and the workflow artifact bundle path was updated from the old candidate projection name to
`graph-source-read-model-projection.json`.

| Field               | Value                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Run ID              | `28226270934`                                                                                                   |
| Run URL             | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28226270934>                      |
| Event               | `workflow_dispatch`                                                                                             |
| Commit              | `8a8ef76b63272d2303978dae51b1d0709fb632c4`                                                                      |
| Conclusion          | `success`                                                                                                       |
| Manifest            | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `e2eSmokeStatus: e2e-smoke-pass`                       |
| Todo Search         | graph-source-backed; 40 nodes / 59 edges / 7 views; `projection-contract-pass`                                  |
| Todo App generation | `readModelSourceMode: graph-source-backed`; `graphSourceAuthorityStatus: confirmed-structure-only-graph-source` |
| Todo App Evidence   | 22 nodes / 38 edges / 7 views; `validation-pass`; `projection-contract-pass`; `structure-only-confirmed`        |
| Artifact            | Todo App `graph-source-read-model-projection.json` present in uploaded bundle                                   |
| Boundary            | CI observation only; no enforcement, required check, tree retirement, or invalid fixture CI                     |
| Cleanup             | Artifact temp directory removed                                                                                 |
| Review result       | Manual CI confirms confirmed Todo App graph-source-backed metadata and artifact capture                         |

PR run `28226357099` then reviewed the same confirmed Todo App metadata through the non-enforcing
`pull_request-informational` trigger.

| Field               | Value                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| PR                  | `#10`; draft temporary smoke PR; closed without merge                                                           |
| Run ID              | `28226357099`                                                                                                   |
| Run URL             | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28226357099>                      |
| Event               | `pull_request`; `pull_request-informational`                                                                    |
| Head / base         | `pbe/pr-info-confirmed-todo-app-smoke-20260626` / `main`                                                        |
| Manifest            | `ci-evidence-pass`; PR metadata present; `validateAllStatus: aggregate-pass`; `e2eSmokeStatus: e2e-smoke-pass`  |
| Todo Search         | graph-source-backed; 40 nodes / 59 edges / 7 views; `projection-contract-pass`                                  |
| Todo App generation | `readModelSourceMode: graph-source-backed`; `graphSourceAuthorityStatus: confirmed-structure-only-graph-source` |
| Todo App Evidence   | 22 nodes / 38 edges / 7 views; `validation-pass`; `projection-contract-pass`; `structure-only-confirmed`        |
| Artifact            | Todo App `graph-source-read-model-projection.json` present in uploaded bundle                                   |
| Boundary            | PR observation only; no enforcement, required check, tree retirement, or invalid fixture CI                     |
| Cleanup             | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted                           |
| Review result       | PR CI confirms confirmed Todo App graph-source-backed metadata and artifact capture                             |

Manual run `28346777344` reviewed the workflow after native and retrofit intent-critical edgeIntent projections were
added as non-enforcing CI observation artifacts.

| Field                 | Value                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Run ID                | `28346777344`                                                                                 |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28346777344>    |
| Event                 | `workflow_dispatch`                                                                           |
| Commit                | `b481a18c69ec4e537d4ed28d380c4036c9d14374`                                                    |
| Conclusion            | `success`                                                                                     |
| Manifest              | `ci-evidence-pass`; `edgeIntentProjectionObservationStatus: edge-intent-projection-pass`      |
| Native intent fixture | `intent-projection-pass`; 1 projected intent; projection artifact present                     |
| Retrofit fixture      | `intent-projection-pass`; 1 projected intent; projection artifact present                     |
| Positive read-model   | `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`                        |
| Other observations    | Todo Search and Todo App projection contracts pass; E2E smoke pass                            |
| Boundary              | Intent projection CI observation only; no broad validate-all intent enforcement               |
| Cleanup               | Artifact temp directory removed                                                               |
| Review result         | Manual CI confirms edgeIntent projection observation status and uploaded projection artifacts |

PR run `28346897073` reviewed the same edgeIntent projection observation fields through the non-enforcing
`pull_request-informational` trigger.

| Field                 | Value                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------ |
| PR                    | `#11`; draft temporary smoke PR; closed without merge                                      |
| Run ID                | `28346897073`                                                                              |
| Run URL               | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28346897073> |
| Event                 | `pull_request`; `pull_request-informational`                                               |
| Head / base           | `pbe/pr-info-edge-intent-smoke-20260629` / `main`                                          |
| Manifest              | `ci-evidence-pass`; PR metadata present; `edgeIntentProjectionObservationStatus: pass`     |
| Native intent fixture | `intent-projection-pass`; 1 projected intent; projection artifact present                  |
| Retrofit fixture      | `intent-projection-pass`; 1 projected intent; projection artifact present                  |
| Positive read-model   | `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`                     |
| E2E smoke             | `e2e-smoke-pass`                                                                           |
| Boundary              | PR intent projection observation only; no broad validate-all intent enforcement            |
| Cleanup               | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted      |
| Review result         | PR CI confirms edgeIntent projection observation status and uploaded projection artifacts  |

Manual run `28348764191` reviewed the workflow after local E2E smoke began checking `report-intent`.

| Field               | Value                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Run ID              | `28348764191`                                                                              |
| Run URL             | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28348764191> |
| Event               | `workflow_dispatch`                                                                        |
| Commit              | `bb975d05f1f08754cc4dd075e546eb554372755f`                                                 |
| Conclusion          | `success`                                                                                  |
| Manifest            | `ci-evidence-pass`; `e2eSmokeStatus: e2e-smoke-pass`                                       |
| E2E intent report   | `intent-report-pass`; native/retrofit summaries present                                    |
| Intent counts       | 2 edgeIntents; 2 claims; 12 classifications; 4 anchors                                     |
| Missing counts      | 0 missing classifications; 0 missing anchors                                               |
| Positive read-model | `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`                     |
| Boundary            | Manual CI observation only; no broad intent schema enforcement                             |
| Cleanup             | Artifact temp directory removed                                                            |
| Review result       | Manual CI confirms uploaded E2E smoke output now exposes `intentReport`                    |

PR run `28348903718` reviewed the same E2E `intentReport` visibility through the non-enforcing
`pull_request-informational` trigger.

| Field               | Value                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| PR                  | `#12`; draft temporary smoke PR; closed without merge                                      |
| Run ID              | `28348903718`                                                                              |
| Run URL             | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28348903718> |
| Event               | `pull_request`; `pull_request-informational`                                               |
| Head / base         | `pbe/pr-info-intent-report-e2e-smoke-20260629` / `main`                                    |
| Manifest            | `ci-evidence-pass`; PR metadata present; `e2eSmokeStatus: e2e-smoke-pass`                  |
| E2E intent report   | `intent-report-pass`; native/retrofit summaries present                                    |
| Intent counts       | 2 edgeIntents; 2 claims; 12 classifications; 4 anchors                                     |
| Missing counts      | 0 missing classifications; 0 missing anchors                                               |
| Positive read-model | `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`                     |
| Boundary            | PR CI observation only; no broad intent schema enforcement                                 |
| Cleanup             | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted      |
| Review result       | PR CI confirms uploaded E2E smoke output exposes `intentReport` with PR metadata           |

Manual workflow run `28350824272` reviewed the non-enforcing graph-source health report artifact after
`graph read-model report-health --json` was added to the workflow.

| Field                | Value                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Run ID               | `28350824272`                                                                                             |
| Run URL              | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28350824272>                |
| Event                | `workflow_dispatch`                                                                                       |
| Commit               | `d467b90`                                                                                                 |
| Conclusion           | `success`                                                                                                 |
| Manifest             | `ci-evidence-pass`; `healthReportStatus: graph-source-health-pass`                                        |
| Health validate-all  | `aggregate-pass`                                                                                          |
| Health edgeIntent    | `intent-report-pass`; 2 edgeIntents                                                                       |
| Retirement readiness | `retirement-not-ready`                                                                                    |
| Retirement package   | Todo Search `approval-candidate-not-approved`; Todo App `not-ready-structure-only`; repo-wide `not-ready` |
| Enforcement status   | `non-enforcing`                                                                                           |
| Artifact             | `read-model-aggregate/generated/read-model-health-report-output.json` present                             |
| Cleanup              | Artifact temp directory removed                                                                           |
| Review result        | Manual CI confirms manifest, Step Summary fields, and uploaded health report artifact                     |

## Gate Self-Check

| Gate                              | Status | Result                                                                                                              |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Manual Workflow Run Gate          | pass   | Run `28156403793` completed successfully on `workflow_dispatch`.                                                    |
| Validate-All Manual Run Gate      | pass   | Run `28210541509` completed successfully on `workflow_dispatch` after the workflow switched to validate-all.        |
| Projection-Status Manual Gate     | pass   | Run `28218687289` captured Todo Search `projection-contract-pass` in manifest and validate-all output.              |
| Graph-Source-Backed Manual Gate   | pass   | Run `28219396764` confirmed graph-source-backed Todo Search generation in CI artifacts.                             |
| Todo App Projection Manual Gate   | pass   | Run `28222731063` confirmed Todo App `candidate-projection-contract-pass` in positive validate-all artifacts.       |
| E2E Smoke Manual Gate             | pass   | Run `28223860233` confirmed `e2eSmokeStatus: e2e-smoke-pass` in manifest and uploaded smoke output.                 |
| E2E Intent Report Manual Gate     | pass   | Run `28348764191` confirmed E2E output contains `intentReport: intent-report-pass` with zero missing counts.        |
| Health Report Manual Gate         | pass   | Run `28350824272` confirmed `healthReportStatus: graph-source-health-pass` and uploaded health report artifact.     |
| Todo App Generation Manual Gate   | pass   | Run `28224636333` confirmed Todo App `graph-source-backed` / `non-authority-structure-only` metadata.               |
| Todo App Confirmed Manual Gate    | pass   | Run `28226270934` confirmed Todo App `projection-contract-pass` / `confirmed-structure-only-graph-source`.          |
| edgeIntent Projection Manual Gate | pass   | Run `28346777344` confirmed native/retrofit `edge-intent-projection-pass` in manifest and artifacts.                |
| Graph-Source-Backed PR Gate       | pass   | PR #5 run `28219583619` confirmed graph-source-backed Todo Search generation in PR artifacts.                       |
| Todo App Projection PR Gate       | pass   | PR #7 run `28223010185` confirmed Todo App `candidate-projection-contract-pass` in PR artifacts.                    |
| E2E Smoke PR Gate                 | pass   | PR #8 run `28224088829` confirmed `e2eSmokeStatus: e2e-smoke-pass` in PR artifacts.                                 |
| Todo App Generation PR Gate       | pass   | PR #9 run `28224878648` confirmed Todo App `graph-source-backed` / `non-authority-structure-only` metadata.         |
| Todo App Confirmed PR Gate        | pass   | PR #10 run `28226357099` confirmed Todo App `projection-contract-pass` / `confirmed-structure-only-graph-source`.   |
| edgeIntent Projection PR Gate     | pass   | PR #11 run `28346897073` confirmed native/retrofit `edge-intent-projection-pass` in PR artifacts.                   |
| E2E Intent Report PR Gate         | pass   | PR #12 run `28348903718` confirmed E2E output contains `intentReport: intent-report-pass` with zero missing counts. |
| PR Informational Run Gate         | pass   | PR #1, PR #2, PR #3, PR #4, and PR #5 triggered `pull_request` runs and completed successfully.                     |
| CI-Backed Artifact Review Gate    | pass   | Expanded artifact bundle `pbe-todo-search-read-model-evidence` was downloaded and inspected.                        |
| CI Manifest Integrity Gate        | pass   | Manifest is `ci-backed` / `ci-evidence-pass` and includes Todo Search, Todo App, aggregate, and boundaries.         |
| Validation Report Gate            | pass   | Todo Search and Todo App validation reports are `validation-pass` with 20 and 16 checks.                            |
| Parity Report Gate                | pass   | Todo Search parity is `comparison-pass`; Todo App parity remains `not-required`.                                    |
| Aggregate Report Gate             | pass   | Aggregate summary is `aggregate-pass`, 2 slices, 0 warning/blocking/decision-required.                              |
| Validate-All Manifest Gate        | pass   | Manifest records `sourceMode: registry-backed validate-all` and `validateAllStatus: aggregate-pass`.                |
| Validate-All PR Run Gate          | pass   | PR #2 run `28210904900` and PR #3 run `28213236499` record validate-all `pull_request` success.                     |
| Projection-Status PR Gate         | pass   | PR #4 run `28218854329` captured Todo Search `projection-contract-pass` in PR informational artifacts.              |
| Observation Threshold Gate        | pass   | Three real PR informational runs are reviewed; refinement may be considered but is not automatic.                   |
| Non-Enforcing CI Gate             | pass   | Workflow remains informational only for manual and PR runs.                                                         |
| Non-Required-Check Gate           | pass   | No required check or branch protection was added.                                                                   |
| Source Authority Boundary Gate    | pass   | Source authority remains unchanged; Todo App remains structure-only.                                                |
| Non-Full-Promotion Gate           | pass   | No full Graph-source promotion is recorded.                                                                         |
| Scope Containment Gate            | pass   | Source-authority pilot remains bounded to Todo Search only.                                                         |
| Node 24 CI Hygiene Gate           | pass   | Run `28157938343` succeeded after the workflow moved to Node 24 action/runtime settings.                            |
| Retained Warning Visibility Gate  | pass   | Retained Evidence/source warnings remain documented; Node.js 20 deprecation is no longer active.                    |
| User Approval Boundary Gate       | pass   | CI pass is not treated as user approval.                                                                            |
| Evidence Honesty Gate             | pass   | Only the observed CI run and downloaded artifact are recorded as reviewed Evidence.                                 |

## Final Statement

Temporary PR health report visibility smoke note.

This review records successful non-enforcing validate-all CI-backed Evidence for the declared read-model Evidence
bundle. It does not promote Maintainability Graph, change current source authority, expand source-authority pilot scope,
introduce CI enforcement, add required checks, retire tree-native artifacts, clean up public docs, or replace user
approval.
