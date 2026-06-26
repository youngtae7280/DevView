# Public-Doc Cleanup Or Waiver Decision Package

Status: decision-package / docs-only / no-cleanup-implemented / no-waiver-approved

## Purpose

This package prepares the public-doc cleanup or explicit waiver decision that must be addressed before broader
Graph-source promotion approval can be considered.

The broader promotion review inputs currently classify public-doc cleanup as a caveat because some public-facing docs
still use legacy or shorthand wording around task cards, source-of-truth matrices, compatibility views, and authority
boundaries. Those docs are useful historical and user-facing material, but before any full Graph-source promotion they
must either be cleaned up or explicitly waived by the user.

This package does not edit public docs, approve a waiver, change source authority, approve Graph-source promotion, add
enforcement, or retire tree-native artifacts.

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

| Path / group                                     | Category                           | Wording risk                                                                                                                      | Recommended action                                                                      | Blocking for promotion approval?       |
| ------------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| `docs/source-of-truth-matrix.md`                 | Cleanup candidate before promotion | Says `ACEP` owns `executable task cards`, which can be read as task-card source authority.                                        | Rewrite ACEP ownership as Cycle Contract / Node Execution Contract packaging and scope. | Yes, unless explicitly waived.         |
| `README.md` task-card references                 | Cleanup or waiver candidate        | Mostly says PBE is not only task cards, but diagrams and gate tables still use task-card shorthand.                               | Clarify task cards as compatibility/execution views under contract authority.           | Likely yes for full promotion.         |
| `docs/acep.md`                                   | Cleanup or waiver candidate        | Describes pack output and runner behavior through `task cards`; useful but may over-center cards.                                 | Add contract-boundary wording around Cycle/Node Execution Contracts.                    | Conditional; explicit waiver possible. |
| `docs/workflow.md`                               | Cleanup or waiver candidate        | Says ACEP Generator writes task cards and source-of-truth references.                                                             | Clarify generated pack references authority but does not become source.                 | Conditional; explicit waiver possible. |
| `docs/examples.md`, `docs/usage.md`              | Cleanup or waiver candidate        | Uses task-card execution shorthand for user workflows.                                                                            | Keep examples but add compatibility shorthand note if promotion proceeds.               | Conditional; explicit waiver possible. |
| `docs/traceability-rules.md`                     | Cleanup candidate before promotion | Treats task cards as traceability units; may need alignment with Node Execution Contracts.                                        | Reframe task-card links as execution-contract projection links.                         | Conditional; likely cleanup.           |
| `docs/ux-auditor.md`, `docs/coverage-auditor.md` | Cleanup or waiver candidate        | Audit language checks task cards as coverage artifacts.                                                                           | Clarify task cards are checked as contract projections, not source truth.               | Conditional.                           |
| `docs/file-format.md`                            | Mostly safe / review later         | Mentions compatibility views and task-card paths, but mostly as file layout.                                                      | Review for labels only if broader cleanup starts.                                       | No unless conflict found.              |
| `AGENTS.md`                                      | Mostly safe / review later         | Current instructions define ACEP as Cycle Contract and Node Execution Contract packaging; one visual section mentions task cards. | Keep as operational guidance; optionally clarify visual task-card shorthand later.      | No immediate blocker.                  |
| `docs/project-blueprint-engine-plugin.md`        | Safe / no action needed            | Explicitly says PBE generates an execution contract, not just task cards.                                                         | Use as model wording for cleanup.                                                       | No.                                    |
| `docs/tree-model.md`, `docs/core-concepts.md`    | Safe / no action needed            | Public architecture docs emphasize tree-native source/control model.                                                              | Keep as canonical public wording.                                                       | No.                                    |
| `docs/concept/**`                                | Concept-only retained context      | Contains historical decisions, warnings, and transition records by design.                                                        | Do not clean as public docs unless a later concept-archive policy is approved.          | No for this package.                   |

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

## Non-Scope

This package does not:

- edit public docs
- implement cleanup
- approve an explicit waiver
- expand source authority
- approve Graph-source promotion
- retire tree-native artifacts
- change workflow, code, CLI, tests, or generated artifacts
- create a PR or dispatch GitHub Actions
- add required checks, branch protection, or enforcement
- promote Todo App PBE Run beyond `structure-only`
- replace user acceptance authority
