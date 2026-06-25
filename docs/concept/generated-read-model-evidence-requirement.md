# Generated Read-Model Evidence Requirement

Status: generated-read-model-evidence-requirement / prerequisite-selected / bounded-implementation-complete

## Document Purpose

This document defines the generated builder / CLI-backed read-model Evidence required before actual scoped
source-authority pilot execution can be reconsidered for the Todo Search selected slice.

It began as a concept-level requirement. Later bounded implementation work added Todo Search generated read-model
Evidence and scoped validator-backed Evidence. Those outputs remain Evidence only; they do not implement CI workflow,
source transition, or full Graph-source promotion.

## User Decision Trace

| Field                 | Value                                                                |
| --------------------- | -------------------------------------------------------------------- |
| Decision source       | parent orchestration chat                                            |
| Decision date         | 2026-06-25                                                           |
| Selected option       | `Require generated builder / CLI-backed read-model before execution` |
| Decision scope        | Todo Search scoped source-authority pilot prerequisite               |
| Explicit non-approval | implementation                                                       |
| Explicit non-approval | CLI command                                                          |
| Explicit non-approval | validator / CI                                                       |
| Explicit non-approval | source authority change                                              |
| Explicit non-approval | full Graph-source promotion                                          |

The decision requires generated or CLI-backed read-model Evidence before actual scoped source-authority pilot execution
can be approved. It does not authorize implementation of that generator or CLI.

## Requirement Purpose

Manual parity artifacts are useful and accepted for:

- concept review
- review-only dry-run
- bounded preparation-package reasoning
- source/fallback discussion

They are not enough as the default basis for authority-bearing execution because they are manually assembled. A scoped
source-authority pilot needs stronger repeatability, source-input clarity, and conflict visibility before any source
boundary can change.

Generated or CLI-backed read-model Evidence should reduce:

- source-authority confusion
- manual transcription drift
- hidden missing-node or missing-edge gaps
- view membership / tag confusion
- fallback ambiguity between tree-native artifacts and graph candidate output

Generated Evidence is still Evidence. It is not automatic source authority.

## Evidence Requirement Levels

| Level                           | Meaning                                                                                                                   | Sufficient for                                                                               | Not sufficient for                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `manual-review-evidence`        | Current manual read-model parity artifacts, View Instance Manifest, and parity check.                                     | Concept review, dry-run observation, and preparation-package reasoning.                      | Default authority-bearing execution.                                             |
| `generated-read-model-evidence` | Repeatable generated output from declared source inputs, with source links and warnings.                                  | Reopening scoped source-authority execution approval discussion for Todo Search pilot scope. | Automatic source authority change, full promotion, validator/CI repeatability.   |
| `validator-backed-evidence`     | Local scoped validator report checking generated read-model, parity, warnings, boundaries, and fallback/reference status. | Todo Search active observation and bounded scoped pilot review.                              | CI-backed repeatability, enforcement, source authority expansion, or promotion.  |
| `ci-backed-evidence`            | Future stronger level where validator checks run in CI against a known commit or branch.                                  | Broader execution or full-promotion repeatability discussion if later required.              | Current scoped pilot operation unless the user demands this stronger gate first. |

The selected prerequisite for the scoped pilot was `generated-read-model-evidence`; Todo Search now also has local
`validator-backed-evidence`. CI-backed Evidence remains a future decision.

## Source Input Expectations

Future generated read-model Evidence must account for these conceptual inputs:

| Source input                                                          | Expected role                                                                      |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Product selected-slice artifact                                       | Source of product meaning, acceptance criteria, and non-scope.                     |
| Project selected-slice artifact                                       | Source of boundary, structure, surface, and ownership anchors.                     |
| Work selected-slice artifact                                          | Source of work responsibility, scope, and touch boundaries.                        |
| Test selected-slice artifact                                          | Source of Check nodes and verification obligations.                                |
| Evidence selected-slice artifact                                      | Source of Evidence nodes, freshness, and exception state.                          |
| Acceptance selected-slice artifact                                    | Source of user-controlled demo-support acceptance state.                           |
| Change / Impact artifacts                                             | Source of PP-001, stale/reopen, invalidation, and affected-node relationships.     |
| Cycle Contract / Node Execution Contract                              | Source of selected/foundation/deferred/out-of-scope/forbidden boundaries.          |
| Runtime fixture Evidence reference                                    | Source of bounded command Evidence for title + note/content search.                |
| Approval Brief / Evidence exception records                           | Source of retained warning and user judgment summaries.                            |
| Compatibility mismatch supplemental evidence                          | Warning input only; not pilot source scope.                                        |
| Existing manual read-model parity artifact and View Instance Manifest | Comparison/reference artifact only; not authoritative source input for generation. |

This requirement does not define parser design, command shape, file format, package structure, or implementation steps.

## Output Evidence Expectations

Future generated read-model Evidence must demonstrate, at concept level:

- Node / Edge / Tag separation.
- allowed `nodeKind`, `edgeType`, and role-tag taxonomy consistency.
- `viewScopedTags` limited to role tags only: `target`, `context`, `candidate`, `guard`, `required`, `stale`,
  `blocked`, `output`.
- view membership separated from tags.
- 7 Core View coverage: Intent, Behavior, Structure, Scope / Execution, Impact, Verification, Evidence / Acceptance.
- confidence separated from freshness/status.
- source reference links back to tree-native artifacts.
- retained warning visibility.
- Check/Evidence separation.
- source authority boundary statement.
- generated timestamp, run id, command identity, or equivalent Evidence metadata.
- deterministic or repeatable enough comparison expectation against the same declared source inputs.

The output should be reviewable. It should not silently modify tree-native artifacts, manual parity artifacts,
Acceptance state, or source authority.

## Parity / Conflict Expectations

Generated output should be comparable against the current manual read-model parity artifact.

Mismatch categories include:

| Category                    | Meaning                                                                     | Possible control response                                                |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| missing node                | Generated output omits a required durable target.                           | Evidence or Impact Control Node candidate.                               |
| missing edge                | Generated output omits a required semantic relationship.                    | Evidence, Impact, or Decision Control Node candidate.                    |
| wrong role tag              | Generated output places an invalid tag or view membership in tag position.  | Evidence Control Node candidate; taxonomy integrity warning.             |
| stale/freshness mismatch    | Generated output conflicts with known Evidence freshness.                   | Evidence or Impact Control Node candidate.                               |
| source reference mismatch   | Generated output points to the wrong source artifact or lacks source links. | Evidence Control Node candidate; possible authority blocker.             |
| warning omission            | Generated output hides retained warnings or Evidence exceptions.            | Evidence or Compatibility Control Node candidate.                        |
| authority-boundary mismatch | Generated output implies graph/source promotion or tree retirement.         | Decision, Compatibility, or Impact Control Node candidate; likely block. |

Mismatch does not auto-fix source artifacts.

Mismatch does not automatically update the manual read-model.

If a mismatch affects source, acceptance, risk, or authority boundary, user judgment is required before scoped execution
can proceed.

## Gate Relationship

### Evidence Gate

Generated read-model Evidence can strengthen the Evidence gate by making Node/Edge/Tag parity and source links
repeatable. It does not replace runtime fixture Evidence, Evidence exceptions, or user judgment.

### Authority Gate

Generated read-model Evidence can support source/fallback clarity. It does not activate graph source authority by
itself.

### Rollback / Fallback Gate

Generated read-model Evidence does not by itself make rollback-ready status true. Rollback/fallback still needs
fallback trigger categories, precedence rules, and user-visible recovery boundaries.

### Compatibility Gate

Generated read-model Evidence must carry compatibility warnings forward. It does not clean up public docs or retire
compatibility views.

### Approval Gate

Generated read-model Evidence may reopen the scoped execution approval discussion. It does not approve execution.
Codex/PBE cannot self-approve source authority change.

## Original Non-Scope

The original requirement decision did not include:

- builder implementation
- CLI implementation
- validator implementation
- CI implementation
- schema/type model implementation
- source authority change
- Graph-source promotion
- public-doc cleanup
- tree-native artifact retirement
- generated output claimed as already existing
- scoped source-authority pilot execution

Later records separately approve and implement bounded generated output, bounded scoped pilot execution, active
observation, and local scoped validator-backed Evidence. They still do not approve CI enforcement, broader source
authority expansion, public-doc cleanup, tree-native retirement, or full Graph-source promotion.

## Next User Decision Surface

The user selected the design-first path. The resulting design is recorded in
[cli-backed-read-model-evidence-output-design.md](cli-backed-read-model-evidence-output-design.md).

After that output design, the next decision surface is:

1. `Approve generated read-model builder implementation task`
2. `Refine output design before implementation`
3. `Require validator/CI design first`
4. `Require public-doc cleanup before implementation`
5. `Defer generated builder work`
6. `Reject scoped source-authority pilot path`

The recommended next option from the output design is `Approve generated read-model builder implementation task` if the
user accepts the current concept-level output shape. Stricter users can choose `Require validator/CI design first`.

The user approved that bounded implementation task. Todo Search generated read-model Evidence is now created by:

- `pbe graph read-model generate --slice examples/adoption/todo-search-slice`
- `pbe graph read-model compare --generated <file> --manual <file>`

Outputs are written under `examples/adoption/todo-search-slice/generated/`. They satisfy this prerequisite for bounded
Todo Search Evidence discussion only; they do not approve scoped source-authority execution.

The user later approved actual scoped source-authority pilot execution for the Todo Search selected slice with this
generated Evidence and `comparison-pass` parity. That execution is recorded in
[scoped-source-authority-pilot-execution-record.md](scoped-source-authority-pilot-execution-record.md). The generated
Evidence requirement remains bounded to the pilot and still does not approve full Graph-source promotion, public-doc
cleanup, CI enforcement, or tree-native artifact retirement.

The later validator/CI-backed Evidence design is recorded in
[validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md). Local scoped
validator-backed Evidence is now implemented for Todo Search; CI-backed Evidence remains future and does not change the
completed bounded generated Evidence prerequisite.

### Original Requirement Choice Set

After this requirement is recorded, the user must choose one of:

1. `Prepare generated read-model builder implementation task`
2. `Prepare CLI-backed evidence output design first`
3. `Require public-doc cleanup before generated builder work`
4. `Defer generated builder work`
5. `Accept manual-candidate risk and revisit scoped execution approval`
6. `Reject scoped source-authority pilot path`

Original recommended next option:

```text
Prepare CLI-backed evidence output design first
```

Reason:

- The requirement is stable enough to define what Evidence must prove.
- The exact output artifact format, command surface, comparison behavior, and mismatch reporting are still open.
- A design-first step can keep implementation bounded and avoid prematurely creating a generator that encodes the wrong
  source authority assumptions.

That design-first step is now recorded. Any future implementation must still begin from this requirement's
non-promotion and source-boundary constraints.

## Approval Brief Draft

### Intent Understood

PBE is recording that generated builder / CLI-backed read-model Evidence is required before actual scoped
source-authority pilot execution can be reconsidered.

### Result Summary

The requirement separates manual-review Evidence from generated read-model Evidence and future validator/CI-backed
Evidence. It defines source input expectations, output expectations, mismatch categories, gate relationships, and
non-scope boundaries without implementing anything.

### Verification Summary

| Check                                        | Status           | Summary                                                                                    |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| User selected generated prerequisite         | present          | Parent orchestration chat selected `Require generated builder / CLI-backed read-model`.    |
| Manual parity usefulness                     | present          | Manual artifacts remain accepted for dry-run and preparation.                              |
| Manual parity as default authority candidate | not sufficient   | Authority-bearing execution needs stronger repeatability unless user accepts manual risk.  |
| Generated read-model Evidence requirement    | defined          | Source inputs, output expectations, mismatch categories, and gates are documented.         |
| Output design                                | recorded         | `cli-backed-read-model-evidence-output-design.md` defines the future output surface.       |
| Bounded builder / CLI implementation         | present          | Todo Search generated output and parity report are created under `generated/`.             |
| Source authority change                      | not approved     | Generated Evidence is not automatic source authority.                                      |
| Rollback/fallback readiness                  | partial          | Generated Evidence can help but does not close rollback/fallback gate by itself.           |
| Compatibility cleanup                        | deferred warning | Public-doc cleanup remains visible and separate.                                           |
| Generated/manual comparison warning review   | complete         | The five freshness warnings were reviewed; the current parity report is `comparison-pass`. |

### Remaining Judgment

The user approved scoped source-authority pilot execution with generated Evidence, and local validator-backed Evidence
is now present. The next decision is whether to keep observing the pilot, design CI-backed Evidence, require cleanup
first, prepare broader promotion review, rollback/defer, or keep the pilot bounded.

### Approval Choice Candidates

- `Observe / review scoped source-authority pilot`
- `Design CI-backed read-model Evidence before broader execution or enforcement`
- `Require public-doc cleanup before broader promotion`
- `Prepare broader Graph-source promotion review`
- `Rollback / defer scoped source-authority pilot`

### State Label

```text
Decision required
```

Reason: generated Evidence, scoped pilot execution, review, active observation, and scoped validator-backed Evidence are
recorded, but CI-backed Evidence and broader promotion remain unapproved.

## Control Node Summary

| Control record                        | Family                       | Status                    | Reason                                                                                    |
| ------------------------------------- | ---------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| Generated prerequisite selected       | Decision Control Node        | resolved                  | User required generated/CLI-backed Evidence before execution.                             |
| Output design selected                | Decision Control Node        | resolved                  | User selected design-first work, now recorded in the CLI-backed output design.            |
| Bounded generated output present      | Evidence Control Node        | present with warnings     | Generated read-model Evidence exists for Todo Search.                                     |
| Scoped validator-backed Evidence      | Evidence Control Node        | present                   | Local `validation-pass` Evidence exists for Todo Search; CI-backed Evidence remains open. |
| Public-doc cleanup                    | Compatibility Control Node   | deferred / active warning | ACEP task-card cleanup remains visible and separate.                                      |
| Scoped source authority change        | Impact / Change Control Node | not started               | No source authority execution occurs from this requirement.                               |
| Demo-support Acceptance with warnings | Acceptance Control Node      | closed with warnings      | It remains demo-support acceptance, not source-transition approval.                       |
| Rollback/fallback readiness           | Evidence / Decision Control  | partial                   | Generated Evidence can help; rollback-ready conditions still require later definition.    |

## Gate Self-Check

| Gate                                         | Result | Notes                                                                                                                       |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Implementation Boundary Gate                 | PASS   | Bounded builder and scoped validator exist for Todo Search; no schema, CI, enforcement, or broader implementation is added. |
| Non-Promotion Gate                           | PASS   | This requirement does not promote Maintainability Graph or change source authority.                                         |
| Requirement / Implementation Separation Gate | PASS   | The requirement is recorded separately from any future implementation task.                                                 |
| Evidence Reality Gate                        | PASS   | Current manual Evidence remains visible; bounded generated Evidence is recorded under `generated/`.                         |
| Source Authority Boundary Gate               | PASS   | Tree-native selected-slice artifacts remain current operational source.                                                     |
| Taxonomy / View Integrity Gate               | PASS   | Generated output expectations preserve Node/Edge/Tag and 7 Core View constraints.                                           |
| User Approval Gate                           | PASS   | Execution and implementation still require later explicit user approval.                                                    |

## Final Statement

This requirement document now records that bounded generated read-model Evidence and scoped validator-backed Evidence
exist for Todo Search.

It does not execute scoped source-authority transition.

It does not change current source authority, retire tree-native artifacts, or declare Graph-source promotion.
