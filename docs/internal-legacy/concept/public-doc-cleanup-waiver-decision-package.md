# Public-Doc Cleanup Or Waiver Decision Package

Status: decision-package / batch-a-b-c-implemented / batch-d-reviewed-implemented-if-needed / no-waiver-approved

## Purpose

This package prepares the public-doc cleanup or explicit waiver decision that must be addressed before broader
Graph-source promotion approval can be considered.

The broader promotion review inputs currently classify public-doc cleanup as a caveat because some public-facing docs
still use legacy or shorthand wording around task cards, source-of-truth matrices, compatibility views, and authority
boundaries. Those docs are useful historical and user-facing material, but before any full Graph-source promotion they
must either be cleaned up or explicitly waived by the user.

Batch A cleanup has now edited `docs/source-of-truth-matrix.md` to remove the strongest ACEP task-card authority
ambiguity. Batch B cleanup has now edited `README.md`, `docs/acep.md`, and `docs/workflow.md` to frame task-card
shorthand as execution/compatibility views under contract authority. Batch C cleanup has now edited examples, usage,
traceability, and audit docs to frame task-card wording as projections, views, or traceability carriers. Batch D review
found `docs/file-format.md` safe as layout-only wording and clarified one `AGENTS.md` visual task-card sentence as a
task-card view projection of Node Execution Contract obligations. This package still does not approve a waiver, change
source authority, approve Graph-source promotion, add enforcement, or retire tree-native artifacts.

## Why This Matters Before Broader Promotion

Graph-source promotion would change which model is treated as source authority. If public docs still imply that ACEP,
task cards, compatibility views, generated Evidence, or read-model artifacts own execution or product truth, reviewers
could misunderstand the authority boundary.

Public-doc cleanup or explicit waiver is needed to keep these distinctions visible:

- Product/Project/Work/Test/Evidence/Acceptance trees remain current operational source until explicit promotion.
- Maintainability Graph is a read/alignment model and future source-model candidate, not automatically current source.
- ACEP packages Cycle Contracts, Node Execution Contracts, traceability, validation, and evidence obligations; task
  cards are compatibility/execution views, not standalone authority.
- Generated read-model Evidence is Evidence, not source authority by itself.
- CI-backed Evidence is non-enforcing unless a separate required-check/enforcement decision is approved.

## Inventory Categories

| Category                                 | Meaning                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Safe / no action needed                  | Wording already states tree-native source authority, compatibility-view status, or contract-not-task-card boundary. |
| Cleanup candidate before promotion       | Wording could be read as legacy authority or task-card authority and should be corrected before promotion approval. |
| Explicit waiver candidate                | Wording may be acceptable to defer only if the user explicitly accepts the residual confusion risk.                 |
| Concept-only retained historical context | `docs/concept/**` records transition history and warnings; do not treat it as public cleanup target by default.     |

## Public / Compatibility-Sensitive Inventory

The inventory below is based on a quick scan of `README.md`, `AGENTS.md`, `docs/index.md`, and public `docs/*.md`.
`docs/concept/**` is intentionally separated as concept record material.

| Path / group                                     | Category                               | Wording risk                                                                                                                                                                                                                                                                    | Recommended action                                                             | Blocking for promotion approval?        |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| `docs/source-of-truth-matrix.md`                 | Batch A implemented / review candidate | Previously said `ACEP` owned `executable task cards`, which could be read as task-card source authority. Batch A now reframes ACEP as Cycle Contract / Node Execution Contract packaging, manifest, and evidence rules, and frames task cards as execution/compatibility views. | Review Batch A wording; no waiver is approved by the cleanup.                  | Review still required before promotion. |
| `README.md` task-card references                 | Batch B implemented / review candidate | Diagrams and module tables now frame task cards as task-card views under execution contracts.                                                                                                                                                                                   | Review readability; no waiver is approved by the cleanup.                      | Review still required before promotion. |
| `docs/acep.md`                                   | Batch B implemented / review candidate | ACEP output, autonomy, and runner wording now describe task cards as compatibility/execution views inside the execution pack.                                                                                                                                                   | Review runner clarity; no waiver is approved by the cleanup.                   | Review still required before promotion. |
| `docs/workflow.md`                               | Batch B implemented / review candidate | ACEP Generator and Runner wording now says task-card views are projections under Cycle Contract and Node Execution Contract authority.                                                                                                                                          | Review workflow clarity; no waiver is approved by the cleanup.                 | Review still required before promotion. |
| `docs/examples.md`, `docs/usage.md`              | Batch C implemented / review candidate | Examples and usage now use task-card views and contract-obligation carrier language while preserving user-facing flow.                                                                                                                                                          | Review readability; no waiver is approved by the cleanup.                      | Review still required before promotion. |
| `docs/traceability-rules.md`                     | Batch C implemented / review candidate | Traceability rules now say task-card views carry IDs as projections of WorkGraph and execution-contract obligations.                                                                                                                                                            | Review traceability strictness; no waiver is approved by the cleanup.          | Review still required before promotion. |
| `docs/ux-auditor.md`, `docs/coverage-auditor.md` | Batch C implemented / review candidate | Audit wording now treats task-card views as strict projection/traceability-carrier checks, not source authority.                                                                                                                                                                | Review audit strictness; no waiver is approved by the cleanup.                 | Review still required before promotion. |
| `docs/file-format.md`                            | Batch D reviewed / no action needed    | Mentions compatibility views and task-card paths only as file layout.                                                                                                                                                                                                           | No edit needed; keep as layout reference, not source authority.                | No.                                     |
| `AGENTS.md`                                      | Batch D implemented / review candidate | Current instructions define ACEP as Cycle Contract and Node Execution Contract packaging; visual task-card wording now says task-card views project Node Execution Contract obligations.                                                                                        | Review operational clarity; no waiver is approved by the cleanup.              | Review still required before promotion. |
| `docs/project-blueprint-engine-plugin.md`        | Safe / no action needed                | Explicitly says PBE generates an execution contract, not just task cards.                                                                                                                                                                                                       | Use as model wording for cleanup.                                              | No.                                     |
| `docs/tree-model.md`, `docs/core-concepts.md`    | Safe / no action needed                | Public architecture docs emphasize tree-native source/control model.                                                                                                                                                                                                            | Keep as canonical public wording.                                              | No.                                     |
| `docs/concept/**`                                | Concept-only retained context          | Contains historical decisions, warnings, and transition records by design.                                                                                                                                                                                                      | Do not clean as public docs unless a later concept-archive policy is approved. | No for this package.                    |

## Wording Risk Classes

| Risk class                             | Example signal                                                          | Cleanup intent                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Legacy 5 Layer framing                 | Older explanatory layering treated as active architecture.              | Reframe as historical/compatibility explanation if present in public docs.     |
| Task-card authority wording            | ACEP or task cards described as owning executable work.                 | Reframe ACEP as contract packaging; task cards as projections/views.           |
| Tree-native vs graph-source ambiguity  | Docs imply graph/read-model is current source before promotion.         | State tree-native artifacts remain operational source until explicit approval. |
| Compatibility view authority ambiguity | `.pbe/blueprint/*` or execution-pack files treated as current source.   | Mark compatibility views as derived/reference artifacts.                       |
| Generated Evidence/source ambiguity    | Generated reports or CI pass treated as source authority or acceptance. | State generated and CI-backed outputs are Evidence only.                       |

## Recommended Default

Recommended default:

```text
Prepare public-doc cleanup before actual full Graph-source promotion unless the user explicitly approves a waiver.
```

Do not treat waiver as implicit. A future waiver must name the docs or wording classes being deferred, the confusion
risk accepted, the duration or review point for the waiver, and the fallback wording readers should use.

## Waiver Decision Surface

If cleanup is deferred, the user would need to explicitly accept:

| Waiver item                     | User would accept                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Residual task-card shorthand    | Some public docs may still mention task cards even though authority is contract/tree/graph-bound.  |
| Compatibility-view wording risk | Some older artifacts may remain visible as compatibility views during transition.                  |
| Reader confusion risk           | Users may need to read concept docs or compatibility notes to understand current authority.        |
| Promotion caveat visibility     | The waiver must remain visible in the broader promotion decision package and post-promotion notes. |
| Later cleanup obligation        | Cleanup remains deferred, not resolved, unless a later user decision retires the obligation.       |

Suggested waiver label if approved later:

```text
public-doc-cleanup-waived-for-broader-promotion-with-visible-caveat
```

Current waiver status:

```text
no-waiver-approved
```

## Implementation Plan

The cleanup implementation plan is recorded in
[public-doc-cleanup-implementation-plan.md](public-doc-cleanup-implementation-plan.md). Batch A, Batch B, Batch C, and
Batch D are implemented or reviewed as candidates. Batch D required only the `AGENTS.md` wording clarification above,
and no waiver is approved.

The related source-authority expansion design input is recorded in
[source-authority-expansion-design-package.md](source-authority-expansion-design-package.md). That package defines the
candidate authority matrix for future review but does not approve waiver, source authority expansion, or promotion.

## Non-Scope

This package does not:

- approve an explicit waiver
- expand source authority
- approve Graph-source promotion
- retire tree-native artifacts
- change workflow, code, CLI, tests, or generated artifacts
- create a PR or dispatch GitHub Actions
- add required checks, branch protection, or enforcement
- promote Todo App DevView Run beyond `structure-only`
- replace user acceptance authority
