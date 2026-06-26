# Multi-Slice Read-Model Validation Design

Status: multi-slice-read-model-validation-design / aggregate-ci-backed-run-reviewed / validate-all-not-started

## Design Purpose

This document defines the next concept/design step after the Todo Search scoped pilot obtained local validator-backed
Evidence and reviewed CI-backed Evidence.

It answers:

- how to approach read-model validation beyond one Todo Search-shaped slice
- which next slice is safe to study first
- what Todo Search hardcoding must be isolated before a second slice is added
- how per-slice validation and later aggregation should behave
- why multi-slice validation is Evidence only, not source authority expansion or full Graph-source promotion

This document originally did not implement a CLI refactor, second slice generator, validator change, CI workflow change,
PR/push trigger, enforcement mode, source authority expansion, public-doc cleanup, tree-native retirement, or full
promotion. Later bounded implementation added the Todo Search profile extraction, the Todo App PBE Run structure-only
profile, per-slice report independence, the first aggregate summary, and a manual-dispatch workflow update that runs the
aggregate command. These remain Evidence-only and do not implement `validate --all` or CI enforcement.

## Current Baseline

| Baseline item                 | Current state                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Primary scoped pilot          | `examples/adoption/todo-search-slice`                                                                            |
| Generated read-model Evidence | present for Todo Search                                                                                          |
| Manual parity artifact        | present for Todo Search                                                                                          |
| View Instance Manifest        | present for Todo Search                                                                                          |
| Local validator-backed status | `validation-pass`                                                                                                |
| Reviewed CI-backed status     | Todo Search run `28151296796`, aggregate run `28156403793`, and Node 24 run `28157938343` are `ci-evidence-pass` |
| Generated/manual parity       | `comparison-pass`                                                                                                |
| Mismatch/blocking/decision    | 0 / 0 / 0                                                                                                        |
| Active observation            | `keep-active-with-retained-warnings`                                                                             |
| Current scope boundary        | Todo Search selected slice only                                                                                  |
| Current authority boundary    | Scoped pilot only; no repository-wide source authority change, no full promotion, no CI enforcement              |

Reviewed CI-backed Evidence is recorded in
[ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md). Run `28156403793` reviews the
aggregate-enabled bundle for Todo Search, Todo App PBE Run, and the aggregate summary. Run `28157938343` reviews the
same aggregate-enabled workflow after the Node 24 action/runtime update. These runs are Evidence only. They do not
approve a broader pilot, required checks, branch protection, PR/push triggers, source authority expansion, public-doc
cleanup, tree-native retirement, or full Graph-source promotion.

The PR informational trigger design is now recorded in
[pr-informational-read-model-evidence-design.md](pr-informational-read-model-evidence-design.md). It is a future
visibility design only; the implemented workflow remains `workflow_dispatch` only.

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

| Candidate                                               | Role                                                    | Strengths                                                                                                                                                                 | Gaps / risks                                                                                                               | Design decision                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `examples/adoption/todo-search-slice`                   | Current baseline slice                                  | Full generated/manual read-model shape, View Instance Manifest, pilot marker, local validator, reviewed CI artifact.                                                      | Todo-shaped hardcoding in builder and validator policy.                                                                    | Remains first profile and regression baseline.                                             |
| `examples/valid/todo-app-pbe-run`                       | Second structure-only validation fixture                | Canonical `.pbe` layout; Product/Project/Work/Test/Evidence/Acceptance/Change/Impact/Cycle Tree, Cycle Contract, WorkGraph, source-of-truth matrix, evidence text output. | No manual parity artifact, no View Instance Manifest, no pilot marker, no CI-backed Evidence, no runnable runtime fixture. | Implemented as a `structure-only` profile/fixture, not parity-backed or authority-bearing. |
| `examples/dogfooding/windows-validation-sequential-run` | Medium later candidate                                  | Useful dogfooding example and Windows validation context.                                                                                                                 | Missing or weaker Project/Cycle/Change/Impact coverage for first multi-slice expansion.                                    | Defer until after the canonical `.pbe` layout candidate is understood.                     |
| `examples/adoption/compatibility-mismatch-slice`        | Supplemental compatibility warning/control-node fixture | Real ACEP/task-card wording mismatch and compatibility boundary Evidence.                                                                                                 | Not a full Product/Project/Work/Test/Evidence/Acceptance slice.                                                            | Keep as warning/control-node supplemental fixture only.                                    |
| `examples/invalid/*`                                    | Later negative validation fixture family                | Useful for proving failure modes and error messages.                                                                                                                      | Invalid by design; not a read-model generation target.                                                                     | Use later for negative validation tests, not for first positive multi-slice generation.    |

## Selected Next Candidate

The next candidate is:

```text
examples/valid/todo-app-pbe-run
```

Implemented stance:

- treat it as a structural validation target
- read its canonical `.pbe` layout as source inputs
- generate and validate structure-only read-model Evidence only
- do not make it a scoped source-authority pilot
- do not treat it as a full Graph-source promotion candidate
- do not require a runtime fixture before structural validation design
- do not require a manual parity artifact, View Instance Manifest, pilot marker, or CI-backed Evidence

Expected first validation level for this candidate:

```text
structure-only
```

Current implementation summary:

| Item              | Status                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Profile id        | `todo-app-pbe-run-structure-only`                                                              |
| Source layout     | `canonical-pbe`                                                                                |
| Generated output  | `examples/valid/todo-app-pbe-run/generated/generated-read-model.json`                          |
| Evidence manifest | `examples/valid/todo-app-pbe-run/generated/read-model-evidence-manifest.json`                  |
| Validation report | `examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json`                  |
| Node / edge count | 22 nodes / 38 edges                                                                            |
| Validation status | `validation-pass`, 16 checks, 0 warning / 0 blocking / 0 decision-required                     |
| Boundary          | Structure-only Evidence; no parity-backed, pilot-marker-backed, CI-backed, or authority claim. |

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

The first extraction step is now implemented for Todo Search:

```text
SliceReadModelConfig
```

`cli/src/core/read-model-evidence.ts` defines the Todo Search profile/config explicitly and keeps generated output,
parity, validation, retained warnings, and source-authority boundaries behaviorally unchanged for
`examples/adoption/todo-search-slice`.

This remains a single-slice profile extraction. It is not a second slice implementation, aggregate validator, CI workflow
change, enforcement mode, source authority expansion, or full promotion.

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

1. Extract Todo Search profile/config without behavior change. Status: complete for the Todo Search profile.
2. Prove Todo Search generated output, parity report, validation report, and CI-backed manifest semantics remain
   unchanged. Status: local generated/parity/validation checks remain 40 nodes, 59 edges, `comparison-pass`,
   `validation-pass`, and 20 validation checks.
3. Add/read `examples/valid/todo-app-pbe-run` as a second `structure-only` fixture. Status: complete for one canonical
   `.pbe` fixture, with generated structure-only output and validation report.
4. Add per-slice validation report independence. Status: complete for the Todo Search and Todo App PBE Run validation
   reports.
5. Add aggregation only after per-slice validation is stable. Status: first Evidence-only aggregate summary implemented
   and included in the non-enforcing manual workflow for the next CI run review.

## Validation Policy Levels

| Policy level          | Meaning                                                                                                               | Required inputs / status                                                                                                           | Example current or future use                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `structure-only`      | Validate that a slice can be read structurally into Node/Edge/Tag and 7 Core View-shaped records.                     | Source artifacts exist; generated/manual parity may be absent; pilot marker may be absent; runtime fixture not required.           | First target for `examples/valid/todo-app-pbe-run`.                            |
| `parity-backed`       | Validate generated output against a manual parity artifact.                                                           | Generated output plus manual parity artifact and comparison report.                                                                | Todo Search before scoped pilot execution.                                     |
| `pilot-marker-backed` | Validate active scoped pilot boundaries and fallback/reference markers.                                               | Generated output, parity pass, validation report, scoped pilot marker, fallback/reference status.                                  | Current Todo Search active scoped pilot.                                       |
| `ci-backed`           | Validate a reviewed CI run and uploaded artifact manifest for a declared slice or declared aggregate Evidence bundle. | CI run identity, artifact bundle, CI manifest, validator/parity/aggregate summaries, source boundary and non-promotion statements. | Todo Search run `28151296796`; aggregate runs `28156403793` and `28157938343`. |

Policy level is not source authority. It is an Evidence classification.

## Multi-Slice Aggregation Rules

Aggregation should summarize independent per-slice reports. It must not hide slice-specific warnings or convert
compatibility caveats into a global pass.

The first aggregate summary contract is now implemented in
[read-model-aggregate-summary-contract.md](read-model-aggregate-summary-contract.md).

Implemented command:

```text
pbe graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run
```

Implemented outputs:

- `examples/read-model-aggregate/generated/read-model-aggregate-summary.json`
- `examples/read-model-aggregate/generated/read-model-aggregate-summary.md`

The command reads existing per-slice validation reports only. It does not run generation, comparison, validation,
`validate --all`, source authority transition, or promotion readiness approval. The non-enforcing manual workflow now
runs this command after producing the two per-slice validation reports. Runs `28156403793` and `28157938343` reviewed the
aggregate-enabled artifact bundle as CI-backed Evidence, with `28157938343` confirming the Node 24 action/runtime
update. The workflow remains `workflow_dispatch` only and non-enforcing.

## Per-Slice Validation Report Independence Contract

The Todo Search and Todo App PBE Run validation reports are now self-contained Evidence units. Each report includes:

- `profileId` / `sliceProfile`
- `sourceSlice`
- `sourceLayout`
- `policyLevel`
- `evidenceLevel`
- `scopeLevel`
- declared expected node, edge, and validation-check counts
- generated read-model path and observed node/edge counts
- parity requirement/status/path
- pilot marker requirement/status/path
- runtime fixture requirement/status/path or structure-only attached-evidence status
- retained warnings / accepted limitations
- source authority boundary
- non-promotion statement
- fallback/reference summary
- cross-slice dependency rule

The contract rule is:

```text
Validation uses the target slice profile, generated artifacts, and declared source inputs only. It must not depend on
another slice generated directory, manual parity artifact, pilot marker, or runtime fixture unless that artifact is
declared by this profile.
```

Current report independence status:

| Slice                                 | Profile id                        | Policy level          | Independence status | Notes                                                                                  |
| ------------------------------------- | --------------------------------- | --------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `examples/adoption/todo-search-slice` | `todo-search-selected-slice`      | `pilot-marker-backed` | implemented         | Requires its own parity report, pilot marker, runtime fixture, fallback references.    |
| `examples/valid/todo-app-pbe-run`     | `todo-app-pbe-run-structure-only` | `structure-only`      | implemented         | Does not require Todo Search generated files, manual parity, pilot marker, or fixture. |

Focused tests prove:

- structure-only validation still passes after the Todo Search slice is removed from an isolated temp workspace
- Todo Search validation still passes after the Todo App generated directory is removed from an isolated temp workspace
- validators do not mutate source/manual/generated inputs except for their own validation report outputs

This contract prepares future aggregate inputs, and the first aggregate summary now reads those reports as independent
Evidence units. It still does not implement `validate --all`, aggregate validation execution, CI enforcement, or
promotion readiness approval.

Proposed aggregate statuses:

| Aggregate status    | Rule                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `aggregate-pass`    | All included slices pass their declared policy level with no warning/blocking/decision-required records. |
| `aggregate-warning` | No slice is blocking or decision-required, but at least one slice has warnings.                          |
| `aggregate-blocked` | At least one slice has blocking status.                                                                  |
| `decision-required` | At least one slice requires user judgment, or aggregate scope/policy level is ambiguous.                 |

Current aggregate result:

| Aggregate artifact                                                          | Included slices | Status           | Warning / blocking / decision-required |
| --------------------------------------------------------------------------- | --------------- | ---------------- | -------------------------------------- |
| `examples/read-model-aggregate/generated/read-model-aggregate-summary.json` | 2               | `aggregate-pass` | 0 / 0 / 0                              |
| `examples/read-model-aggregate/generated/read-model-aggregate-summary.md`   | 2               | `aggregate-pass` | 0 / 0 / 0                              |

Rules:

- one blocking slice blocks aggregate pass
- one decision-required slice makes the aggregate decision-required
- warnings remain attached to the originating slice
- supplemental compatibility warnings remain supplemental and must not be counted as a full slice
- invalid examples should be reported under negative-fixture results, not positive aggregate pass/fail
- aggregate summary includes slice list, policy level per slice, source input availability, retained warnings, and
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

## Current Staged Implementation Path

The staged path is:

1. Keep Todo Search as the regression baseline and active scoped pilot.
2. Keep `examples/valid/todo-app-pbe-run` at `structure-only` until a later user decision adds parity, pilot marker, or
   CI-backed Evidence.
3. Add aggregate summary only after per-slice validation is stable. This is now implemented as Evidence-only output.
4. Add PR informational visibility only after manual and aggregate Evidence are stable. This is now implemented and
   reviewed in PR run `28207822252` as non-enforcing PR informational Evidence.
5. Observe more PR informational runs under [pr-informational-observation-policy.md](pr-informational-observation-policy.md)
   before changing filters, failure semantics, or enforcement policy.
6. Use [read-model-validate-all-contract.md](read-model-validate-all-contract.md) as the design-only contract for any
   future all-slice validation implementation. It defines slice registry fields, execution modes, and aggregate
   semantics without implementing `validate --all`.
7. Use [read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md) to design registry
   fixtures, positive/negative fixtures, and non-mutation tests before implementing registry parsing or `validate --all`.
8. Use [read-model-slice-registry-storage-decision.md](read-model-slice-registry-storage-decision.md) for the selected
   candidate registry location, now materialized as `examples/read-model-aggregate/read-model-slices.json`.
9. Treat the candidate registry as reviewable and parser-tested metadata until a separate command-consumption
   implementation is approved.

Do not move next to `validate --all`, required checks, enforcement, or broad CI changes without a separate user
decision.

## Approval Brief Draft

### Intent Understood

PBE is deciding how to move from one scoped Todo Search read-model Evidence path toward multi-slice validation without
expanding source authority or hiding warnings.

### Result Summary

The design selects `examples/valid/todo-app-pbe-run` as the next structural candidate, records non-candidate roles for
compatibility and invalid examples, inventories Todo Search hardcoding, proposes a slice profile/config strategy,
defines validation policy levels, and defines conservative aggregation rules.

### Verification Summary

| Check                     | Status          | Summary                                                                                          |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| Todo Search baseline      | present         | Local validator-backed and reviewed CI-backed Evidence exist.                                    |
| Next candidate            | selected        | `examples/valid/todo-app-pbe-run` selected for structural design, not implementation.            |
| Todo hardcoding           | visible         | Current builder remains Todo-shaped and needs profile extraction before second slice.            |
| Per-slice independence    | implemented     | Each validation report now carries profile, policy, requirement, warning, and fallback metadata. |
| Aggregation rules         | design-recorded | Blocking and decision-required statuses propagate; warnings remain slice-specific.               |
| Source authority boundary | preserved       | Multi-slice validation is Evidence-only.                                                         |
| Public-doc cleanup        | deferred        | Not required before design; prerequisite/caveat before broader promotion.                        |
| Second structure fixture  | implemented     | `examples/valid/todo-app-pbe-run` now has structure-only generated/validation Evidence.          |
| Aggregation               | implemented     | First Evidence-only summary command exists; no `validate --all`, CI change, or enforcement.      |

### Remaining Judgment

The user must decide the next implementation branch:

```text
add aggregate summary after per-slice validation reports remain stable
```

or choose a different branch such as parity design for `todo-app-pbe-run`, negative fixtures, cleanup, enforcement
design, multi-slice scope redesign, or continued observation.

## Control Node Summary

| Control record                      | Family                     | Status                       | Reason                                                                                                                   |
| ----------------------------------- | -------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Multi-slice validation design       | Decision Control Node      | design-recorded              | The expansion strategy is documented; aggregation remains unimplemented.                                                 |
| Todo Search hardcoding              | Evidence / Impact Control  | resolved for first profile   | Todo assumptions are isolated into an explicit profile/config.                                                           |
| `todo-app-pbe-run` candidate        | Evidence Control Node      | implemented / structure-only | It has canonical `.pbe` source inputs plus structure-only generated/validation output.                                   |
| Compatibility mismatch supplemental | Compatibility Control Node | retained warning             | Public-doc cleanup remains deferred and warning-only.                                                                    |
| Aggregate summary                   | Evidence Control Node      | implemented / Evidence-only  | First aggregate summary reads existing per-slice validation reports only.                                                |
| Aggregate CI-backed review          | Evidence Control Node      | reviewed                     | Runs `28156403793` and `28157938343` reviewed the aggregate-enabled artifact bundle as non-enforcing CI-backed Evidence. |
| Aggregate validation                | Decision Control Node      | deferred                     | `validate --all`, aggregate validation execution, and enforcement remain separate.                                       |
| Validate-all contract               | Decision Control Node      | design-recorded              | The all-slice registry and execution-mode contract is documented, but no CLI implementation exists.                      |
| Slice registry test strategy        | Evidence / Decision Node   | design-recorded              | Future registry fixtures and tests are specified before implementation.                                                  |
| Slice registry parser tests         | Evidence / Decision Node   | parser-tests-implemented     | The candidate file is parsed and compared to in-code profiles by tests; CLI command consumption remains unapproved.      |
| PR informational trigger            | Decision Control Node      | implemented / reviewed       | PR visibility is implemented as non-enforcing informational Evidence and reviewed in PR run `28207822252`.               |
| CI enforcement / required checks    | Decision Control Node      | not approved                 | Reviewed CI-backed Evidence exists, but enforcement and required checks remain future-only.                              |

## Gate Self-Check

| Gate                               | Status | Result                                                                                   |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Design-Only Gate                   | pass   | The design remains non-authority; the referenced implementation is bounded fixture work. |
| Multi-Slice Evidence Boundary Gate | pass   | Multi-slice validation is Evidence-only.                                                 |
| Source Authority Boundary Gate     | pass   | No source authority expansion or tree-native retirement is proposed.                     |
| Non-CI-Enforcement Gate            | pass   | No required checks, branch protection, PR/push triggers, or enforcement are introduced.  |
| Non-Full-Promotion Gate            | pass   | Full Graph-source promotion remains unapproved.                                          |
| Candidate Slice Clarity Gate       | pass   | `todo-app-pbe-run` is a structural candidate; other examples keep bounded roles.         |
| Todo Hardcoding Honesty Gate       | pass   | Todo-shaped assumptions are listed and must be isolated before expansion.                |
| Aggregation Rule Clarity Gate      | pass   | Pass/warning/blocking/decision-required propagation rules are implemented for summary.   |
| Public-Doc Cleanup Boundary Gate   | pass   | Cleanup remains deferred and visible.                                                    |
| User Approval Boundary Gate        | pass   | User approval remains required before implementation or broader authority changes.       |

## Final Statement

This design now records the completed Todo Search profile extraction, the second structure-only fixture, per-slice report
independence, the first Evidence-only aggregate summary, and a non-enforcing manual workflow path for aggregate
artifacts. It still does not implement `validate --all`, CI
enforcement, parity-backed validation for the second fixture, source authority expansion, public-doc cleanup, or full
Graph-source promotion.
