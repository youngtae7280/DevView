# Public-Doc Cleanup Implementation Plan

Status: implementation-plan / docs-only / no-public-doc-edits-yet / no-waiver-approved

## Purpose

This plan turns the public-doc cleanup or waiver decision package into a small, staged cleanup implementation plan.

It does not edit public docs. It does not approve a waiver. It does not approve Graph-source promotion, expand source
authority, change workflow behavior, change CLI behavior, or retire tree-native artifacts.

## Cleanup Goal

Before any broader Graph-source promotion approval, public docs should consistently distinguish:

- Product/Project/Work/Test/Evidence/Acceptance Tree authority
- ACEP as Cycle Contract and Node Execution Contract packaging
- task cards as compatibility, execution, or projection views rather than standalone authority
- generated read-model Evidence as Evidence rather than source authority
- CI-backed Evidence as non-enforcing unless a separate required-check decision exists
- Maintainability Graph as a read/alignment model and future source-model candidate until explicit promotion

Cleanup should preserve useful public terminology. The goal is not to erase task-card language; it is to anchor that
language to the current authority model.

## Batch Plan

| Batch   | Scope                          | Likely files                                                                                                        | Goal                                                                                                          |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Batch A | High-signal blocker cleanup    | `docs/source-of-truth-matrix.md`                                                                                    | Remove the strongest task-card authority ambiguity before broader promotion approval.                         |
| Batch B | Task-card shorthand docs       | `README.md`, `docs/acep.md`, `docs/workflow.md`                                                                     | Add consistent contract-packaging and compatibility-view wording where task-card shorthand remains useful.    |
| Batch C | Examples, usage, audit wording | `docs/examples.md`, `docs/usage.md`, `docs/traceability-rules.md`, `docs/ux-auditor.md`, `docs/coverage-auditor.md` | Reframe examples and audit references so task-card terms are projections/views with traceability obligations. |
| Batch D | Optional review-only docs      | `docs/file-format.md`, `AGENTS.md`                                                                                  | Review labels and examples only; edit if future cleanup finds ambiguous authority wording.                    |

Recommended first implementation:

```text
Start with Batch A only, verify, then decide whether Batch B/C should follow in the same cleanup sequence.
```

## Cleanup Wording Principles

1. Do not erase useful task-card compatibility terms.
2. Reframe task cards as projections, views, or execution details under contract authority.
3. Do not claim Graph-source promotion has happened.
4. Do not change product workflow behavior.
5. Do not change CLI commands or documented command syntax unless a separate implementation changes them.
6. Preserve user-facing clarity; public docs should become clearer, not more concept-heavy.
7. Keep generated Evidence and CI Evidence as Evidence, not source authority or user acceptance.
8. Preserve tree-native current source authority until explicit promotion.

## Per-File Suggested Edits

| Path                             | Current risk                                                                                         | Proposed wording direction                                                                                          | Priority | Verification needed                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `docs/source-of-truth-matrix.md` | `ACEP` owns `executable task cards`, which can imply task-card source authority.                     | Change ACEP ownership to Cycle Contract / Node Execution Contract packaging, execution manifest, and bounded scope. | A        | Confirm matrix still separates RPD/WPD/VD/Execution Planner/ACEP responsibilities. |
| `README.md`                      | Diagrams and gate tables still use task-card shorthand despite stronger "not only task cards" text.  | Keep task-card term, but add nearby note that task cards are compatibility/execution views under contracts.         | B        | Confirm quick-start and workflow sections remain readable to new users.            |
| `docs/acep.md`                   | ACEP pack output and runner behavior are centered on task cards.                                     | Add contract-boundary wording: task cards are one projection inside the execution pack.                             | B        | Confirm ACEP runner instructions still make operational sense.                     |
| `docs/workflow.md`               | ACEP Generator writes task cards and source-of-truth references, which can blur authority.           | Clarify generated pack references authority but does not become authority.                                          | B        | Confirm workflow sequence remains unchanged.                                       |
| `docs/examples.md`               | Example execution text says Codex implements task cards.                                             | Keep user-friendly wording but add that task cards derive from contracts and traceability.                          | C        | Confirm examples stay concise.                                                     |
| `docs/usage.md`                  | Usage flow mentions task cards as execution artifacts.                                               | Add compatibility-view note where task cards are introduced.                                                        | C        | Confirm commands and user instructions are unchanged.                              |
| `docs/traceability-rules.md`     | Task cards are treated as traceability units.                                                        | Reframe task-card links as execution-contract projection links.                                                     | C        | Confirm traceability obligations remain complete.                                  |
| `docs/ux-auditor.md`             | UI task-card checks may imply task cards own UI evidence obligations.                                | Clarify task-card sections are checked as contract projections of UI/UX, Work, Test, and Evidence obligations.      | C        | Confirm UX audit coverage remains strict.                                          |
| `docs/coverage-auditor.md`       | Every task card has requirement links; may over-center task cards.                                   | Clarify coverage can be checked through task-card projections but source obligations remain tree/contract linked.   | C        | Confirm coverage audit remains actionable.                                         |
| `docs/file-format.md`            | Mentions task-card paths and compatibility views mostly as layout.                                   | Review only; edit labels if they imply authority.                                                                   | D        | Confirm no layout examples become misleading.                                      |
| `AGENTS.md`                      | Mostly canonical; one visual section mentions ACEP task cards and Node Execution Contracts together. | Optional clarification only if cleanup wants every task-card mention to carry projection wording.                   | D        | Confirm agent instructions remain concise and operational.                         |

## Implementation Sequencing Recommendation

Recommended sequence:

1. Implement Batch A in one small public-doc cleanup commit.
2. Run docs validation and PBE validation.
3. Review whether Batch A resolves the blocker or exposes wording patterns that should be handled in Batch B.
4. Implement Batch B if promotion preparation continues.
5. Implement Batch C only after Batch B wording has stabilized.
6. Treat Batch D as optional review-only cleanup unless a concrete ambiguity is found.

Do not combine cleanup with source authority expansion, workflow changes, or promotion approval.

## Acceptance / Review Criteria

A cleanup commit should pass these checks:

- no source authority expansion is claimed
- no Graph-source promotion is declared
- no behavioral workflow or CLI claims are changed
- no task-card term is removed without replacement explanation when the term remains useful to users
- tree-native current authority remains visible
- generated Evidence and CI Evidence remain Evidence only
- user acceptance remains user-controlled
- docs validation passes
- PBE validation passes

## Remaining Waiver Path

If cleanup is deferred, the waiver path remains available but unapproved.

A future waiver should explicitly state:

- which files or wording classes are waived
- why cleanup is deferred
- what reader-confusion risk is accepted
- whether waiver is temporary or promotion-scope-specific
- what fallback wording should be treated as canonical
- when the waiver must be revisited

Current waiver status:

```text
no-waiver-approved
```

## Non-Scope

This plan does not:

- edit public docs
- implement cleanup
- approve waiver
- expand source authority
- approve Graph-source promotion
- retire tree-native artifacts
- change workflow, code, CLI, tests, or generated artifacts
- create a PR or dispatch GitHub Actions
- add required checks, branch protection, or enforcement
- promote Todo App PBE Run beyond `structure-only`
- replace user acceptance authority
