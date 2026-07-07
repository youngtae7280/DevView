# Scoped Source-Authority Pilot Active Observation

Status: scoped-source-authority-pilot-active-observation / keep-active-with-retained-warnings / source-authority-contained

## Document Purpose

This record keeps the Todo Search scoped source-authority pilot active under explicit observation criteria.

This is not pilot expansion, not broader execution, not full Graph-source promotion, not CI enforcement, not public-doc
cleanup, and not tree-native artifact retirement. It only records how the already reviewed scoped pilot should be
observed, when it should be re-reviewed, and which triggers require a new user decision.

## Current Active Status

```text
keep-active-with-retained-warnings
```

The pilot remains active only for:

```text
examples/internal-legacy/adoption/todo-search-slice
```

The supplemental compatibility mismatch slice remains warning Evidence only:

```text
examples/internal-legacy/adoption/compatibility-mismatch-slice
```

## Observation Scope

### In Scope

- Todo Search selected-slice generated read-model Evidence
- Todo Search selected-slice pilot marker
- Todo Search selected-slice generated/manual parity report
- Todo Search selected-slice validator-backed Evidence report
- Todo Search selected-slice tree-native fallback/reference artifacts
- retained warnings and fallback triggers

### Explicit Non-Scope

- full Graph-source promotion
- repository-wide source authority change
- pilot scope expansion beyond Todo Search selected slice
- tree-native artifact retirement
- CI enforcement
- public-doc cleanup
- Codex/PBE self-acceptance

## Observed Authority Record

| Role                                          | Artifact                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Generated bounded pilot interpretation record | `examples/internal-legacy/adoption/todo-search-slice/generated/generated-read-model.json`                 |
| Pilot marker                                  | `examples/internal-legacy/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json` |
| Required parity report                        | `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-parity-report.json`             |
| Validator-backed Evidence report              | `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-validation-report.json`         |
| Evidence manifest                             | `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-evidence-manifest.json`         |
| Todo Search read-model profile                | `cli/src/core/read-model-evidence.ts`                                                                     |
| Review record                                 | `docs/concept/scoped-source-authority-pilot-review.md`                                                    |

The Todo Search read-model profile is an implementation structure for the bounded builder/validator path. It preserves
the active observation boundary and does not add a second slice, aggregation, CI enforcement, or broader source
authority.

## Fallback / Reference Artifacts

Tree-native selected-slice artifacts remain preserved and usable as fallback/reference:

- `examples/internal-legacy/adoption/todo-search-slice/product-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/project-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/work-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/test-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/evidence-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/acceptance-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/change-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/impact-tree.json`
- `examples/internal-legacy/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/internal-legacy/adoption/todo-search-slice/view-instance-manifest.json`

## Retained Warnings

| Warning                                      | Active observation treatment                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Bounded fixture Evidence                     | Retained. It is acceptable for this scoped pilot but not proof of full Todo app implementation.    |
| Partial UI screenshot/manual visual Evidence | Retained. It does not block active observation, but broader UI confidence needs stronger Evidence. |
| CI-backed Evidence / enforcement missing     | Retained. Reviewed manual CI-backed Evidence is present; CI enforcement remains future-only.       |
| ACEP task-card public-doc cleanup deferred   | Retained. It is not cleaned up here and should be revisited before broader promotion planning.     |

## Observation Checks

Run or review these checks whenever the pilot is observed again:

| Check                                    | Expected state                                                   |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Generated/manual parity                  | `comparison-pass`                                                |
| Mismatch count                           | 0                                                                |
| Blocking count                           | 0                                                                |
| Decision-required count                  | 0                                                                |
| Validator-backed Evidence status         | `validation-pass`                                                |
| Generated interpretation boundary        | bounded to `examples/internal-legacy/adoption/todo-search-slice` |
| Tree-native fallback/reference artifacts | present and usable                                               |
| Retained warnings                        | visible in marker, review records, and concept docs              |
| User acceptance authority                | remains user-controlled                                          |
| Compatibility mismatch slice             | warning-only, not pilot source scope                             |
| Public-doc cleanup                       | not performed silently                                           |
| CI enforcement                           | not introduced silently                                          |
| Broader promotion                        | not implied by marker, read-model, parity report, or docs        |

## Triggers For Re-Review

Re-review the scoped pilot if any of these occur:

- generated read-model output is regenerated after source artifacts change
- tree-native selected-slice artifacts change
- generated/manual parity report changes from `comparison-pass`
- validator-backed Evidence report changes from `validation-pass`
- retained warnings are edited, removed, or reclassified
- user acceptance wording changes
- supplemental compatibility evidence becomes relevant to current scope, verification, acceptance, or authority
- source authority boundary wording becomes ambiguous

## Triggers For Fallback / Rollback / Defer

Fallback to tree-native selected-slice artifacts, or defer the pilot pending user review, if any of these occur:

- parity report becomes `comparison-warning`, `comparison-blocked`, or `decision-required`
- validator-backed Evidence becomes `validation-warning`, `validation-blocked`, or `decision-required`
- generated interpretation boundary widens beyond Todo Search selected slice
- generated output or marker implies repository-wide promotion
- tree-native fallback/reference artifacts become missing or unusable
- Check/Evidence separation becomes ambiguous
- user acceptance authority appears replaced by Codex/PBE
- retained warnings are hidden

No rollback command is executed by this observation record. Because tree-native artifacts remain retained and not retired,
fallback is a visible authority-precedence action rather than a destructive migration reversal.

## Triggers For CI-Backed Evidence Decision

Validator-backed Evidence is now available for the Todo Search scoped slice. Escalate to a CI-backed Evidence or
enforcement decision before:

- using the pilot pattern for another slice
- enforcing generated/manual parity as a gate
- making broader source-authority claims
- preparing full Graph-source promotion review
- relying on repeatability beyond local validator execution

The concept-level design for that decision is recorded in
[validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md). The scoped
validator command is implemented for Todo Search only; CI enforcement remains unimplemented.

The CI workflow integration design is recorded in
[ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md). It defines trigger
modes, commands, artifacts, status labels, and waiver boundaries. The non-enforcing manual workflow is implemented in
`.github/workflows/read-model-evidence.yml`; PR/push triggers and enforcement remain future-only. Run `28151296796`
provides reviewed CI-backed Evidence with `ci-evidence-pass`, `validation-pass`, and `comparison-pass`.

## Triggers For Public-Doc Cleanup Decision

Escalate ACEP task-card/public-doc cleanup if:

- compatibility wording confuses pilot authority
- public docs are used as authority during broader review
- a user asks to reduce legacy/canonical mismatch risk
- broader Graph-source promotion review begins

## Triggers For Broader Graph-Source Promotion Review

Do not start broader Graph-source promotion review automatically. It requires a separate user decision after at least one
of these is true:

- scoped pilot has remained stable through observation
- validator-backed Evidence is available and CI-backed Evidence is available or explicitly waived by the user
- public-doc cleanup is completed or explicitly accepted as a retained warning
- broader source authority matrix and rollback/fallback expectations are updated

## Next Important Decision Surface

The next major decision should be one of:

1. `Continue active observation`
2. `Observe PR informational runs under policy`
3. `Design CI enforcement / required check policy`
4. `Perform public-doc cleanup`
5. `Prepare broader Graph-source promotion review`
6. `Rollback or defer scoped pilot`

Recommended current stance: continue active observation with validator-backed and reviewed CI-backed Evidence until the
user wants PR integration, broader use, enforcement, cleanup, promotion review, or rollback/defer.

Multi-slice follow-up status: `examples/valid/todo-app-devview-run` now has structure-only generated/validation Evidence.
That fixture does not expand this active Todo Search pilot, does not create a second pilot marker, and does not add
CI-backed Evidence or source-authority claims outside `examples/internal-legacy/adoption/todo-search-slice`. The validation reports for
both slices now carry per-slice independence metadata, preserving the Todo Search active-observation boundary before any
future aggregation.

## Gate Self-Check

| Gate                              | Result | Notes                                                           |
| --------------------------------- | ------ | --------------------------------------------------------------- |
| Active Observation Boundary Gate  | Pass   | This record observes an already executed scoped pilot.          |
| Source Authority Containment Gate | Pass   | Authority remains bounded to Todo Search selected slice.        |
| Parity Stability Gate             | Pass   | Expected state remains `comparison-pass`.                       |
| Fallback Readiness Gate           | Pass   | Tree-native fallback/reference artifacts remain retained.       |
| Retained Warning Visibility Gate  | Pass   | Warnings remain explicit observation inputs.                    |
| User Acceptance Authority Gate    | Pass   | User acceptance remains user-controlled.                        |
| Non-Expansion Gate                | Pass   | No scope expansion beyond Todo Search selected slice.           |
| Non-Full-Promotion Gate           | Pass   | Full Graph-source promotion remains unapproved.                 |
| Validator/CI Boundary Gate        | Pass   | Scoped validator Evidence exists; no CI enforcement introduced. |
| Public-Doc Cleanup Boundary Gate  | Pass   | Cleanup remains deferred.                                       |

## Final Non-Promotion / Non-Expansion Statement

This active observation record keeps the Todo Search scoped pilot observable and bounded. It does not expand source
authority, does not promote Maintainability Graph as the repository-wide source model, does not retire tree-native
artifacts, does not introduce CI enforcement, does not perform public-doc cleanup, and does not let Codex/PBE
replace user acceptance authority.
