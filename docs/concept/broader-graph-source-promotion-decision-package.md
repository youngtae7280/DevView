# Broader Graph-Source Promotion Decision Package

Status: decision-package-used / limited-promotion-executed / repo-wide-promotion-not-executed

## Purpose

This package collected the matured Graph/read-model Evidence stack, public-doc cleanup status, candidate authority
matrix, and rollback/fallback plan into one user decision surface.

The user subsequently selected the limited promotion branch. The execution record is
[broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md).

This package still does not execute repo-wide Graph-source promotion. It does not retire tree-native artifacts, change
workflow behavior, add enforcement, regenerate Evidence, or replace user acceptance.

Readiness label:

```text
promotion-decision-package-ready / preparation-complete-with-user-decision-required
```

Original meaning:

```text
pre-promotion preparation package is complete; actual promotion remains blocked on explicit user approval
```

Current decision outcome:

```text
approve limited Graph-source promotion execution
```

## Current State

| Field                      | Value                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Preparation state          | `preparation-complete`                                                                                                    |
| Decision surface state     | `decision-used`                                                                                                           |
| Promotion execution        | `limited-promotion-executed`                                                                                              |
| Current operational source | Maintainability Graph for promoted Todo Search selected-slice scope; tree-native artifacts elsewhere.                     |
| Candidate source model     | Maintainability Graph is promoted only for the bounded execution-record scope and remains candidate/read-model elsewhere. |
| User approval boundary     | Codex, CI, validators, generated reports, and aggregate summaries still cannot self-approve further authority changes.    |

## Evidence Inventory

| Evidence / preparation area             | Reviewable inputs                                                                                                                                                                                                | Decision-package interpretation                                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo Search scoped pilot                | `limited-pilot-transition-record.md`, `scoped-source-authority-pilot-execution-record.md`, `scoped-source-authority-pilot-review.md`, `scoped-source-authority-pilot-active-observation.md`                      | Bounded pilot is executed, reviewed, and active under observation for Todo Search only. It is not repo-wide source authority.                                    |
| Generated/manual parity Evidence        | Todo Search generated read-model, manual read-model, parity report, and evidence manifest under `examples/internal-legacy/adoption/todo-search-slice/generated/`                                                 | Current Todo Search parity remains `comparison-pass` with zero mismatch/blocking/decision-required counts.                                                       |
| Validator-backed Evidence               | Todo Search validation report and Todo App DevView Run structure-only validation report                                                                                                                          | Todo Search remains `validation-pass` with 40 nodes / 59 edges / 20 checks; Todo App DevView Run remains `validation-pass` with 22 nodes / 38 edges / 16 checks. |
| Registry-backed `validate --all`        | `examples/internal-legacy/read-model-aggregate/read-model-slices.json` and local `devview graph read-model validate --all`                                                                                       | Positive registry includes only Todo Search and Todo App DevView Run. It is non-enforcing Evidence, not source authority.                                        |
| Aggregate summary                       | `examples/internal-legacy/read-model-aggregate/generated/read-model-aggregate-summary.json` and `.md`                                                                                                            | Current aggregate status is `aggregate-pass` over 2 slices with warning/blocking/decision-required 0/0/0 and retained warnings visible.                          |
| Manual CI-backed runs                   | Runs `28151296796`, `28156403793`, `28157938343`, `28210541509`                                                                                                                                                  | Reviewed manual CI-backed Evidence is repeatable and non-enforcing.                                                                                              |
| PR informational runs #1/#2/#3          | PR #1 run `28207822252`, PR #2 run `28210904900`, PR #3 run `28213236499`                                                                                                                                        | Three real PR informational runs reviewed as `ci-evidence-pass`; path-filter refinement recommends no workflow change for now.                                   |
| Durable/local negative fixture coverage | `examples/invalid/read-model-invalid-view-scoped-tags`, `examples/invalid/read-model-core-view-missing`, `examples/invalid/read-model-pilot-marker-missing`, inline/temp structure-only policy conflict coverage | Negative fixtures are local focused test inputs only. They are not in positive registry, validate-all aggregate, or CI.                                          |
| Public-doc cleanup Batch A/B/C/D        | `docs/source-of-truth-matrix.md`, `README.md`, execution-pack docs, `docs/workflow.md`, examples/usage/traceability/audit docs, `docs/file-format.md` review, and `AGENTS.md` clarification where needed         | Batch A/B/C are implemented as review candidates; Batch D is reviewed and implemented only where needed; no waiver is approved.                                  |
| Source-authority expansion design       | [source-authority-expansion-design-package.md](source-authority-expansion-design-package.md)                                                                                                                     | Candidate authority roles, artifact-family matrix, staged path, and risks are documented without execution.                                                      |
| Rollback/fallback plan                  | [source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md)                                                                                                                         | Fallback precedence, rollback triggers/actions, snapshot/reference requirements, and retirement guardrails are documented without rollback execution.            |

## Decision Options

The user can choose one of these next branches. Any execution requires a later scoped implementation step after the
choice is explicit.

| Option                                                       | Meaning                                                                                                                                   | Immediate effect if selected                                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Approve limited Graph-source promotion                       | Approve a bounded source authority change under the reviewed candidate authority matrix and rollback/fallback plan.                       | Selected and executed in [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md). |
| Continue observation                                         | Keep the scoped pilot, registry-backed validate-all, manual CI, PR informational CI, and local negative fixtures as observation surfaces. | No source authority change; keep current workflow and registry boundaries.                                                         |
| Request revisions to authority matrix / rollback plan / docs | Ask for specific revisions before any approval branch is eligible.                                                                        | Update the relevant concept package and rerun docs validation.                                                                     |
| Defer or rollback scoped pilot                               | Stop broader promotion preparation or move the Todo Search scoped pilot back toward fallback/reference-only status.                       | Prepare a separate defer/rollback decision record before any state-changing action.                                                |
| Design enforcement/required-check policy separately          | Keep source authority decisions separate while exploring whether read-model Evidence should ever become a required check.                 | Create a separate enforcement design surface only; no branch protection or required check is added here.                           |

## Recommended Default

Historical recommended default before the user selected a branch:

```text
decision-ready; wait for explicit user choice
```

Current status:

```text
limited branch executed; further repo-wide promotion still requires a separate user choice
```

## User Approval Language

Use this boundary for any follow-up:

```text
Codex, CI, validators, generated reports, aggregate summaries, and successful PR runs cannot self-approve Graph-source
promotion or source authority expansion. The user must explicitly approve any authority change, artifact retirement,
enforcement change, waiver, defer decision, or rollback decision.
```

## Explicit Non-Scope

This decision package and its limited execution do not:

- execute repo-wide Graph-source promotion
- expand source authority beyond the Todo Search selected-slice execution scope
- retire tree-native artifacts
- change workflow behavior, code, CLI behavior, tests, generated artifacts, registry entries, or examples
- regenerate or commit generated artifacts
- add required checks, branch protection, CI enforcement, push triggers, or schedule triggers
- add invalid fixtures to CI or the positive validate-all registry
- promote Todo App DevView Run beyond `structure-only`
- approve a public-doc cleanup waiver
- replace user acceptance with CI, validation, generated Evidence, or Codex judgment

## Post-Preparation Work

After this package, remaining work is not preparation by default. The first decision-dependent execution branch has now
run:

| If the user chooses...                   | Next work should be...                                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Approve limited promotion                | Executed by [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md). |
| Continue observation                     | Keep recording manual/PR runs and retained warnings without changing workflow, authority, or registry.                |
| Request revisions                        | Revise the named package, rerun docs validation, and return to this decision surface.                                 |
| Defer or rollback scoped pilot           | Prepare defer/rollback records and preserve tree-native fallback/reference authority.                                 |
| Design enforcement/required-check policy | Create a separate non-executing enforcement policy design; do not couple it to promotion approval.                    |

## Final Preparation Statement

The pre-promotion preparation package was completed for user judgment and the user selected the limited promotion
branch.

The limited branch is now executed for Todo Search selected-slice authority only.

It is not a repo-wide `promotion executed` claim, not tree-native artifact retirement, not enforcement approval, and not
a replacement for user acceptance.
