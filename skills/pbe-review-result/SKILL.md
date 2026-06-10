---
name: pbe-review-result
description: Package ACEP execution results for user review and set delivery status to submitted_for_review, not accepted.
---

# PBE Review Result

Use this skill after `pbe-run-acep` or `pbe-run-revision`.

## Purpose

Prepare a review pack that lets the user decide whether to accept the result, request changes, ask questions, start the next slice, or complete the whole project.

Codex must not mark work as `accepted`.

This skill is a human gate in Autoflow. Stop here until the user approves, requests revision, asks a question, or stops.

## Inputs

```text
.pbe/codex-execution-pack/17-final-report-template.md
.pbe/codex-execution-pack/16-final-coverage-check.md
.pbe/codex-execution-pack/15-ui-ux-evidence-checklist.md
.pbe/codex-execution-pack/04-traceability-matrix.json
.pbe/codex-execution-pack/execution-manifest.json
```

Also inspect current changed files and validation results when available.

## Outputs

```text
.pbe/review/codex-final-report.md
.pbe/review/result-summary.md
.pbe/review/changed-files.md
.pbe/review/validation-results.md
.pbe/review/coverage-result.md
.pbe/review/ui-ux-evidence.md
.pbe/review/user-review-checklist.md
.pbe/review/user-feedback.md
```

## Delivery Status

Allowed Codex statuses:

```text
implemented
verified
submitted_for_review
revision_requested
revision_in_progress
revision_verified
```

Only the user can set:

```text
accepted
```

When this skill completes, set or report status as:

```text
submitted_for_review
```

Set `pbe-state.json.autoflow.state` to `WAITING_REVIEW_RESULT`, set `autoflow.currentGate` to `review_result`, and set `autoflow.nextStep` to `review_result`.

If the user approves at this gate, move to `WAITING_NEXT_SLICE_DECISION`, not `COMPLETED`. The next gate asks whether to finish the current slice, start another slice, or complete the whole project.

## Review Scope

The review pack must separate:

- selected scope completed
- foundation scope completed
- deferred scope protected
- blocked scope, if any
- out-of-scope changes, if any
- failed or skipped validation
- remaining risks
- recommended next slice

## User Review Checklist

Include:

- functional review
- UI/UX review
- validation review
- coverage audit review
- UX audit review
- remaining issues review
- final decision:
  - approve this slice
  - needs revision
  - start next slice
  - complete whole project
  - stop

## Friendly Gate Guidance

Do not show only internal commands. Use `[PBE 상태 보고]` first, following `templates/review-result-gate-message-template.md`. Put any reasoning under `[Codex 메모]`.

Explain:

```text
Final result review is needed.

Please review:
- execution result
- failed test cases
- coverage audit result
- UX audit result
- remaining risks
- items that may need rerun

If this result is okay, say that naturally.

Examples:
"approve"
"results look good"
"this slice is okay"

If changes or rerun are needed, say what you want changed.

Examples:
"add a reconnection test"
"fix only the failed case and rerun"
"fill the missing coverage item and rerun ACEP"

If you are unsure, ask naturally.

Examples:
"what must be fixed before completion?"
"is this safe to finish?"
"are the failed items real defects or environment issues?"
```

After approval, explain the next-slice gate:

```text
This slice is reviewed.

Choose one:
- complete the current slice
- start the next slice
- complete the whole project
- request a revision
```

## Revision Routing

If the user is dissatisfied:

1. Run `pbe-collect-feedback`.
2. Map feedback to affected requirement/task/UI/verification IDs.
3. Run `pbe-create-revision-pack`.
4. Run `pbe-run-revision`.
5. Return to this Review Result gate.

Revision must stay inside affected selected/foundation scope unless the user explicitly changes implementation scope.

## Completion Report

Report with `[PBE 상태 보고]` first:

- review pack paths
- selected/foundation/deferred/out-of-scope summary
- validations run and skipped
- coverage and UX audit status
- delivery status: `submitted_for_review`
- next human choices in natural language
- recommended reply for the user

Use `[Codex 메모]` only for short review guidance or risk interpretation.
