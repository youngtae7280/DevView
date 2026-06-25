# Read-Model Aggregate Summary

Status: aggregate-pass

## Run Identity

- Summarized at: 2026-06-25T07:57:45.994Z
- Command identity:
  `pbe graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run`
- Source commit: 16d15c1
- Source mode: existing-per-slice-validation-reports-only
- Input reports: `examples/adoption/todo-search-slice/generated/read-model-validation-report.json`,
  `examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json`

## Boundary

Aggregate read-model summary is Evidence-only over existing per-slice validation reports. It does not expand source
authority, introduce CI enforcement, approve promotion, run validation, or replace user approval.

Aggregate-pass is not user acceptance, source-authority expansion, CI enforcement, or full Graph-source promotion.

## Decision Rule

- Any slice with blocking status, missing report, or malformed report => aggregate-blocked.
- Otherwise, any decision-required slice => decision-required.
- Otherwise, any warning slice => aggregate-warning.
- All included slices validation-pass with 0 warning/blocking/decision-required => aggregate-pass.

## Aggregate Counts

- Included slices: 2
- Present reports: 2
- Missing reports: 0
- Malformed reports: 0
- Validation-pass slices: 2
- Warnings: 0
- Blocking: 0
- Decision required: 0
- Retained warnings / accepted limitations: 6

## Per-Slice Summary

| Slice                                 | Profile                           | Policy              | Layout            | Validation      | Checks | Warnings | Blocking | Decision Required | Parity       | Pilot Marker | Runtime Fixture        |
| ------------------------------------- | --------------------------------- | ------------------- | ----------------- | --------------- | ------ | -------- | -------- | ----------------- | ------------ | ------------ | ---------------------- |
| `examples/adoption/todo-search-slice` | `todo-search-selected-slice`      | pilot-marker-backed | flat-demo-support | validation-pass | 20     | 0        | 0        | 0                 | pass         | present      | present                |
| `examples/valid/todo-app-pbe-run`     | `todo-app-pbe-run-structure-only` | structure-only      | canonical-pbe     | validation-pass | 16     | 0        | 0        | 0                 | not-required | not-required | attached-evidence-only |

## Source Authority / Non-Promotion Boundary By Slice

### examples/adoption/todo-search-slice

- Source authority boundary: Validator-backed Evidence checks the bounded Todo Search read-model outputs only. It does
  not change source authority.
- Non-promotion statement: Validation pass is Evidence only. It does not promote Maintainability Graph, expand pilot
  scope, retire tree-native artifacts, introduce CI enforcement, or replace user approval.
- Report status: present
- Report path: `examples/adoption/todo-search-slice/generated/read-model-validation-report.json`
- Retained warnings / accepted limitations:
  - RW-BOUNDED-FIXTURE: acceptable-warning - Bounded fixture Evidence is not full Todo app implementation.
  - RW-PARTIAL-UI: acceptable-warning - UI screenshot/manual visual Evidence remains partial for the no-result empty
    state.
  - RW-GENERATED-BUILDER: generated-present-for-bounded-slice - Generated read-model output and scoped validator-backed
    Evidence now exist for the bounded Todo Search slice; CI/full promotion repeatability remains later.
  - RW-ACEP-CLEANUP: deferred-cleanup - ACEP task-card public-doc cleanup remains deferred.
- Notes:
  - Per-slice validation report is interpreted as an independent Evidence unit.
  - Validation uses the target slice profile, generated artifacts, and declared source inputs only. It must not depend
    on another slice generated directory, manual parity artifact, pilot marker, or runtime fixture unless that artifact
    is declared by this profile.

### examples/valid/todo-app-pbe-run

- Source authority boundary: Validator-backed Evidence checks structure-only generated read-model outputs for this
  canonical .pbe fixture. It does not change source authority.
- Non-promotion statement: Structure-only validation pass is Evidence only. It does not promote Maintainability Graph,
  create a source-authority pilot, require parity, introduce CI enforcement, retire .pbe artifacts, or replace user
  approval.
- Report status: present
- Report path: `examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json`
- Retained warnings / accepted limitations:
  - RW-STRUCTURE-ONLY: structure-only-limitation - This profile validates canonical .pbe structure only; no manual
    parity artifact, pilot marker, CI-backed Evidence, or source-authority pilot is required or claimed.
  - RW-NO-RUNTIME-FIXTURE: accepted-structure-only-limitation - The fixture contains attached test-output Evidence but
    no runnable app/runtime fixture is required for structure-only validation.
- Notes:
  - Per-slice validation report is interpreted as an independent Evidence unit.
  - Validation uses the target slice profile, generated artifacts, and declared source inputs only. It must not depend
    on another slice generated directory, manual parity artifact, pilot marker, or runtime fixture unless that artifact
    is declared by this profile.

## Recommended Next Decision Surface

- Keep aggregate summary as Evidence-only and observe report stability
- Design per-slice validation aggregation implementation separately
- Decide whether validate --all is needed after aggregate reports remain stable
- Decide whether CI should run aggregate summarize in non-enforcing mode
- Do not treat aggregate-pass as source promotion or user acceptance
