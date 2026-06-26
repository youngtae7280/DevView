# PR Informational Observation Log

Status: pr-informational-observation-log / append-only-runbook-established / non-enforcing

This document is the append-only observation log and review runbook for non-enforcing PR informational read-model
Evidence runs.

It is not a source-authority record, CI enforcement policy, required-check policy, branch-protection rule, promotion
decision, or user acceptance record. It gives future reviewers a repeatable way to inspect PR-triggered read-model
Evidence without changing workflow behavior.

## Current Baseline

| Baseline item             | Current value                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Manual dispatch baseline  | Run `28207696557`, `workflow_dispatch`, `success`, `ci-evidence-pass`                                       |
| First real PR run         | PR `#1`, run `28207822252`, `pull_request`, `pull_request-informational`, `success`, `ci-evidence-pass`     |
| Current workflow mode     | `workflow_dispatch` plus non-enforcing `pull_request-informational`                                         |
| Included slices           | `examples/adoption/todo-search-slice`; `examples/valid/todo-app-pbe-run`; aggregate summary                 |
| Observation policy        | [pr-informational-observation-policy.md](pr-informational-observation-policy.md)                            |
| Current real PR run count | 1 reviewed real PR informational run                                                                        |
| Target before refinement  | At least 3 real PR informational runs or 1 week of normal PR flow, unless immediate re-review is triggered. |
| Enforcement / authority   | Not approved. PR Evidence is informational only and does not change source authority.                       |

## Baseline Entries

### Baseline Entry 1: Manual Dispatch Run

| Field                        | Value                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                   | Manual CI-backed Evidence baseline                                                                                                                 |
| Run ID                       | `28207696557`                                                                                                                                      |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207696557`                                                         |
| Event / trigger mode         | `workflow_dispatch` / `workflow_dispatch`                                                                                                          |
| Source branch / commit       | `main` / `0e5ceb90ed095ffdfda2cf34f3f9ed05f9d56bd3`                                                                                                |
| Artifact bundle              | Present and reviewed                                                                                                                               |
| Manifest status              | `ci-evidence-pass`                                                                                                                                 |
| Evidence level               | `ci-backed`                                                                                                                                        |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                               |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                                           |
| Aggregate status             | `aggregate-pass`, 2 included slices                                                                                                                |
| Warning / blocker / decision | 0 / 0 / 0 at aggregate status level                                                                                                                |
| Retained warning visibility  | Present                                                                                                                                            |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                                          |
| Failure / noise class        | None                                                                                                                                               |
| Interpretation               | Manual workflow mode remains valid after PR informational implementation; this does not count as a real PR observation for path-filter refinement. |

### Baseline Entry 2: First Real PR Informational Run

| Field                        | Value                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                   | First real PR informational smoke review                                                                                              |
| PR                           | `#1`; temporary smoke PR; closed without merge                                                                                        |
| Run ID                       | `28207822252`                                                                                                                         |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207822252`                                            |
| Job ID / URL                 | `83562348328`; `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207822252/job/83562348328`             |
| Event / trigger mode         | `pull_request` / `pull_request-informational`                                                                                         |
| Head SHA / base SHA          | `3f3987c46f37639b1c1b7a56639a088a859ade5e` / `0e5ceb90ed095ffdfda2cf34f3f9ed05f9d56bd3`                                               |
| Head ref / base ref          | `pbe/pr-info-read-model-smoke-20260626` / `main`                                                                                      |
| Source ref / manifest commit | `refs/pull/1/merge` / `b2c664cfe658eaeb08c3bf28e8c8a22eec864fac`                                                                      |
| Changed path categories      | `docs/concept/**` smoke change                                                                                                        |
| Artifact bundle              | Present and reviewed                                                                                                                  |
| Manifest status              | `ci-evidence-pass`                                                                                                                    |
| Evidence level               | `ci-backed`                                                                                                                           |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                  |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                              |
| Aggregate status             | `aggregate-pass`, 2 included slices, 0 warnings / 0 blocking / 0 decision-required                                                    |
| Retained warning visibility  | Present; `retainedWarningsRemainVisible: true`                                                                                        |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                             |
| Failure / noise class        | No failure; docs-only trigger was intentional smoke signal rather than confirmed long-term filter evidence                            |
| Interpretation               | Continue observation. Do not refine filters, discuss enforcement, or broaden validation scope until more real PR signal is collected. |
| Cleanup                      | PR closed without merge; remote smoke branch deleted                                                                                  |

## Future Observation Entry Template

Append future PR informational observations below the baseline entries or in a later section using this template.
Do not rewrite old entries except to add a correction note with date and reason.

```text
### Observation Entry N: <PR # / short description>

PR:
Run ID:
Run URL:
Event / trigger mode:
Head SHA / base SHA:
Head ref / base ref:
Changed path categories:
Artifact bundle presence:
Manifest status / evidence level:
Todo Search validation / parity:
Todo App PBE Run structure-only validation:
Aggregate status:
Warnings / blocking / decision-required:
Retained warning visibility:
Boundary visibility:
Failure / noise classification:
Interpretation:
Recommended follow-up:
Temporary artifact cleanup:
```

## Review Checklist

Use this checklist for each new PR informational run.

1. Confirm run identity:

   ```bash
   gh run view <run-id> --json databaseId,status,conclusion,event,headBranch,headSha,url,jobs
   ```

2. Download artifacts to a temporary directory:

   ```bash
   gh run download <run-id> --name pbe-todo-search-read-model-evidence --dir .tmp/read-model-evidence-pr-run-<run-id>
   ```

3. Inspect the CI manifest and reports:

   - parse `adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json`
   - parse `adoption/todo-search-slice/generated/read-model-validation-report.json`
   - parse `adoption/todo-search-slice/generated/read-model-parity-report.json`
   - parse `valid/todo-app-pbe-run/generated/read-model-validation-report.json`
   - parse `read-model-aggregate/generated/read-model-aggregate-summary.json`

4. Confirm PR metadata exists for PR-triggered runs:

   - `eventName: pull_request`
   - `triggerMode: pull_request-informational`
   - PR number
   - head/base SHA
   - head/base ref

5. Confirm Evidence status:

   - Todo Search validation/parity status
   - Todo App PBE Run structure-only validation status
   - aggregate status and included slice count
   - warning/blocking/decision-required counts
   - retained warnings remain visible

6. Confirm boundary statements:

   - source authority boundary present
   - non-enforcement statement present
   - non-promotion statement present
   - no required-check, branch-protection, source-authority, or user-acceptance implication

7. Classify the run:

   - `continue-observation`
   - `refine-filter-candidate`
   - `fix-workflow-candidate`
   - `escalate-for-user-decision`
   - `true-blocker`

8. Remove downloaded temporary artifacts after review:

   ```bash
   Remove-Item -Recurse -Force .tmp/read-model-evidence-pr-run-<run-id>
   ```

## Changed Path Categories

Record changed paths by category instead of only listing filenames:

| Category              | Examples                                                                                   | Observation use                                                        |
| --------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Workflow              | `.github/workflows/read-model-evidence.yml`                                                | Must keep manual and PR informational boundaries visible.              |
| CLI / read-model core | `cli/src/**`, `scripts/**`                                                                 | High signal; should normally trigger read-model Evidence.              |
| Todo Search slice     | `examples/adoption/todo-search-slice/**`                                                   | High signal for parity-backed scoped pilot Evidence.                   |
| Todo App structure    | `examples/valid/todo-app-pbe-run/**`                                                       | High signal for structure-only profile Evidence.                       |
| Aggregate summary     | `examples/read-model-aggregate/**`                                                         | Useful for aggregate artifact drift; watch for artifact churn.         |
| Concept docs          | `docs/concept/**`                                                                          | Useful while policies are changing; may be noisy after policy settles. |
| Other docs / files    | Files outside current filters or outside the declared graph read-model Evidence boundaries | Use to decide whether filters are too broad or too narrow.             |

## Failure And Noise Classification

| Classification                | Meaning                                                                                        | Default interpretation                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `command-runtime-failure`     | Build, generate, compare, validate, summarize, or test command failed.                         | Workflow or source issue; fix before treating Evidence as pass.         |
| `artifact-integrity-failure`  | Expected artifact is missing, malformed, or internally inconsistent.                           | Blocking for that run; inspect workflow output and manifest generation. |
| `evidence-warning`            | Evidence status warns but commands and artifacts are valid.                                    | Keep visible; may not require workflow failure while non-enforcing.     |
| `decision-required`           | Evidence is valid but needs human judgment before the next authority/enforcement step.         | Record and escalate only after separate user decision.                  |
| `true-blocker`                | Boundary ambiguity, hidden warnings, invalid taxonomy, missing required PR metadata, or drift. | Immediate re-review; do not wait for the observation window.            |
| `noise-or-false-positive`     | Trigger is technically correct but not useful for graph read-model Evidence signal.            | Candidate for later path-filter refinement if repeated.                 |
| `continue-observation-signal` | Run is useful, boundaries are visible, and status remains pass or clearly explained.           | Count toward the observation target.                                    |

## Observation Counter

| Counter                                   | Current value                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Real PR informational runs reviewed       | 1                                                                                                     |
| Manual dispatch runs reviewed after PR CI | 1                                                                                                     |
| Target before filter refinement           | 3 real PR informational runs or 1 week of normal PR flow, unless immediate re-review is triggered.    |
| Enforcement discussion state              | Closed until a separate user decision reopens it.                                                     |
| All-slice validation state                | Contract design only; see [read-model-validate-all-contract.md](read-model-validate-all-contract.md). |

## Decision Thresholds

### Immediate Re-Review Triggers

Re-review before the observation window completes if any of these appear:

- missing PR metadata in the CI manifest
- source-authority, enforcement, required-check, or promotion boundary ambiguity
- hidden retained warnings
- aggregate status `aggregate-blocked` or `decision-required`
- Todo Search parity no longer `comparison-pass`
- Todo App PBE Run appears promoted beyond `structure-only` without a separate decision
- artifact bundle missing or malformed
- repeated command/runtime failure on ordinary PR changes

### Path-Filter Refinement Triggers

Consider path-filter refinement only after enough observation signal exists, or immediately after a clear false-positive
pattern:

- docs/concept-only PRs dominate the sample without useful Evidence drift
- aggregate artifact churn triggers repeated low-value runs
- CLI/script changes are missed by the current filters
- slice source or generated report changes happen outside the current filters
- workflow edits need explicit review signal

### Enforcement Discussion Boundary

Required checks, branch protection, CI enforcement, or `validate --all` discussion remains a separate user decision.
Neither a green PR informational run nor this log can approve enforcement or source promotion.

All-slice validation implementation is governed by
[read-model-validate-all-contract.md](read-model-validate-all-contract.md) and remains separate from this observation
log.

## Gate Self-Check

| Gate                             | Result | Notes                                                                                  |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Append-Only Log Gate             | PASS   | Establishes a repeatable log/runbook for later observations.                           |
| Observation-Only Gate            | PASS   | Does not run Actions, create PRs, or change workflow behavior.                         |
| Non-Enforcement Gate             | PASS   | Required checks, branch protection, and CI enforcement remain out of scope.            |
| Source Authority Boundary Gate   | PASS   | PR Evidence remains Evidence only and does not expand source authority.                |
| Non-Full-Promotion Gate          | PASS   | Full Graph-source promotion remains separate and unapproved.                           |
| Path-Filter Refinement Gate      | PASS   | Defines how to record signal before later filter changes; does not change filters now. |
| Retained Warning Visibility Gate | PASS   | Hidden warnings trigger immediate re-review.                                           |
| Todo App Structure-Only Gate     | PASS   | Todo App PBE Run remains structure-only.                                               |
| User Approval Boundary Gate      | PASS   | PR pass and log entries cannot replace user acceptance or approve enforcement.         |
| Temporary Artifact Hygiene Gate  | PASS   | Downloaded CI artifacts are reviewed from `.tmp/` and then removed.                    |

## Final Statement

This log/runbook records and standardizes observation of future PR informational read-model Evidence runs. It does not
modify the workflow, dispatch GitHub Actions, create PRs, introduce enforcement, expand source authority, approve full
Graph-source promotion, perform public-doc cleanup, or promote Todo App PBE Run beyond `structure-only`.
