# Validator / CI-Backed Read-Model Evidence Design

Status: validator-ci-backed-read-model-evidence-design / scoped-validator-backed-evidence-implemented / node24-ci-hygiene-pass-reviewed

## Document Purpose

This document defines the concept-level design for validator-backed and CI-backed read-model Evidence needed before PBE
considers broader execution, enforcement, or full Graph-source promotion review.

It builds on the Todo Search scoped source-authority pilot, which is currently active under observation with retained
warnings. The bounded scoped validator command is implemented for `examples/adoption/todo-search-slice`, and the manual
non-enforcing workflow now also runs the Todo App PBE Run structure-only validator plus aggregate summarize. This does
not enforce CI gates, does not expand source authority, and does not change promotion state.

## Current Scoped Pilot Baseline

| Baseline item                 | Current state                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Scoped pilot                  | `examples/adoption/todo-search-slice` only                                                                 |
| Active observation status     | `keep-active-with-retained-warnings`                                                                       |
| Generated/manual parity       | `comparison-pass`                                                                                          |
| Mismatch count                | 0                                                                                                          |
| Blocking count                | 0                                                                                                          |
| Decision-required count       | 0                                                                                                          |
| Generated read-model Evidence | present for bounded Todo Search slice                                                                      |
| Validator-backed Evidence     | present for bounded Todo Search slice                                                                      |
| CI-backed Evidence            | Todo Search run `28151296796`, aggregate-enabled run `28156403793`, and Node 24 run `28157938343` reviewed |
| Tree-native fallback          | retained and usable                                                                                        |
| Supplemental compatibility    | warning-only, not pilot source scope                                                                       |

This baseline is sufficient to keep the current scoped pilot active and now has local validator-backed Evidence. It is
not enough by itself to enforce broader execution, make CI claims, retire fallback artifacts, or approve full
Graph-source promotion.

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
| Retained warnings               | bounded fixture, partial UI Evidence, CI enforcement gap, and public-doc cleanup warnings remain visible where applicable.    | warning or decision-required  |
| Fallback/reference artifacts    | tree-native fallback/reference artifacts are present or an exception is visible.                                              | blocking                      |
| User acceptance authority       | output does not replace user acceptance with Codex/PBE judgment.                                                              | blocking                      |
| Compatibility boundary          | supplemental compatibility evidence remains warning-only unless separately promoted or cleaned up.                            | warning or decision-required  |

## Proposed Report Artifacts

The scoped Todo Search validator creates the first two artifacts below under
`examples/adoption/todo-search-slice/generated/`. The CI manifest is implemented for the manual workflow and now carries
Todo Search, Todo App PBE Run, and aggregate summary fields for the next workflow run. Repo-wide CI evidence and
enforcement remain future-only.

| Artifact                               | Role                                                                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read-model-validation-report.json`    | Machine-readable validator-backed Evidence summary. Implemented for Todo Search scoped validation.                                                                                     |
| `read-model-validation-report.md`      | Human-readable validation summary for review and Approval Brief use. Implemented for Todo Search.                                                                                      |
| `read-model-ci-evidence-manifest.json` | CI-backed manifest linking commit, run identity, validation commands, aggregate status, and produced artifacts. Implemented for the manual workflow; repo-wide CI remains future-only. |
| `read-model-validation-summary.md`     | Optional concise summary for promotion or scoped execution review packages.                                                                                                            |

## Implemented And Future CLI / CI Surfaces

Implemented scoped command:

```text
pbe graph read-model validate --slice <path>
```

For the current bounded pilot this produces:

```text
examples/adoption/todo-search-slice/generated/read-model-validation-report.json
examples/adoption/todo-search-slice/generated/read-model-validation-report.md
```

Future command candidates:

```text
pbe graph read-model validate --all
pbe graph read-model validate --slice <path> --ci-manifest <file>
```

The scoped command is local validator-backed Evidence only. The later CI workflow implementation is manual and
non-enforcing. These records do not add repo-wide `--all` enforcement, schema enforcement, source authority changes, or
promotion approval.

The CI-backed workflow integration design and first non-enforcing manual workflow are recorded separately in
[ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md). That document
defines CI trigger modes, command sequence, artifact outputs, status semantics, and waiver boundaries. The implemented
workflow is `.github/workflows/read-model-evidence.yml` with manual `workflow_dispatch` only. The first worker run
review records run `28151296796` as Todo Search `ci-evidence-pass` with `validation-pass` and `comparison-pass`. The
later aggregate-enabled run `28156403793` is reviewed as `ci-evidence-pass` with Todo Search `validation-pass` /
`comparison-pass`, Todo App PBE Run `validation-pass`, and aggregate `aggregate-pass`. Post-update run `28157938343`
reviews the same aggregate-enabled workflow after the workflow moved to Node 24 action/runtime settings.

[pr-informational-read-model-evidence-design.md](pr-informational-read-model-evidence-design.md) now designs a future
PR informational mode. It is visibility-only design and does not change the implemented workflow, add enforcement, or
change source authority.

Run `28156403793` also records a CI hygiene warning: GitHub Actions reports Node.js 20 deprecation for the current
action versions. This warning did not fail validator-backed or CI-backed Evidence. It has been handled for the manual
workflow by updating to `actions/checkout@v7`, `actions/setup-node@v6`, `node-version: 24`, and
`actions/upload-artifact@v7`; post-update run `28157938343` completed successfully without the Node.js 20 deprecation
annotation. Future GitHub Actions runtime changes remain ordinary CI hygiene.

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

Validator-backed Evidence is now present for the current Todo Search scoped pilot. CI-backed Evidence is not required to
keep the scoped pilot active under observation. Current parity is `comparison-pass`, validation status is
`validation-pass`, fallback is retained, and retained warnings remain visible.

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
- [ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md) defines the
  CI workflow integration design and records the non-enforcing manual workflow without introducing CI enforcement or
  changing source authority.

## Explicit Non-Scope

The scoped validator implementation does not:

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

After scoped validator-backed Evidence and reviewed CI-backed Evidence are available, the next user decision should
choose one of:

1. `Keep workflow manual/non-enforcing and observe`
2. `Observe PR informational runs under policy`
3. `Design CI enforcement / required check policy`
4. `Require multi-slice validation design before broader CI`
5. `Require public-doc cleanup before broader promotion`
6. `Defer or reject broader execution/enforcement path`

Recommended next step: keep the workflow manual/non-enforcing and observe, or proceed through the multi-slice path by
using the new Evidence-only aggregate summary after per-slice reports remain stable. The Todo Search profile extraction
is complete, `examples/valid/todo-app-pbe-run` is implemented as a second `structure-only` profile with local generated
and validation Evidence, both validation reports now carry self-contained per-slice independence metadata, and
`pbe graph read-model summarize --slices ...` can write the first aggregate summary. The second fixture is not
parity-backed, pilot-marker-backed, CI-backed, or source-authority bearing. PR informational trigger behavior is now
implemented and reviewed in PR run `28207822252` as a non-enforcing visibility signal. Local registry-backed
`validate --all` is now implemented as non-enforcing Evidence; CI workflow consumption, enforcement, cleanup, broader
promotion review, and rollback/defer remain separate decisions. Further PR observation should follow
[pr-informational-observation-policy.md](pr-informational-observation-policy.md).
All-slice validation follows
[read-model-validate-all-contract.md](read-model-validate-all-contract.md); workflow changes or enforcement mode remain
future decisions.
Registry fixture and test planning for that path is recorded in
[read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md).
Registry storage/location tradeoffs are recorded in
[read-model-slice-registry-storage-decision.md](read-model-slice-registry-storage-decision.md).
The candidate registry fixture now exists at `examples/read-model-aggregate/read-model-slices.json`. Local
`validate --all` consumes it after comparing entries against the in-code profiles; existing single-slice validator
behavior still uses the implemented profile configuration directly.

## Gate Self-Check

| Gate                                  | Result | Notes                                                                                       |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Design / Implementation Boundary Gate | Pass   | Scoped validator and non-enforcing manual CI workflow are implemented only for Todo Search. |
| Non-CI-Enforcement Gate               | Pass   | CI enforcement and required checks are not introduced.                                      |
| Source Authority Boundary Gate        | Pass   | Source authority remains scoped and unchanged.                                              |
| Non-Full-Promotion Gate               | Pass   | Full Graph-source promotion remains unapproved.                                             |
| Validator/CI Evidence Clarity Gate    | Pass   | CLI success, validator-backed Evidence, and CI-backed Evidence are separated.               |
| User Approval Boundary Gate           | Pass   | Validator/CI pass remains Evidence, not user approval.                                      |
| Retained Warning Visibility Gate      | Pass   | Warnings remain explicit.                                                                   |
| Scope-Level Separation Gate           | Pass   | Scoped, multi-slice, and repo-wide readiness levels are separated.                          |

## Final Non-Implementation Statement

This design now records both the validator/CI Evidence model and the bounded Todo Search validator-backed Evidence
implementation status. A non-enforcing manual CI workflow exists, but CI enforcement is not introduced. The design does
not change source authority, does not expand the Todo Search scoped pilot, and does not approve full Graph-source
promotion.
