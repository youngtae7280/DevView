# PR Informational Observation Policy

Status: pr-informational-observation-policy / observation-policy-established / non-enforcing

## Purpose

This document defines how PBE should observe the non-enforcing PR informational read-model Evidence workflow before
changing path filters, failure semantics, CI enforcement, validation scope, or promotion readiness policy.

The current workflow already supports:

```text
workflow_dispatch
pull_request informational with path filters
```

This policy turns `Keep PR informational workflow non-enforcing and observe more PRs` into a reviewable observation
surface. It does not modify `.github/workflows/read-model-evidence.yml`, create new pull requests, dispatch GitHub
Actions, add required checks, change source authority, approve full Graph-source promotion, or replace user acceptance.

The operational append-only log and runbook for applying this policy is
[pr-informational-observation-log.md](pr-informational-observation-log.md). Future PR run reviews should record entries
there before path-filter, failure-semantics, enforcement, or validation-scope changes are considered.

All-slice validation is tracked separately in
[read-model-validate-all-contract.md](read-model-validate-all-contract.md). This PR observation policy does not approve
`validate --all` workflow changes.
Future non-enforcing CI workflow integration of local `validate --all` is designed in
[ci-validate-all-integration-design.md](ci-validate-all-integration-design.md).
Registry fixture and test planning for that future path is tracked in
[read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md).

## Current Baseline

| Baseline item                 | Current state                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Manual dispatch review        | Run `28207696557`, `workflow_dispatch`, `success`, `ci-evidence-pass`                                                |
| First PR informational review | PR #1, run `28207822252`, `pull_request`, `pull_request-informational`, `success`, `ci-evidence-pass`                |
| Workflow mode                 | `workflow_dispatch` + non-enforcing `pull_request` informational trigger                                             |
| Included slices               | `examples/adoption/todo-search-slice`; `examples/valid/todo-app-pbe-run`; aggregate summary                          |
| Todo Search status            | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges / 20 checks                                                |
| Todo App PBE Run status       | `validation-pass`, parity `not-required`, 22 nodes / 38 edges / 16 checks                                            |
| Aggregate status              | `aggregate-pass`, 2 slices, 0 warning / 0 blocking / 0 decision-required                                             |
| Authority boundary            | CI/PR Evidence is Evidence only; no source authority expansion, full promotion, enforcement, or user acceptance swap |

## Observation Purpose

PR informational observation exists to make graph read-model Evidence drift visible during ordinary PR work.

It should answer:

- Does the workflow run when expected PR paths change?
- Does the run produce artifact bundles and Step Summary output reliably?
- Are Todo Search, Todo App PBE Run, and aggregate statuses stable?
- Are retained warnings and source-authority boundaries still visible?
- Are path filters too broad, too narrow, or correctly balanced?
- Does any failure represent runtime/tooling breakage, artifact integrity failure, evidence warning, decision-required
  status, or a true blocker?

It should not:

- enforce merges
- become a required check
- change source authority
- expand the Todo Search scoped pilot
- promote Todo App PBE Run beyond `structure-only`
- approve full Graph-source promotion
- replace user acceptance

## Observation Metrics

Each observed PR informational run should record, at minimum:

| Metric group               | Fields to record                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run identity               | run id, run URL, event, trigger mode, workflow name, run attempt, conclusion, job id, duration                                                          |
| PR identity                | PR number, PR status, head SHA, base SHA, head ref, base ref                                                                                            |
| Changed path categories    | workflow, CLI, scripts, Todo Search slice, Todo App PBE Run slice, aggregate artifacts, concept docs, other                                             |
| Artifact availability      | artifact bundle present, manifest present, validation reports present, parity report present where required, aggregate summary present                  |
| Todo Search status         | validation status, parity status, check count, node/edge count, warning/blocking/decision-required counts                                               |
| Todo App PBE Run status    | validation status, policy level, parity requirement/status, check count, node/edge count, warning/blocking/decision-required counts                     |
| Aggregate status           | aggregate status, slice count, warning/blocking/decision-required counts, retained warning count                                                        |
| Boundary visibility        | source authority boundary present, non-enforcement statement present, non-promotion statement present, retained warnings remain visible                 |
| Failure classification     | command/runtime failure, artifact integrity failure, evidence warning, decision-required, true blocker, false positive/noise                            |
| Observation interpretation | whether the run supports continued observation, path-filter refinement, runtime/cost optimization, failure-semantics revision, or escalation discussion |

## Recommended Observation Window

Recommended minimum observation before path-filter or failure-semantics changes:

```text
Observe at least 3 real PR informational runs, or at least 1 week of normal PR activity, whichever gives better signal.
```

Immediate re-review is required before the observation window completes if any of the following occurs:

- source-authority boundary wording disappears or becomes ambiguous
- retained warnings disappear from generated artifacts or summaries
- `triggerMode` no longer distinguishes `pull_request-informational`
- PR metadata is missing from a PR-triggered manifest
- Todo Search parity changes away from `comparison-pass`
- Todo Search or Todo App validation becomes `validation-blocked` or `decision-required`
- aggregate status becomes `aggregate-blocked` or `decision-required`
- artifact upload is missing or malformed
- workflow failures appear unrelated to changed paths and repeat across PRs
- PR UI red status starts being treated socially as a merge blocker despite the non-enforcing policy

## Path-Filter Refinement Criteria

The current path set intentionally favors visibility over minimizing every run:

```text
.github/workflows/read-model-evidence.yml
cli/src/**
scripts/**
examples/adoption/todo-search-slice/**
examples/valid/todo-app-pbe-run/**
examples/read-model-aggregate/**
docs/concept/**
```

### Narrowing Criteria

Consider narrowing filters if observation shows:

- `docs/concept/**` causes repeated informational runs for unrelated concept-only edits with no Evidence drift value
- generated artifact timestamp/source-commit churn dominates PR changes without meaningful review signal
- `scripts/**` runs too often for scripts unrelated to PBE/read-model validation
- aggregate-only artifact changes create repeated runs when per-slice reports are unchanged
- runtime/cost becomes disproportionate for low-risk documentation PRs

Possible narrowing options:

- split `docs/concept/**` into read-model/source-transition focused concept paths
- split `scripts/**` into validation/build scripts that affect read-model Evidence
- include aggregate contract docs but exclude generated aggregate artifacts unless per-slice report changes are present
- keep docs broad but make the Step Summary explicitly classify doc-only PRs as lower risk

### Broadening Criteria

Consider broadening filters if observation shows:

- read-model Evidence inputs can drift from paths outside the current set
- package/build configuration changes affect CLI generation or validation reliability
- schema/template changes affect generated or validated report structure
- future slice profiles are added outside the current example paths
- action/runtime configuration changes move outside `.github/workflows/read-model-evidence.yml`

Possible broadening options:

- include `package.json`, `package-lock.json`, `tsconfig*.json`, or validator schema/template paths
- include future profile directories after they become generated/validated Evidence inputs
- include docs that define source authority or Evidence policy outside `docs/concept/**` if they become active

### Tradeoff Rule

Prefer broad filters while the workflow is informational and the observation sample is small. Prefer narrower filters
only after real PR evidence shows repeated low-value noise.

## Failure Classification Policy

| Failure / status type               | Interpretation                                                                               | Default action                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Command/runtime failure             | Workflow health or toolchain problem.                                                        | Investigate and fix or record blocker.                                                         |
| Artifact integrity failure          | Required output missing, malformed, or inconsistent.                                         | Treat as blocker for Evidence trust until resolved.                                            |
| Evidence warning                    | Run completed but warns about retained limitation or non-blocking drift.                     | Keep visible; do not treat as merge enforcement unless later policy says so.                   |
| `decision-required`                 | User judgment may be needed for source/acceptance/risk/authority implications.               | Surface clearly; do not auto-resolve.                                                          |
| True blocker                        | Boundary, parity, validation, or aggregate state blocks safe Evidence interpretation.        | Stop broader progression and create a focused fix/review task.                                 |
| False positive / noise              | Run is technically correct but low-value for the changed PR path.                            | Count toward path-filter refinement evidence.                                                  |
| Social enforcement risk             | Non-required PR red/green status is being treated as a merge gate without explicit approval. | Revisit Step Summary wording or failure semantics before considering required-check policy.    |
| Hidden warning / boundary ambiguity | Warning or authority boundary is missing from artifacts, manifest, or summary.               | Immediate re-review; do not proceed toward enforcement or promotion until visibility is fixed. |

## Escalation Criteria

### Path-Filter Refinement

Open a path-filter refinement task when:

- two or more observed PR runs are low-value noise from the same path category
- doc-only PRs dominate the observation set without exposing useful Evidence drift
- an expected Evidence-impacting path does not trigger the workflow
- artifact churn repeatedly appears without corresponding source or policy changes

### Runtime / Cost Optimization

Open an optimization task when:

- workflow duration grows enough to slow normal PR review
- dependency install/build dominates runtime and can be safely cached or split
- the same command sequence is repeated in ways that can be simplified without hiding Evidence

### Failure-Semantics Revision

Open a failure-semantics revision task when:

- non-blocking Evidence warnings repeatedly create confusing PR red status
- decision-required status needs a stronger Step Summary without merge enforcement
- command failures and Evidence judgment statuses are not distinguishable enough to reviewers

### Required Check / Enforcement Discussion

Reopen required check or enforcement design only after:

- PR informational mode has multiple reviewed successful runs
- path filters are stable enough to avoid excessive noise
- failure semantics separate command failures from Evidence judgment
- retained warnings remain visible
- user explicitly chooses to discuss enforcement

Required checks remain a separate decision and cannot be inferred from `ci-evidence-pass`.

### Broader Validation / `validate --all` Discussion

Reopen broader validation scope or `validate --all` workflow integration only after:

- per-slice reports stay independent
- aggregate summary remains stable
- additional slice profiles have clear policy levels
- Todo App PBE Run remains correctly classified unless separately strengthened
- source authority boundaries remain unambiguous

The non-enforcing CI workflow switch to local `validate --all` is designed in
[ci-validate-all-integration-design.md](ci-validate-all-integration-design.md). Implementing that switch should be
recorded as a workflow-mode change and observed under this policy before enforcement or filter changes are discussed.

## Observation Record Template

Future PR observation notes should include:

```text
PR:
Run:
Event / triggerMode:
Head / base:
Changed path categories:
Artifact bundle:
Manifest status:
Todo Search status:
Todo App PBE Run status:
Aggregate status:
Warnings / blockers / decision-required:
Boundary visibility:
Noise / false positive assessment:
Recommended follow-up:
```

The detailed reusable entry template, review checklist, changed-path categories, and observation counter live in
[pr-informational-observation-log.md](pr-informational-observation-log.md).

## Non-Scope

This policy does not:

- modify `.github/workflows/read-model-evidence.yml`
- change workflow triggers
- create a new PR
- dispatch GitHub Actions
- add required checks
- add branch protection
- introduce CI enforcement
- implement `validate --all`
- expand source authority
- approve full Graph-source promotion
- perform public-doc cleanup
- retire tree-native or `.pbe` artifacts
- promote Todo App PBE Run beyond `structure-only`
- make PR informational pass equivalent to user acceptance

## Gate Self-Check

| Gate                             | Result | Notes                                                                                  |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Observation-Only Gate            | PASS   | Defines observation policy only; no workflow/code/PR/run changes.                      |
| Non-Enforcement Gate             | PASS   | Required checks, branch protection, and CI enforcement remain out of scope.            |
| Source Authority Boundary Gate   | PASS   | PR Evidence remains Evidence only and does not expand source authority.                |
| Non-Full-Promotion Gate          | PASS   | Full Graph-source promotion remains separate and unapproved.                           |
| Path-Filter Refinement Gate      | PASS   | Defines criteria for later refinement without changing filters now.                    |
| Failure Semantics Clarity Gate   | PASS   | Separates command/runtime failure, artifact integrity, warning, decision, and blocker. |
| Retained Warning Visibility Gate | PASS   | Hidden warning or boundary ambiguity triggers immediate re-review.                     |
| Todo App Structure-Only Gate     | PASS   | Todo App PBE Run remains structure-only.                                               |
| User Approval Boundary Gate      | PASS   | PR pass cannot replace user acceptance or approve enforcement/promotion.               |
| Public-Doc Cleanup Boundary Gate | PASS   | Cleanup remains deferred and is not performed by this policy.                          |

## Final Statement

PR informational observation is a non-enforcing Evidence observation policy. It keeps the workflow visible and
reviewable while preserving source authority, promotion, public-doc cleanup, validation-scope, and user-acceptance
boundaries.
