# Multi-Slice Read-Model Validation Design

Status: multi-slice-read-model-validation-design / design-recorded / implementation-not-started

## Design Purpose

This document defines the next concept/design step after the Todo Search scoped pilot obtained local validator-backed
Evidence and reviewed CI-backed Evidence.

It answers:

- how to approach read-model validation beyond one Todo Search-shaped slice
- which next slice is safe to study first
- what Todo Search hardcoding must be isolated before a second slice is added
- how per-slice validation and later aggregation should behave
- why multi-slice validation is Evidence only, not source authority expansion or full Graph-source promotion

This document does not implement a CLI refactor, second slice generator, validator change, CI workflow change, PR/push
trigger, enforcement mode, source authority expansion, public-doc cleanup, tree-native retirement, or full promotion.

## Current Baseline

| Baseline item                 | Current state                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Primary scoped pilot          | `examples/adoption/todo-search-slice`                                                               |
| Generated read-model Evidence | present for Todo Search                                                                             |
| Manual parity artifact        | present for Todo Search                                                                             |
| View Instance Manifest        | present for Todo Search                                                                             |
| Local validator-backed status | `validation-pass`                                                                                   |
| Reviewed CI-backed status     | run `28151296796` is `ci-evidence-pass`                                                             |
| Generated/manual parity       | `comparison-pass`                                                                                   |
| Mismatch/blocking/decision    | 0 / 0 / 0                                                                                           |
| Active observation            | `keep-active-with-retained-warnings`                                                                |
| Current scope boundary        | Todo Search selected slice only                                                                     |
| Current authority boundary    | Scoped pilot only; no repository-wide source authority change, no full promotion, no CI enforcement |

Reviewed CI-backed Evidence is recorded in
[ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md). It is Evidence only. It does
not approve a broader pilot, required checks, branch protection, PR/push triggers, source authority expansion, public-doc
cleanup, tree-native retirement, or full Graph-source promotion.

## Multi-Slice Validation Is Not Source Authority Expansion

Multi-slice read-model validation would mean:

```text
PBE can generate or validate read-model Evidence for more than one declared slice and optionally summarize the aggregate
status.
```

It does not mean:

- Maintainability Graph becomes the current operational source for more slices
- tree-native artifacts are retired
- compatibility views become authoritative
- CI validation becomes a required check
- PRs or pushes are blocked
- full Graph-source promotion is approved
- user acceptance authority is replaced by Codex/PBE or CI

Each slice must keep its own source authority boundary, retained warnings, fallback/reference artifacts, and Evidence
level visible.

## Candidate Slice Analysis

| Candidate                                               | Role                                                    | Strengths                                                                                                                                                                 | Gaps / risks                                                                                                            | Design decision                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `examples/adoption/todo-search-slice`                   | Current baseline slice                                  | Full generated/manual read-model shape, View Instance Manifest, pilot marker, local validator, reviewed CI artifact.                                                      | Todo-shaped hardcoding in builder and validator policy.                                                                 | Remains first profile and regression baseline.                                          |
| `examples/valid/todo-app-pbe-run`                       | Next structural validation candidate                    | Canonical `.pbe` layout; Product/Project/Work/Test/Evidence/Acceptance/Change/Impact/Cycle Tree, Cycle Contract, WorkGraph, source-of-truth matrix, evidence text output. | No generated/manual read-model, no View Instance Manifest, no pilot marker, no flat-layout adapter, no runtime fixture. | Selected as next structural validation target, not yet implementation target.           |
| `examples/dogfooding/windows-validation-sequential-run` | Medium later candidate                                  | Useful dogfooding example and Windows validation context.                                                                                                                 | Missing or weaker Project/Cycle/Change/Impact coverage for first multi-slice expansion.                                 | Defer until after the canonical `.pbe` layout candidate is understood.                  |
| `examples/adoption/compatibility-mismatch-slice`        | Supplemental compatibility warning/control-node fixture | Real ACEP/task-card wording mismatch and compatibility boundary Evidence.                                                                                                 | Not a full Product/Project/Work/Test/Evidence/Acceptance slice.                                                         | Keep as warning/control-node supplemental fixture only.                                 |
| `examples/invalid/*`                                    | Later negative validation fixture family                | Useful for proving failure modes and error messages.                                                                                                                      | Invalid by design; not a read-model generation target.                                                                  | Use later for negative validation tests, not for first positive multi-slice generation. |

## Selected Next Candidate

The next candidate is:

```text
examples/valid/todo-app-pbe-run
```

Design stance:

- treat it as a structural validation target
- read its canonical `.pbe` layout as source inputs
- do not generate or validate it in this task
- do not make it a scoped source-authority pilot
- do not treat it as a full Graph-source promotion candidate
- do not require a runtime fixture before structural validation design

Expected first validation level for this candidate:

```text
structure-only
```

## Non-Candidate Roles

### Compatibility Mismatch Slice

`examples/adoption/compatibility-mismatch-slice` remains a supplemental warning/control-node fixture.

It can provide:

- compatibility warning carry-forward
- public-doc cleanup caveat
- Compatibility Control Node examples
- source-authority wording risk observations

It must not become:

- a pilot source scope
- a full generated read-model slice
- an authority-bearing source record
- proof that public-doc cleanup is complete

### Invalid Examples

`examples/invalid/*` should become negative validation fixtures only after positive per-slice validation is stable.

They can later prove:

- missing required source inputs are caught
- invalid tag/view membership is blocked
- invalid authority statements are blocked
- mismatches produce correct warning/blocking/decision-required status

They should not be used as a generated read-model target in the first multi-slice expansion.

## Todo Search Hardcoding Inventory

The current builder/validator path accepts `--slice`, writes outputs relative to the selected slice, and has generic
JSON/Markdown writing, comparison, mismatch, tag validation, view membership validation, confidence/freshness checks,
and partial Check/Evidence mapping.

However, it still contains Todo Search-shaped assumptions:

| Hardcoded area           | Examples / risk                                                                                                  | Design response                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Node ids                 | `PT-SEARCH-001`, `WT-SEARCH-001`, `TT-SEARCH-*`, `AC-SEARCH-*`, `AT-ROOT`.                                       | Move into a slice profile/descriptor.                                                            |
| Contract paths           | `node-execution-contracts/wt-search-001.md`, Todo Search Cycle Contract assumptions.                             | Define profile-level expected contract references.                                               |
| Runtime fixture paths    | Todo Search runtime fixture and command Evidence.                                                                | Treat runtime fixture Evidence as a profile capability, not generic requirement.                 |
| Behavior model           | title + note/content search behaviors, empty query, non-scope tag/date/fuzzy/server/saved search.                | Keep in Todo profile; do not impose on other slices.                                             |
| Warning model            | bounded fixture, partial UI visual Evidence, ACEP cleanup deferred, compatibility supplemental path assumptions. | Separate generic warning carry-forward from slice-specific retained warnings.                    |
| Compatibility path       | Supplemental ACEP task-card warning tied to Todo Search pilot review.                                            | Keep compatibility warning as optional supplemental input, not per-slice required source.        |
| Core View assembly       | Todo Search-specific node/edge coverage for 7 Core Views.                                                        | Use generic view coverage checks over generated records; slice profiles define candidate inputs. |
| Pilot marker assumptions | Scoped pilot marker expected for active Todo Search validation.                                                  | Make pilot marker optional by validation policy level.                                           |

## SliceReadModelConfig / Profile Strategy

Introduce a future design concept:

```text
SliceReadModelConfig
```

or equivalent descriptor/profile.

This is concept-level only in this document.

Possible responsibilities:

- slice id and display name
- source layout type, e.g. `flat-demo-support` or `canonical-pbe`
- required source inputs
- optional source inputs
- unsupported/missing inputs with explicit status
- expected node id mappings
- expected contract references
- expected Check/Evidence mapping strategy
- retained warnings
- compatibility supplemental references
- policy level, e.g. `structure-only`, `parity-backed`, `pilot-marker-backed`, `ci-backed`
- output directory rule
- source-authority boundary statement
- non-promotion statement

Recommended implementation sequence:

1. Extract Todo Search profile/config without behavior change.
2. Prove Todo Search generated output, parity report, validation report, and CI-backed manifest semantics remain unchanged.
3. Add/read `examples/valid/todo-app-pbe-run` as a second `structure-only` fixture.
4. Add per-slice validation report independence.
5. Add aggregation only after per-slice validation is stable.

## Validation Policy Levels

| Policy level          | Meaning                                                                                           | Required inputs / status                                                                                                 | Example current or future use                       |
| --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `structure-only`      | Validate that a slice can be read structurally into Node/Edge/Tag and 7 Core View-shaped records. | Source artifacts exist; generated/manual parity may be absent; pilot marker may be absent; runtime fixture not required. | First target for `examples/valid/todo-app-pbe-run`. |
| `parity-backed`       | Validate generated output against a manual parity artifact.                                       | Generated output plus manual parity artifact and comparison report.                                                      | Todo Search before scoped pilot execution.          |
| `pilot-marker-backed` | Validate active scoped pilot boundaries and fallback/reference markers.                           | Generated output, parity pass, validation report, scoped pilot marker, fallback/reference status.                        | Current Todo Search active scoped pilot.            |
| `ci-backed`           | Validate a reviewed CI run and uploaded artifact manifest for a declared slice.                   | CI run identity, artifact bundle, CI manifest, validator/parity summaries, source boundary and non-promotion statements. | Todo Search run `28151296796`.                      |

Policy level is not source authority. It is an Evidence classification.

## Multi-Slice Aggregation Rules

Aggregation should summarize independent per-slice reports. It must not hide slice-specific warnings or convert
compatibility caveats into a global pass.

Proposed aggregate statuses:

| Aggregate status    | Rule                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `aggregate-pass`    | All included slices pass their declared policy level with no warning/blocking/decision-required records. |
| `aggregate-warning` | No slice is blocking or decision-required, but at least one slice has warnings.                          |
| `aggregate-blocked` | At least one slice has blocking status.                                                                  |
| `decision-required` | At least one slice requires user judgment, or aggregate scope/policy level is ambiguous.                 |

Rules:

- one blocking slice blocks aggregate pass
- one decision-required slice makes the aggregate decision-required
- warnings remain attached to the originating slice
- supplemental compatibility warnings remain supplemental and must not be counted as a full slice
- invalid examples should be reported under negative-fixture results, not positive aggregate pass/fail
- aggregate summary must include slice list, policy level per slice, source input availability, retained warnings, and
  source-authority boundary
- aggregate pass is Evidence only and does not approve broader source authority

## Source Authority Boundary

Multi-slice validation remains Evidence-only.

It does not:

- change current operational source
- expand the Todo Search scoped pilot authority
- make `examples/valid/todo-app-pbe-run` source-authority pilot scope
- retire tree-native or `.pbe` artifacts
- make generated read-model outputs the repository source
- approve full Graph-source promotion
- introduce CI enforcement
- replace user acceptance authority

Every per-slice report and future aggregate report must include a source-authority boundary statement and a
non-promotion statement.

## Public-Doc Cleanup Stance

Public-doc cleanup is not required before this multi-slice validation design.

However, the ACEP task-card wording risk remains a retained compatibility warning:

- `docs/source-of-truth-matrix.md` can be read as assigning ACEP authority to executable task cards.
- `docs/acep.md` and `docs/parallel-execution.md` contain supporting task-card-centered wording.
- README, AGENTS, and `docs/execution-contracts.md` provide the safer canonical interpretation:
  ACEP packages Cycle Contract and Node Execution Contract; task cards are compatibility/human-friendly views.

Design stance:

- proceed with multi-slice validation design under warning
- keep compatibility-mismatch supplemental slice as warning/control-node Evidence
- do not perform public-doc cleanup in this task
- treat cleanup as prerequisite or explicit caveat before broader Graph-source promotion

## Next Implementation Path

When the user approves implementation later, proceed in this order:

1. Extract Todo Search profile/config without behavior change.
2. Prove outputs unchanged with focused tests and existing generate/compare/validate commands.
3. Add `examples/valid/todo-app-pbe-run` as a second `structure-only` profile.
4. Generate/validate per-slice reports independently.
5. Add aggregate summary only after per-slice validation is stable.

Do not start with `validate --all`, PR triggers, required checks, or broad CI changes.

## Approval Brief Draft

### Intent Understood

PBE is deciding how to move from one scoped Todo Search read-model Evidence path toward multi-slice validation without
expanding source authority or hiding warnings.

### Result Summary

The design selects `examples/valid/todo-app-pbe-run` as the next structural candidate, records non-candidate roles for
compatibility and invalid examples, inventories Todo Search hardcoding, proposes a slice profile/config strategy,
defines validation policy levels, and defines conservative aggregation rules.

### Verification Summary

| Check                     | Status          | Summary                                                                                   |
| ------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| Todo Search baseline      | present         | Local validator-backed and reviewed CI-backed Evidence exist.                             |
| Next candidate            | selected        | `examples/valid/todo-app-pbe-run` selected for structural design, not implementation.     |
| Todo hardcoding           | visible         | Current builder remains Todo-shaped and needs profile extraction before second slice.     |
| Aggregation rules         | design-recorded | Blocking and decision-required statuses propagate; warnings remain slice-specific.        |
| Source authority boundary | preserved       | Multi-slice validation is Evidence-only.                                                  |
| Public-doc cleanup        | deferred        | Not required before design; prerequisite/caveat before broader promotion.                 |
| Implementation            | not started     | No CLI, validator, CI, workflow, or generated artifact changes are made by this document. |

### Remaining Judgment

The user must decide whether to approve the first implementation step:

```text
Extract Todo Search profile/config without behavior change
```

or choose cleanup, enforcement design, multi-slice scope redesign, or continued observation first.

## Control Node Summary

| Control record                      | Family                     | Status                        | Reason                                                                                  |
| ----------------------------------- | -------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| Multi-slice validation design       | Decision Control Node      | design-recorded               | The next expansion strategy is documented but not approved for implementation.          |
| Todo Search hardcoding              | Evidence / Impact Control  | active implementation warning | Hardcoding must be isolated before a second slice can be trusted.                       |
| `todo-app-pbe-run` candidate        | Evidence Control Node      | candidate / structure-only    | It has canonical `.pbe` source inputs but no read-model generated artifacts yet.        |
| Compatibility mismatch supplemental | Compatibility Control Node | retained warning              | Public-doc cleanup remains deferred and warning-only.                                   |
| Aggregate validation                | Decision Control Node      | deferred                      | Aggregation should wait until per-slice reports are independent.                        |
| CI enforcement / PR triggers        | Decision Control Node      | not approved                  | Reviewed CI-backed Evidence exists, but enforcement and PR triggers remain future-only. |

## Gate Self-Check

| Gate                               | Status | Result                                                                                  |
| ---------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Design-Only Gate                   | pass   | This document defines design only.                                                      |
| Multi-Slice Evidence Boundary Gate | pass   | Multi-slice validation is Evidence-only.                                                |
| Source Authority Boundary Gate     | pass   | No source authority expansion or tree-native retirement is proposed.                    |
| Non-CI-Enforcement Gate            | pass   | No required checks, branch protection, PR/push triggers, or enforcement are introduced. |
| Non-Full-Promotion Gate            | pass   | Full Graph-source promotion remains unapproved.                                         |
| Candidate Slice Clarity Gate       | pass   | `todo-app-pbe-run` is a structural candidate; other examples keep bounded roles.        |
| Todo Hardcoding Honesty Gate       | pass   | Todo-shaped assumptions are listed and must be isolated before expansion.               |
| Aggregation Rule Clarity Gate      | pass   | Pass/warning/blocking/decision-required propagation rules are explicit.                 |
| Public-Doc Cleanup Boundary Gate   | pass   | Cleanup remains deferred and visible.                                                   |
| User Approval Boundary Gate        | pass   | User approval remains required before implementation or broader authority changes.      |

## Final Statement

This design does not implement multi-slice validation. It records the evidence boundary, candidate strategy, hardcoding
risks, profile direction, aggregation rules, and next implementation path for a later user-approved task.
