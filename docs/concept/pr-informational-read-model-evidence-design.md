# PR Informational Read-Model Evidence Design

Status: pr-informational-read-model-evidence-design / implemented / pr-run-reviewed

## Purpose

This document records the pull request informational mode for read-model Evidence.

The implemented workflow now supports manual and PR informational modes:

```text
.github/workflows/read-model-evidence.yml
trigger: workflow_dispatch
trigger: pull_request informational with path filters
```

The design purpose is to define how the `pull_request` trigger provides visible read-model Evidence status on PRs
without making the workflow a required check, branch protection rule, source-authority expansion, or promotion gate.

The PR trigger implementation adds only the non-enforcing PR informational trigger. The workflow later switched its
read-model production step to local registry-backed `validate --all`, but still does not add `push` or `schedule`
triggers, introduce CI enforcement, expand source authority, or approve full Graph-source promotion.

## Current Baseline

| Baseline item                | Current state                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Workflow                     | `PBE Read-Model Evidence`                                                                                     |
| Implemented trigger          | `workflow_dispatch`; `pull_request` informational with path filters                                           |
| Latest reviewed manual run   | `28210541509`                                                                                                 |
| Latest reviewed PR run       | `28210904900`                                                                                                 |
| Latest run status            | `success` / `ci-evidence-pass`                                                                                |
| Todo Search profile          | `todo-search-selected-slice`, `pilot-marker-backed`                                                           |
| Todo Search generated output | 40 nodes / 59 edges                                                                                           |
| Todo Search parity           | `comparison-pass`, 0 blocking, 0 decision-required                                                            |
| Todo Search validation       | `validation-pass`, 20 checks                                                                                  |
| Todo App PBE Run profile     | `todo-app-pbe-run-structure-only`, `structure-only`                                                           |
| Todo App generated output    | 22 nodes / 38 edges                                                                                           |
| Todo App validation          | `validation-pass`, 16 checks                                                                                  |
| Aggregate summary            | `aggregate-pass`, 2 slices, 0 warning / 0 blocking / 0 decision-required                                      |
| Workflow runtime             | Node 24 action/runtime settings reviewed in run `28157938343`; validate-all PR mode reviewed in `28210904900` |
| Authority boundary           | CI-backed Evidence is Evidence only; no source authority expansion, enforcement, or promotion approval        |

## Mode Comparison

| Mode                                     | Trigger                | Purpose                                                | Current status | Enforcement boundary                                                |
| ---------------------------------------- | ---------------------- | ------------------------------------------------------ | -------------- | ------------------------------------------------------------------- |
| Manual CI-backed Evidence                | `workflow_dispatch`    | Reviewer-requested Evidence run tied to a known commit | implemented    | Non-enforcing; not a required check or user approval.               |
| PR informational read-model Evidence     | `pull_request`         | Visible PR signal for read-model Evidence drift        | implemented    | Informational only unless enforcement is separately approved later. |
| PR required check / branch protection    | required PR check      | Merge-blocking policy                                  | future-only    | Requires separate explicit user approval and warning/waiver policy. |
| Push or scheduled post-merge observation | `push` or `schedule`   | Main branch audit trail or drift observation           | future-only    | Evidence only unless separately approved as enforcement.            |
| Repo-wide promotion readiness validation | later validator policy | Full promotion review support                          | future-only    | Cannot approve source promotion without explicit user decision.     |

## Implemented PR Informational Trigger

Implemented trigger:

```yaml
on:
  pull_request:
    paths:
      - '.github/workflows/read-model-evidence.yml'
      - 'cli/src/**'
      - 'scripts/**'
      - 'examples/adoption/todo-search-slice/**'
      - 'examples/valid/todo-app-pbe-run/**'
      - 'examples/read-model-aggregate/**'
      - 'docs/concept/**'
```

This trigger is informational only. It is not a required check, branch protection rule, merge gate, source-authority
expansion, or promotion gate.

### Trigger Scope Tradeoff

| Path candidate                              | Why include it                                                   | Noise risk                                                    | Drift risk if excluded                                        | Recommendation                                                   |
| ------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `.github/workflows/read-model-evidence.yml` | Workflow changes directly affect CI-backed Evidence.             | Low.                                                          | High: workflow changes could break Evidence runs silently.    | Include.                                                         |
| `cli/src/**`                                | Read-model generate/compare/validate/summarize code lives here.  | Medium if unrelated CLI internals change.                     | High: graph Evidence behavior can drift.                      | Include.                                                         |
| `scripts/**`                                | PBE validation and support validators can affect Evidence trust. | Medium/high because many scripts are not read-model-specific. | Medium: validator/root behavior can affect reported Evidence. | Include initially; revisit if noisy.                             |
| `examples/adoption/todo-search-slice/**`    | Primary pilot-backed slice and manual parity source.             | Low/medium.                                                   | High: primary Evidence inputs could drift.                    | Include.                                                         |
| `examples/valid/todo-app-pbe-run/**`        | Second structure-only profile input/output.                      | Low/medium.                                                   | Medium/high: second slice aggregate status could drift.       | Include.                                                         |
| `examples/read-model-aggregate/**`          | Aggregate summary output contract and committed artifact.        | Low.                                                          | Medium: aggregate output/contract changes could drift.        | Include.                                                         |
| `docs/concept/**`                           | Source-boundary and policy docs define Evidence semantics.       | High for unrelated concept edits.                             | Medium: boundary wording can drift without signal.            | Include in first informational design; consider narrowing later. |

Recommended first PR informational path policy:

```text
Use the path set above for an initial informational design, then review noise after several PRs before considering
required checks or narrower paths.
```

Reasoning:

- The first PR mode should prefer catching read-model Evidence drift over minimizing every informational run.
- Because it is non-enforcing, occasional extra runs are acceptable.
- If concept-doc changes become too noisy, later refinement can split doc-only status summaries from full generated
  Evidence runs.

## Future Command Sequence

The PR informational mode reuses the current aggregate-enabled command sequence:

```text
npm run build:cli
node dist/cli/index.js graph read-model generate --slice examples/adoption/todo-search-slice --json
node dist/cli/index.js graph read-model compare --generated examples/adoption/todo-search-slice/generated/generated-read-model.json --manual examples/adoption/todo-search-slice/maintainability-graph-read-model.json --json
node dist/cli/index.js graph read-model validate --slice examples/adoption/todo-search-slice --json
node dist/cli/index.js graph read-model generate --slice examples/valid/todo-app-pbe-run --json
node dist/cli/index.js graph read-model validate --slice examples/valid/todo-app-pbe-run --json
node dist/cli/index.js graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run --json
npx vitest run cli/src/__tests__/read-model-evidence.test.ts
npx vitest run examples/adoption/todo-search-slice/runtime-fixture
npm run validate:pbe
npm run validate:pbe:v2
```

It should not run `validate --all`, should not regenerate source/manual parity artifacts outside the declared output
directories, and should not mutate PR source files.

## Artifact And Manifest Policy

The PR informational run currently reuses the same artifact bundle content and writes trigger-specific metadata in the
CI evidence manifest.

Current artifact upload remains `pbe-todo-search-read-model-evidence` for compatibility with the existing reviewed
manual workflow. The manifest distinguishes `workflow_dispatch` from `pull_request-informational`.

Required artifact content should match the current manual bundle:

- Todo Search generated read-model JSON/Markdown
- Todo Search parity report JSON/Markdown
- Todo Search validation report JSON/Markdown
- Todo Search CI/PR evidence manifest
- Todo Search scoped pilot marker
- Todo App PBE Run generated read-model JSON/Markdown
- Todo App PBE Run validation report JSON/Markdown
- aggregate summary JSON/Markdown

PR manifest fields:

| Field group         | Candidate fields                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Trigger identity    | `triggerMode: pull_request-informational`, workflow name, run id, run attempt, source ref.         |
| PR identity         | PR number, head SHA, base SHA, head ref, base ref, repository owner/name.                          |
| Included slices     | Todo Search and Todo App PBE Run paths.                                                            |
| Todo Search status  | validator status, parity status, check count, node count, edge count.                              |
| Todo App status     | validator status, parity `not-required`, check count, node count, edge count.                      |
| Aggregate status    | aggregate status, included slice count, warning/blocking/decision-required counts.                 |
| Boundary statements | non-enforcement statement, non-promotion statement, source authority boundary, user approval note. |
| Retained warnings   | retained warnings remain visible, public-doc cleanup deferred, PR mode is not acceptance.          |
| Artifact references | generated/parity/validation/aggregate paths.                                                       |

The manifest should not claim source authority, approval, promotion readiness approval, or branch-protection status.

## Step Summary Candidate

PR step summary wording:

```text
# PBE Read-Model Evidence - PR Informational

- Trigger mode: pull_request-informational
- PR: <number>
- Head SHA: <head>
- Base SHA: <base>
- Todo Search: validation-pass / comparison-pass
- Todo App PBE Run: validation-pass / parity not-required
- Aggregate: aggregate-pass
- Boundary: informational Evidence only.
- Not a required check, branch protection rule, source authority change, user acceptance, or Graph-source promotion.
- Retained warnings remain visible in generated reports.
```

If status is warning, blocked, or decision-required, the summary should name the originating slice and the report path.

## Failure Semantics

PR informational mode has a subtle UI risk: a failed GitHub job appears red in the PR even when the workflow is not a
required check.

Candidate semantics:

| Strategy                                                       | Pros                                                                         | Cons                                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Fail job for any Evidence warning/blocking/decision-required   | Very visible; hard to miss.                                                  | Looks enforcement-like; can pressure merges even without branch protection.              |
| Always succeed job and report all Evidence statuses in summary | Clearly non-enforcing; avoids PR red status for reviewable warnings.         | Real command failures could be hidden if not separated carefully.                        |
| Fail only on command/runtime/artifact integrity failure        | Separates CI health from Evidence judgment; keeps PR warnings informational. | Requires clear summary/status labels so warning/decision-required states are not missed. |

Recommended first PR informational semantics:

```text
Fail the job only for real command/runtime/artifact integrity failures.
Keep Evidence statuses such as aggregate-warning, decision-required, or retained warnings visible in the manifest and
step summary without treating them as merge enforcement.
```

Details:

- Command failure, missing required output, malformed JSON, or validator process error should fail the job.
- `validation-blocked`, `aggregate-blocked`, or `decision-required` should be made highly visible in the summary.
- Whether those Evidence statuses should fail the job is a later enforcement-policy decision.
- Retained warnings should never be hidden to make PR status green.
- CI pass or PR informational pass is not user acceptance and does not change source authority.

## Relationship To Gates

| Gate / boundary        | PR informational relationship                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Evidence gate          | Adds a visible PR signal, but does not replace manual run review or user judgment.             |
| Authority gate         | No source authority expansion. Todo Search remains the only scoped pilot.                      |
| Rollback/fallback gate | Can surface missing fallback references, but does not execute rollback or retire artifacts.    |
| Compatibility gate     | Carries public-doc cleanup and compatibility warnings; does not resolve them.                  |
| Approval gate          | CI/PR pass is Evidence only and cannot approve acceptance or promotion.                        |
| Enforcement gate       | Not introduced. Required checks and branch protection require separate explicit user approval. |

## Explicit Non-Scope

This design does not:

- modify `.github/workflows/read-model-evidence.yml`
- add `pull_request`, `push`, or `schedule` triggers
- add a required check, branch protection rule, or enforcement mode
- implement `validate --all`
- expand source authority
- make Todo App PBE Run parity-backed, pilot-marker-backed, CI-backed, or authority-bearing
- approve full Graph-source promotion
- perform public-doc cleanup
- retire tree-native or `.pbe` artifacts
- make CI pass equivalent to user acceptance

## Reviewed PR Informational Runs

The first real PR informational run and the first validate-all-centered PR informational run are reviewed in
[ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md).

| Field        | PR #1 observed value                                                                    | PR #2 observed value                                                                                      |
| ------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| PR           | `#1`, temporary smoke PR closed without merge                                           | `#2`, draft temporary smoke PR closed without merge                                                       |
| Run ID       | `28207822252`                                                                           | `28210904900`                                                                                             |
| Event        | `pull_request`                                                                          | `pull_request`                                                                                            |
| Trigger mode | `pull_request-informational`                                                            | `pull_request-informational`                                                                              |
| Source mode  | explicit workflow command sequence                                                      | `registry-backed validate-all`                                                                            |
| Result       | `success` / `ci-evidence-pass`                                                          | `success` / `ci-evidence-pass`, `validateAllStatus: aggregate-pass`                                       |
| Cleanup      | temporary PR closed without merge; remote smoke branch deleted                          | temporary PR closed without merge; remote smoke branch deleted                                            |
| Boundary     | informational only; no required check, branch protection, enforcement, or source change | informational only; no required check, branch protection, enforcement, source change, or promotion change |

## Recommended Next Decision Surface

The observation policy for this implemented trigger is recorded in
[pr-informational-observation-policy.md](pr-informational-observation-policy.md).
The append-only observation log and review runbook for future PR runs is recorded in
[pr-informational-observation-log.md](pr-informational-observation-log.md).

After this implementation, first PR run review, validate-all PR run review, and observation-policy definition, the next
choices are:

1. `Keep PR informational mode non-enforcing and observe`
2. `Refine PR path filters after observing more PRs`
3. `Design CI enforcement / required check policy`
4. `Require public-doc cleanup before broader CI changes`
5. `Defer PR-trigger work`

Recommended next step:

```text
Keep PR informational mode non-enforcing and observe according to the observation policy before deciding whether path
filters, artifact naming, or failure semantics need adjustment. Do not move to enforcement without a separate decision.
```

The implementation adds `pull_request` as informational only and uses the recommended path filters and failure semantics
above. It does not make the check required.

## Gate Self-Check

| Gate                                  | Result | Notes                                                                         |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Design / Implementation Boundary Gate | PASS   | Only the non-enforcing PR informational trigger is implemented.               |
| Manual Workflow Preservation Gate     | PASS   | `workflow_dispatch` remains available.                                        |
| PR Informational Boundary Gate        | PASS   | PR mode is explicitly non-enforcing and not branch protection.                |
| Source Authority Boundary Gate        | PASS   | No source authority expansion or Todo App promotion level change is proposed. |
| Non-Full-Promotion Gate               | PASS   | Full Graph-source promotion remains separate and unapproved.                  |
| Artifact / Manifest Clarity Gate      | PASS   | Candidate PR manifest fields and artifact bundle are defined.                 |
| Failure Semantics Honesty Gate        | PASS   | Real command failures and Evidence judgment statuses are separated.           |
| Retained Warning Visibility Gate      | PASS   | Warnings remain visible and are not hidden behind PR green status.            |
| User Approval Boundary Gate           | PASS   | PR informational pass cannot replace user acceptance or promotion approval.   |

## Final Statement

PR informational read-model Evidence is a CI visibility layer, not an enforcement layer. The implementation preserves
manual dispatch, source authority, promotion, public-doc cleanup, and user acceptance boundaries. The first smoke PR run
is reviewed as successful non-enforcing Evidence.
