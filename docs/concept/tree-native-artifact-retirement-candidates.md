# Tree-Native Artifact Retirement Candidates

Status: readiness / retirement-candidate-boundary / non-destructive

## Purpose

This package classifies tree-native and compatibility artifacts that may become retirement candidates during the
Graph-source transition.

It is an audit and decision package only. It does not delete, move, rename, rewrite, deprecate, or retire any artifact.
It does not change schemas, validators, CLI commands, state transitions, CI behavior, branch protection, source
authority, or examples.

## Current Graph-Source Authority Status

Current machine-readable status is recorded in
`examples/read-model-aggregate/graph-source-transition-status.json`.

The current boundary is:

- Todo Search selected slice is limited Graph-source promoted.
- Todo App PBE Run is graph-source-backed for `structure-only`.
- `examples/read-model-aggregate/read-model-slices.json` is the positive read-model registry.
- `graph read-model validate --all`, `graph read-model report-health`, and `test:read-model:e2e` provide local and CI
  observation Evidence.
- CI/read-model Evidence remains non-enforcing.
- Repo-wide Graph-source promotion is not complete.
- Tree-native retirement is not complete.
- Required checks, branch protection, CI enforcement, invalid fixture enrollment, and user acceptance replacement are not
  enabled.

## Do Not Remove Yet

The following artifacts must remain available until explicit approval and replacement coverage exist.

| Artifact class                                                        | Current role                              | Why it must stay for now                                                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Product/Project/Work/Test trees                                       | compatibility/fallback/reference          | They still preserve Product intent, work boundaries, test planning, fixtures, skills, and validator expectations.        |
| Change/Impact/Evidence/Acceptance/Product Patch trees                 | safety and review control                 | They protect change routing, impact analysis, proof, user-only acceptance, and product-meaning mutation boundaries.      |
| `pbe-state.json` and `autoflow` metadata                              | compatibility workflow state              | Existing commands, skills, status output, transition history, and migration aliases still depend on them.                |
| `.pbe/blueprint/*` compatibility views                                | migration and rollback reference          | Older initialized projects, templates, skills, and examples still read these views during tree-control closure.          |
| `.pbe/codex-execution-pack/*`, ACEP manifest, and task-card views     | compatibility/execution view              | They package bounded execution obligations until a graph-native execution contract replaces them.                        |
| `examples/valid/*` and `examples/invalid/*` fixtures                  | validator regression coverage             | They define expected pass/fail behavior and must not be confused with source-authority promotion or retirement approval. |
| schemas/templates/validators that mention tree-native or ACEP layouts | compatibility enforcement and scaffolding | Removing them early would break initialized projects, validation contracts, and current examples.                        |
| User acceptance and review records                                    | user authority                            | Generated read-model health, CI pass, or registry inclusion must never replace explicit user acceptance.                 |

## Retirement Candidate Classes

These are candidate classes only. They are not approved for deletion or deprecation by this document.

| Candidate class                         | Possible future retirement target                                                                | Current boundary                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Duplicated tree-native fallback views   | Tree-native selected-slice fallback files after Graph-source authority is proven for that slice. | Todo Search has a deprecated fallback/reference role, but files remain present and rollback-capable.       |
| Old blueprint compatibility views       | `.pbe/blueprint/*` views once graph/read-model projections replace the same reviewable contract. | Existing skills, templates, initialized projects, and validators still depend on them.                     |
| ACEP execution-pack and task-card views | `.pbe/codex-execution-pack/*` once a graph-native execution contract and evidence path exist.    | Current ACEP package remains a compatibility/execution view over bounded Cycle/Node obligations.           |
| Public profile wording                  | `lite/full/bypass` as user-facing mode language after compatibility migration completes.         | Values remain compatibility metadata and CLI/API output must preserve current accepted values.             |
| Tree-stage-primary docs/examples        | Docs/examples that present RPD/WPD/VD/ACEP as the future primary model.                          | They should be clarified as compatibility/control-layer docs before any deletion or archive decision.      |
| Repo-specific validator assumptions     | PBE-plugin-repo assumptions in validation before external adoption-safe validation exists.       | First external dogfooding found this as a blocker; not a retirement target until replacement checks exist. |

## Retirement Prerequisites

Every candidate class needs a separate approval package. At minimum, the package should prove:

1. Graph-source registry coverage exists for the affected slice or artifact class.
2. Read-model projection parity or explicitly accepted `structure-only` status exists.
3. Replacement graph contract, projection, or Evidence path exists and is reviewable.
4. Validation coverage exists for the replacement path.
5. External dogfooding Evidence shows the replacement does not break adoption or rollback.
6. Migration and compatibility notes explain old shape, new shape, recovery, and rollback.
7. User acceptance authority is preserved and not replaced by CI, generated Evidence, or registry inclusion.
8. Required checks, branch protection, and enforcement policy are decided separately.
9. Invalid/negative fixtures remain separated from the positive registry unless separately approved.
10. Explicit user approval names the artifact class, scope, replacement, and rollback path.

## Candidate-Specific Prerequisites

| Candidate class                         | Extra prerequisites before retirement can be proposed                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicated tree-native fallback views   | Slice-level source role beyond fallback/reference, generated projection stability, rollback plan, no hidden retained warnings.                            |
| Old blueprint compatibility views       | Initialized-project compatibility audit, template/schema update plan, adoption-safe validation path, migration note.                                      |
| ACEP execution-pack and task-card views | Graph-native execution contract, graph-native execution Evidence path, bounded scope rules, File Change Guard equivalent, review/acceptance preservation. |
| Public profile wording                  | Compatibility API/output review, docs/search cleanup, context-pack compatibility plan, user-facing migration note.                                        |
| Tree-stage-primary docs/examples        | Canonical graph-first docs exist, references are updated, examples are either archived or relabeled, validators/tests no longer depend on old wording.    |
| Repo-specific validator assumptions     | External-project validator mode or adoption-safe check path, fixture separation, known-limit update, dogfooding pass.                                     |

## Non-Goals

This package does not:

- delete, move, rename, archive, or deprecate files;
- expand Graph-source authority;
- promote Todo App beyond `structure-only`;
- retire tree-native artifacts;
- change schemas, templates, validators, state machine, CLI behavior, package scripts, or CI;
- enable required checks, branch protection, or merge blocking;
- enroll invalid fixtures in positive validate-all or CI;
- replace user acceptance with generated Evidence or CI pass;
- change external dogfooding source projects.

## Next Approval Branch Points

The following branch points require explicit user approval before implementation:

1. Whether Todo App should move from `structure-only` to a limited source-authority pilot.
2. Whether a graph-native execution contract should be designed before any ACEP execution-pack retirement proposal.
3. Whether an adoption-safe validation path should be implemented for external projects.
4. Whether public `lite/full/bypass` wording should be renamed or preserved as compatibility metadata.
5. Whether Candidate B should become a required check after waiver/failure policy review.
6. Whether any specific tree-native fallback artifact should be deprecated, archived, or deleted.

## Recommended Next Work

Recommended next work is still non-destructive:

1. Prepare a graph-first primary workflow document that explains the current read-model path without making retirement
   claims.
2. Prepare an adoption-safe validation design package for external projects.
3. Review whether a graph-native execution contract is needed before ACEP retirement can even be proposed.
4. Continue external dogfooding before promoting new validators or removing compatibility artifacts.
