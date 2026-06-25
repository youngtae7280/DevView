# Validator / CI-Backed Read-Model Evidence Design

Status: validator-ci-backed-read-model-evidence-design / design-recorded / implementation-not-started

## Document Purpose

This document defines the concept-level design for validator-backed and CI-backed read-model Evidence needed before PBE
considers broader execution, enforcement, or full Graph-source promotion review.

It builds on the Todo Search scoped source-authority pilot, which is currently active under observation with retained
warnings. The design does not implement a validator command, does not add a CI workflow, does not expand pilot scope, and
does not change source authority.

## Current Scoped Pilot Baseline

| Baseline item                 | Current state                              |
| ----------------------------- | ------------------------------------------ |
| Scoped pilot                  | `examples/adoption/todo-search-slice` only |
| Active observation status     | `keep-active-with-retained-warnings`       |
| Generated/manual parity       | `comparison-pass`                          |
| Mismatch count                | 0                                          |
| Blocking count                | 0                                          |
| Decision-required count       | 0                                          |
| Generated read-model Evidence | present for bounded Todo Search slice      |
| Tree-native fallback          | retained and usable                        |
| Supplemental compatibility    | warning-only, not pilot source scope       |

This baseline is sufficient to keep the current scoped pilot active. It is not enough by itself to enforce broader
execution, make CI claims, retire fallback artifacts, or approve full Graph-source promotion.

## Evidence Levels

### CLI Command Success

CLI command success means a local command ran and produced a reviewable output. For the current scoped pilot, examples
include:

- `pbe graph read-model generate --slice examples/adoption/todo-search-slice`
- `pbe graph read-model compare --generated <file> --manual <file>`

This is observable Evidence, but it is not the same as validator-backed Evidence or CI-backed Evidence.

### Validator-Backed Evidence

Validator-backed Evidence means a deterministic validation command checks the generated read-model outputs against
declared rules and produces a validation report.

Validator-backed Evidence is stronger than command success because it evaluates whether required evidence properties
are present, internally consistent, and bounded by policy.

### CI-Backed Evidence

CI-backed Evidence means the validator-backed checks run in a repeatable CI context against a known commit or branch and
produce a durable CI run result or artifact.

CI-backed Evidence is stronger than local validator-backed Evidence because it reduces local-environment ambiguity and
supports repeatability discussions for broader execution or full promotion review.

## Scope Levels

| Scope level                                | Meaning                                                                                           | Design stance                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `scoped-slice-validation`                  | Validate one selected slice such as `examples/adoption/todo-search-slice`.                        | First target for validator-backed Evidence design.                       |
| `multi-slice-validation`                   | Validate multiple generated read-model outputs without claiming repository-wide source authority. | Later expansion after scoped-slice validation is stable.                 |
| `repo-wide-promotion-readiness-validation` | Validate readiness evidence for full Graph-source promotion discussion.                           | Later stage; likely requires CI-backed Evidence or explicit user waiver. |

Scope level must be explicit in every future report. Passing scoped-slice validation must not be read as repo-wide
promotion readiness.

## Proposed Validation Checks

| Check                           | Expected condition                                                                                                            | Severity if failed            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Generated read-model exists     | `generated-read-model.json` is present and parseable.                                                                         | blocking                      |
| Source input artifacts exist    | Required selected-slice source inputs are present or explicitly marked missing/exception.                                     | blocking or warning           |
| Generated/manual parity         | parity status is `comparison-pass`.                                                                                           | blocking                      |
| Mismatch counts                 | mismatch, blocking, and decision-required counts are within declared constraints, usually 0 for active pilot.                 | blocking or decision-required |
| Node/Edge/Tag taxonomy          | node kinds, edge types, and tag fields follow the Graph-first policy.                                                         | blocking                      |
| `viewScopedTags`                | tags are limited to `target`, `context`, `candidate`, `guard`, `required`, `stale`, `blocked`, `output`.                      | blocking                      |
| View membership                 | view ids are separate from role tags.                                                                                         | blocking                      |
| 7 Core View coverage            | Intent, Behavior, Structure, Scope / Execution, Impact, Verification, Evidence / Acceptance are present or explicitly scoped. | blocking or warning           |
| Confidence/freshness separation | confidence is not used as freshness/status and `stale` is not a confidence value.                                             | blocking                      |
| Check/Evidence mapping          | Checks and Evidence are mapped distinctly.                                                                                    | blocking                      |
| Source authority boundary       | boundary statement is present and bounded to the declared scope.                                                              | blocking                      |
| Non-promotion statement         | output explicitly says it is not promotion or automatic source authority change.                                              | blocking                      |
| Retained warnings               | bounded fixture, partial UI Evidence, validator/CI gap, and public-doc cleanup warnings remain visible where applicable.      | warning or decision-required  |
| Fallback/reference artifacts    | tree-native fallback/reference artifacts are present or an exception is visible.                                              | blocking                      |
| User acceptance authority       | output does not replace user acceptance with Codex/PBE judgment.                                                              | blocking                      |
| Compatibility boundary          | supplemental compatibility evidence remains warning-only unless separately promoted or cleaned up.                            | warning or decision-required  |

## Proposed Report Artifacts

These are design targets only. They are not created by this document.

| Artifact                               | Role                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `read-model-validation-report.json`    | Machine-readable validator-backed Evidence summary.                                                 |
| `read-model-validation-report.md`      | Human-readable validation summary for review and Approval Brief use.                                |
| `read-model-ci-evidence-manifest.json` | Future CI-backed manifest linking commit, run identity, validation command, and produced artifacts. |
| `read-model-validation-summary.md`     | Optional concise summary for promotion or scoped execution review packages.                         |

## Future CLI / CI Surfaces

Conceptual future command candidates:

```text
pbe graph read-model validate --slice <path>
pbe graph read-model validate --all
pbe graph read-model validate --slice <path> --ci-manifest <file>
```

These names are design candidates only. This document does not implement commands, parser behavior, validators, CI
workflows, schema, or enforcement.

## Report Field Expectations

Future validation reports should include:

- run identity: timestamp, command identity, source commit, source slice, scope level.
- input artifact list and presence status.
- generated output references.
- parity report reference and summary.
- validation status and severity summary.
- check results with source references.
- Node/Edge/Tag taxonomy results.
- allowed role-tag check result.
- 7 Core View coverage result.
- confidence/freshness separation result.
- Check/Evidence mapping result.
- retained warning carry-forward.
- fallback/reference artifact status.
- user acceptance boundary result.
- supplemental compatibility boundary result.
- source authority and non-promotion statements.

## Severity / Status Labels

Status labels:

- `validation-pass`
- `validation-warning`
- `validation-blocked`
- `decision-required`

Severity labels:

- `info`
- `warning`
- `blocking`
- `decision-required`

Evidence level labels:

- `cli-generated`
- `validator-backed`
- `ci-backed`

These are concept labels, not schema enums.

## Gating Relationship

### Current Todo Search Pilot

Validator/CI-backed Evidence is not required to keep the current Todo Search scoped pilot active under observation.
Current parity is `comparison-pass`, fallback is retained, and retained warnings remain visible.

### Broader Execution / Enforcement

Validator-backed Evidence is a recommended prerequisite before applying the scoped pilot pattern to another slice,
enforcing read-model parity as a gate, or using generated read-model output as a broader operational control.

### Full Graph-Source Promotion

CI-backed Evidence, or an explicit user waiver, should be considered before full Graph-source promotion review. Even a CI
pass does not approve source promotion by itself.

### User Approval

Validator or CI pass is Evidence. It is not user approval. Source authority transition, full promotion, warning
retirement, compatibility cleanup, and acceptance closure still require the appropriate user judgment surface.

## Relation To Existing Records

- [scoped-source-authority-pilot-active-observation.md](scoped-source-authority-pilot-active-observation.md) records why
  validator/CI-backed Evidence is the next likely strengthening decision before broader use.
- [generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md) separates manual,
  generated, and validator/CI-backed Evidence levels.
- [cli-backed-read-model-evidence-output-design.md](cli-backed-read-model-evidence-output-design.md) defines the generated
  output and comparison report shape that future validation would check.
- [source-transition-path.md](source-transition-path.md) keeps source authority transition separate from Evidence pass.
- [rollback-compatibility-strategy.md](rollback-compatibility-strategy.md) keeps fallback/rollback and compatibility
  handling visible even when validation passes.

## Explicit Non-Scope

This design does not:

- implement a validator command
- add a CI workflow
- enforce validation gates
- change source authority
- expand pilot scope
- declare full Graph-source promotion
- clean up public docs
- retire tree-native artifacts
- hide retained warnings
- make validator/CI pass equivalent to user approval

## Next Decision Surface

After this design, the next user decision should choose one of:

1. `Approve scoped read-model validator implementation`
2. `Refine validator/CI Evidence design before implementation`
3. `Design CI workflow integration before validator implementation`
4. `Perform public-doc cleanup first`
5. `Continue active observation without validator/CI work`
6. `Defer or reject broader execution/enforcement path`

Recommended next step: approve scoped read-model validator implementation only if the user wants to move beyond active
observation toward broader execution or enforcement. If the user wants to stay conservative, continue active observation.

## Gate Self-Check

| Gate                               | Result | Notes                                                                         |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Design-Only Boundary Gate          | Pass   | This document defines design only.                                            |
| Non-Implementation Gate            | Pass   | No validator command, CI workflow, schema, or enforcement is implemented.     |
| Non-CI-Enforcement Gate            | Pass   | CI-backed Evidence is designed, not introduced.                               |
| Source Authority Boundary Gate     | Pass   | Source authority remains scoped and unchanged.                                |
| Non-Full-Promotion Gate            | Pass   | Full Graph-source promotion remains unapproved.                               |
| Validator/CI Evidence Clarity Gate | Pass   | CLI success, validator-backed Evidence, and CI-backed Evidence are separated. |
| User Approval Boundary Gate        | Pass   | Validator/CI pass remains Evidence, not user approval.                        |
| Retained Warning Visibility Gate   | Pass   | Warnings remain explicit.                                                     |
| Scope-Level Separation Gate        | Pass   | Scoped, multi-slice, and repo-wide readiness levels are separated.            |

## Final Non-Implementation Statement

This design records what validator-backed and CI-backed read-model Evidence should mean. It does not implement validator
or CI support, does not change source authority, does not expand the Todo Search scoped pilot, and does not approve full
Graph-source promotion.
