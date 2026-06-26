# Public-Doc Cleanup Implementation Plan

Status: implementation-plan / batch-a-b-c-implemented / batch-d-reviewed-implemented-if-needed / no-waiver-approved

## Purpose

This plan turns the public-doc cleanup or waiver decision package into a small, staged cleanup implementation plan.

Batch A is now implemented in `docs/source-of-truth-matrix.md`, Batch B is now implemented in `README.md`,
`docs/acep.md`, and `docs/workflow.md`, Batch C is now implemented in the examples, usage, traceability, and audit
docs, and optional Batch D has now been reviewed. Batch D required one small `AGENTS.md` wording clarification and no
`docs/file-format.md` edit. This plan still does not approve a waiver, Graph-source promotion, source authority
expansion, workflow behavior changes, CLI behavior changes, or tree-native artifact retirement.

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

| Batch   | Scope                          | Likely files                                                                                                        | Goal                                                                                                                                                                   |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Batch A | High-signal blocker cleanup    | `docs/source-of-truth-matrix.md`                                                                                    | Implemented: ACEP no longer owns `executable task cards`; task cards are framed as execution/compatibility views.                                                      |
| Batch B | Task-card shorthand docs       | `README.md`, `docs/acep.md`, `docs/workflow.md`                                                                     | Implemented: task-card shorthand is retained but framed as execution/compatibility views under contract authority.                                                     |
| Batch C | Examples, usage, audit wording | `docs/examples.md`, `docs/usage.md`, `docs/traceability-rules.md`, `docs/ux-auditor.md`, `docs/coverage-auditor.md` | Implemented: examples, usage, traceability, and audit wording now frame task cards as projections/views/carriers.                                                      |
| Batch D | Optional review-only docs      | `docs/file-format.md`, `AGENTS.md`                                                                                  | Reviewed: `AGENTS.md` now frames visual task-card wording as task-card views that project Node Execution Contract obligations; `docs/file-format.md` required no edit. |

Batch A/B/C/D implementation result:

```text
Batch A, Batch B, and Batch C implemented and ready for review. Batch D reviewed and implemented only where needed.
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

| Path                             | Current risk                                                                                                                | Proposed wording direction                                                                                         | Priority | Verification needed                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------- |
| `docs/source-of-truth-matrix.md` | Resolved in Batch A: `ACEP` no longer owns `executable task cards`; task cards are framed as execution/compatibility views. | Review the new ACEP ownership as Cycle Contract / Node Execution Contract packaging, manifest, and evidence rules. | A        | Confirm matrix still separates RPD/WPD/VD/Execution Planner/ACEP responsibilities. |
| `README.md`                      | Resolved in Batch B: diagrams and gate tables now frame task cards as execution views under contracts.                      | Review task-card view wording for readability and confirm quick-start/workflow meaning is unchanged.               | B        | Confirm quick-start and workflow sections remain readable to new users.            |
| `docs/acep.md`                   | Resolved in Batch B: ACEP output and runner behavior now describe task cards as compatibility/execution views.              | Review contract-boundary wording and confirm ACEP runner instructions still make operational sense.                | B        | Confirm ACEP runner instructions still make operational sense.                     |
| `docs/workflow.md`               | Resolved in Batch B: ACEP Generator now writes task-card views and states they are projections under contract authority.    | Review generated-pack wording and confirm source-of-truth references do not become authority.                      | B        | Confirm workflow sequence remains unchanged.                                       |
| `docs/examples.md`               | Resolved in Batch C: example execution now uses task-card views and selected-scope execution language.                      | Review that examples remain user-friendly and not concept-heavy.                                                   | C        | Confirm examples stay concise.                                                     |
| `docs/usage.md`                  | Resolved in Batch C: usage flow now introduces task-card views as contract-obligation carriers.                             | Review commands and user instructions for unchanged behavior.                                                      | C        | Confirm commands and user instructions are unchanged.                              |
| `docs/traceability-rules.md`     | Resolved in Batch C: task-card views now carry IDs as projections of WorkGraph and execution-contract obligations.          | Review traceability wording and confirm ownership remains with source artifacts.                                   | C        | Confirm traceability obligations remain complete.                                  |
| `docs/ux-auditor.md`             | Resolved in Batch C: UI task-card view checks now verify projected UI/UX obligations without granting authority.            | Review strict UX audit coverage.                                                                                   | C        | Confirm UX audit coverage remains strict.                                          |
| `docs/coverage-auditor.md`       | Resolved in Batch C: coverage checks now treat task-card views as traceability carriers, not source authority.              | Review strict coverage audit behavior.                                                                             | C        | Confirm coverage audit remains actionable.                                         |
| `docs/file-format.md`            | Reviewed in Batch D: mentions task-card paths only as file layout.                                                          | No public-doc edit needed.                                                                                         | D        | Confirm layout examples remain non-authoritative.                                  |
| `AGENTS.md`                      | Resolved in Batch D: visual task-card wording now says task-card views project Node Execution Contract obligations.         | Review that agent instructions remain concise and operational.                                                     | D        | Confirm operational meaning is unchanged.                                          |

## Implementation Sequencing Recommendation

Recommended sequence:

1. Review Batch A, Batch B, Batch C, and Batch D wording and confirm they resolve the strongest authority ambiguities.
2. Keep any remaining public-doc cleanup or waiver question as an explicit promotion-decision caveat, not an implicit
   approval.

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

- approve waiver
- expand source authority
- approve Graph-source promotion
- retire tree-native artifacts
- change workflow, code, CLI, tests, or generated artifacts
- create a PR or dispatch GitHub Actions
- add required checks, branch protection, or enforcement
- promote Todo App PBE Run beyond `structure-only`
- replace user acceptance authority
