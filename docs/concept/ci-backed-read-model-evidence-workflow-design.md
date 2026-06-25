# CI-Backed Read-Model Evidence Workflow Design

Status: ci-backed-read-model-evidence-workflow-design / non-enforcing-workflow-implemented / manual-dispatch-only

## Document Purpose

This document defines the CI workflow design for read-model Evidence after the Todo Search scoped read-model validator
became available. The first bounded non-enforcing workflow is now implemented as manual dispatch only.

It explains how CI-backed Evidence can be produced by the manual workflow, how that differs from local
validator-backed Evidence, what commands and artifacts the workflow uses, and how CI results should relate to Approval
Briefs, Control Nodes, Source Transition Path, rollback/fallback, and user judgment.

This document records that `.github/workflows/read-model-evidence.yml` exists for non-enforcing manual CI-backed
Evidence. It does not implement CI enforcement, does not expand pilot scope, does not change source authority, does not
retire tree-native artifacts, does not clean up public docs, and does not approve full Graph-source promotion.

## Current Local Validator-Backed Baseline

| Baseline item              | Current state                                                                |
| -------------------------- | ---------------------------------------------------------------------------- |
| Scoped pilot               | `examples/adoption/todo-search-slice` only                                   |
| Active observation status  | `keep-active-with-retained-warnings`                                         |
| Generated/manual parity    | `comparison-pass`                                                            |
| Local validator command    | `pbe graph read-model validate --slice examples/adoption/todo-search-slice`  |
| Validator-backed status    | `validation-pass`                                                            |
| Validator check count      | 20                                                                           |
| Warning/blocking/decision  | 0 / 0 / 0                                                                    |
| CI-backed Evidence         | reviewed manual run `28151296796` is `ci-evidence-pass`                      |
| Tree-native fallback       | retained and usable                                                          |
| Supplemental compatibility | warning-only, not pilot source scope                                         |
| Current authority boundary | bounded Todo Search scoped pilot; no repository-wide source authority change |

The local validator baseline is enough to keep the scoped pilot active under observation. The non-enforcing manual CI
workflow produced reviewed CI-backed Evidence in run `28151296796`. PR/push triggers, required checks, branch
protection, and enforcement remain unimplemented.

## CI-Backed Evidence Definition

CI-backed read-model Evidence means:

```text
A repeatable CI run executes the declared read-model generation, comparison, and validation commands for a declared
scope and records durable output artifacts, status, run identity, source commit, retained warnings, and source-authority
boundaries.
```

CI-backed Evidence is stronger than local validator-backed Evidence because it can be tied to a branch, pull request,
main commit, scheduled run, or manual workflow run. It reduces local-environment ambiguity and gives reviewers a stable
Evidence reference.

CI-backed Evidence is still Evidence. It is not source promotion, not user approval, and not automatic acceptance.

## Local Validator Vs CI-Backed Evidence

| Aspect                  | Local validator-backed Evidence            | CI-backed Evidence                                                              |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| Execution location      | Developer machine or local command context | CI runner tied to branch, PR, main, schedule, or manual dispatch                |
| Primary proof           | `read-model-validation-report.*`           | CI run result plus generated report artifacts                                   |
| Repeatability signal    | Local repeatability only                   | Independent or shared runner repeatability                                      |
| Artifact durability     | Repository file outputs or local logs      | Uploaded/linked CI artifacts plus optional committed reports                    |
| Enforcement possibility | None unless separately wired               | Can be informational or enforcement, but enforcement requires separate approval |
| User approval relation  | Evidence only; not user approval           | Evidence only; not user approval                                                |
| Source authority effect | None by itself                             | None by itself                                                                  |
| Current status          | implemented for Todo Search scoped slice   | reviewed manual run `28151296796` is `ci-evidence-pass`                         |

## CI Trigger Modes

| Trigger mode                    | Purpose                                                                   | Default stance                      | Enforcement boundary                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `manual-workflow-dispatch`      | Let a user or maintainer request CI-backed Evidence for a selected slice. | Preferred first CI mode             | Informational only unless later approved as a required gate.                                            |
| `local-equivalent-script`       | Mirror the CI command sequence locally before workflow implementation.    | Useful for implementation rehearsal | Local Evidence only; not CI-backed.                                                                     |
| `pr-check-informational`        | Run scoped read-model Evidence on pull requests and report status.        | Possible second mode                | Should not block merge until user approves enforcement.                                                 |
| `pr-required-check-enforcement` | Require validation pass before merge.                                     | Future only                         | Requires separate explicit user approval and clear handling for warnings, waivers, and false positives. |
| `main-post-merge-evidence`      | Produce Evidence after merge to main.                                     | Useful for audit trail              | Evidence-only; does not validate the PR before merge.                                                   |
| `main-scheduled-observation`    | Periodically verify the active scoped pilot remains stable.               | Optional later observation mode     | Evidence-only unless enforcement is approved.                                                           |

Implemented CI target:

```text
.github/workflows/read-model-evidence.yml
```

Implemented trigger:

```text
workflow_dispatch
```

PR, push, scheduled, and required-check modes remain future-only.

## Proposed CI Command Sequence

The implemented CI workflow for the current scoped slice runs the same bounded commands that local validation uses:

```text
npm run build:cli
node dist/cli/index.js graph read-model generate --slice examples/adoption/todo-search-slice --json
node dist/cli/index.js graph read-model compare --generated examples/adoption/todo-search-slice/generated/generated-read-model.json --manual examples/adoption/todo-search-slice/maintainability-graph-read-model.json --json
node dist/cli/index.js graph read-model validate --slice examples/adoption/todo-search-slice --json
```

Implemented supporting commands:

```text
npx vitest run cli/src/__tests__/read-model-evidence.test.ts
npx vitest run examples/adoption/todo-search-slice/runtime-fixture
npm run validate:pbe
npm run validate:pbe:v2
```

Future-only command surfaces:

```text
pbe graph read-model validate --all
pbe graph read-model validate --slice <path> --ci-manifest <file>
```

Those future surfaces are not implemented by this design.

## Implemented And Proposed CI Artifact Outputs

| Artifact output                              | Role                                                                                | Required now?          |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| `generated-read-model.json`                  | Generated Graph-first read-model Evidence.                                          | yes                    |
| `generated-read-model.md`                    | Human-readable generated read-model summary.                                        | yes                    |
| `read-model-parity-report.json`              | Machine-readable generated/manual comparison report.                                | yes                    |
| `read-model-parity-report.md`                | Human-readable parity summary.                                                      | yes                    |
| `read-model-validation-report.json`          | Machine-readable validator-backed Evidence report.                                  | yes                    |
| `read-model-validation-report.md`            | Human-readable validation report.                                                   | yes                    |
| `read-model-ci-evidence-manifest.json`       | CI manifest linking workflow, run id, source commit, commands, outputs, and status. | runtime artifact in CI |
| GitHub Step Summary                          | CI run summary for review.                                                          | yes                    |
| uploaded read-model Evidence artifact bundle | CI artifact containing generated outputs and reports.                               | yes                    |

CI artifacts should preserve:

- run identity: workflow name, trigger mode, run id, source commit, branch or PR, timestamp
- command identity and exit status
- source slice and input artifact list
- generated/parity/validation report references
- retained warnings and Evidence exceptions
- source-authority boundary and non-promotion statement
- recommended next decision surface

## Status Semantics

Concept status labels for CI-backed Evidence:

| Status label          | Meaning                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `ci-evidence-pass`    | CI ran the scoped commands and validator status is `validation-pass`.                     |
| `ci-evidence-warning` | CI completed but warnings remain that need review before broader use or enforcement.      |
| `ci-evidence-blocked` | CI found blocking validation, command, artifact, or boundary failures.                    |
| `decision-required`   | CI completed or partially completed but a user decision is required before safe progress. |

Severity labels should remain:

- `info`
- `warning`
- `blocking`
- `decision-required`

Local `validation-pass` is not the same as `ci-evidence-pass`. The former proves local validator-backed Evidence; the
latter requires a CI run identity and durable CI result.

## Pass / Warn / Fail Semantics

### Non-Enforcement Mode

In non-enforcement mode:

- `ci-evidence-pass` records stronger Evidence but does not approve source transition.
- `ci-evidence-warning` records reviewable warnings without blocking a PR by itself.
- `ci-evidence-blocked` should create or update an Evidence Control Node candidate.
- `decision-required` should surface a user judgment item.

### Enforcement Mode

Enforcement mode is future-only and requires explicit user approval.

If later approved, enforcement should:

- block only on declared `blocking` or `decision-required` conditions
- keep retained warnings visible without silently waiving them
- provide a documented waiver/manual override path
- never treat CI pass as user acceptance or source promotion
- never retire fallback/reference artifacts automatically

## Branch / PR / Main Considerations

| Context            | Recommended use                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Feature branch     | Local validator-backed Evidence plus optional manual CI dispatch.                             |
| Pull request       | Informational CI check first; required check only after separate enforcement approval.        |
| `main` post-merge  | Evidence/audit run to preserve generated reports and validation status for the merged commit. |
| Scheduled main run | Observation run to detect drift in generated/manual parity or retained warning visibility.    |

Generated outputs in CI should not silently rewrite committed source artifacts. If CI-generated outputs differ from
committed generated Evidence, the mismatch should be reported rather than auto-committed.

## Scope Strategy

### Scoped Slice First

The first CI-backed Evidence target should remain:

```text
examples/adoption/todo-search-slice
```

This follows the current bounded scoped pilot and avoids accidental repo-wide promotion or enforcement.

### Later Multi-Slice Validation

Multi-slice validation may be designed only after:

- scoped slice CI-backed Evidence is stable
- source/fallback boundaries are clear for each additional slice
- retained warnings and compatibility caveats can remain slice-specific
- the user approves broader validation scope

### Repo-Wide Promotion Readiness

Repo-wide promotion readiness validation is a later phase. It likely requires CI-backed Evidence, broader source matrix
review, rollback/fallback criteria, compatibility cleanup decisions or waivers, and explicit user promotion review.

## Relation To Approval Brief / Control Nodes / Source Transition

### Approval Brief

CI-backed Evidence may feed an Approval Brief by summarizing:

- CI run identity
- scoped slice
- validation status
- parity status
- retained warnings
- blocking or decision-required checks
- remaining user judgment

It does not replace the Approval Brief or the user approval surface.

### Control Nodes

Possible control candidates:

| Candidate                              | Family                     | Trigger                                                                  |
| -------------------------------------- | -------------------------- | ------------------------------------------------------------------------ |
| CI artifact missing                    | Evidence Control Node      | Broader execution asks for reviewed CI-backed Evidence before it exists. |
| CI evidence blocked                    | Evidence Control Node      | `ci-evidence-blocked` or `decision-required`.                            |
| Enforcement mode request               | Decision Control Node      | User or project asks to make CI validation a required gate.              |
| Generated/manual mismatch              | Evidence / Impact Control  | CI output differs from committed generated/manual parity.                |
| Compatibility warning affects approval | Compatibility Control Node | ACEP cleanup warning affects broader review or promotion judgment.       |
| Source boundary ambiguity              | Impact / Decision Control  | CI output or docs imply broader authority than the scoped pilot allows.  |

### Source Transition Path

CI-backed Evidence can strengthen the Evidence gate for broader execution or promotion review, but it does not change
the Source Transition Path by itself. Any source authority change still requires explicit user approval, fallback
preservation, compatibility boundary review, and Approval Brief judgment.

## Gate Relationship

| Gate                                    | CI-backed Evidence relationship                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Current scoped pilot active observation | Not required; local validator-backed Evidence is enough to keep observing.                                      |
| Broader execution / enforcement         | Strong recommended prerequisite before applying the scoped pattern elsewhere or enforcing parity as a gate.     |
| Full Graph-source promotion review      | CI-backed Evidence or explicit user waiver should be considered before full promotion review.                   |
| Rollback / fallback gate                | CI Evidence can expose drift or missing fallback references, but does not perform rollback or mark it complete. |
| Compatibility gate                      | CI can carry warnings, but public-doc cleanup or waiver remains user-controlled.                                |
| Approval gate                           | CI pass is Evidence, not approval.                                                                              |

## Waiver / Manual Override Boundary

A future waiver or manual override must be explicit when CI-backed Evidence is unavailable or warning/blocked.

Waiver records should include:

- who approved the waiver
- scope of the waiver
- reason and risk
- affected checks
- expiration or review condition
- retained warnings
- why source authority is not silently changed

Codex/PBE cannot create a waiver by self-approval. Waiver does not retire tree-native fallback/reference artifacts.

## Explicit Non-Scope

This implementation and design do not:

- add PR/push/scheduled workflows beyond the manual workflow
- commit CI runtime-generated manifests to the repository
- introduce CI enforcement
- implement `validate --all`
- change source authority
- expand pilot scope
- declare full Graph-source promotion
- clean up public docs
- retire tree-native artifacts
- hide retained warnings
- make CI pass equivalent to user approval

## Recommended Next Decision Surface

After this non-enforcing manual workflow implementation and reviewed run `28151296796`, the next user decision should
choose one of:

1. `Keep workflow manual/non-enforcing and observe`
2. `Design PR informational trigger`
3. `Design CI enforcement / required check policy`
4. `Prepare multi-slice validation design`
5. `Require public-doc cleanup before broader CI or promotion work`
6. `Prepare broader Graph-source promotion review`

Recommended next step: keep the workflow manual/non-enforcing and observe, unless the user chooses the next branch: PR
informational trigger design, enforcement policy design, multi-slice validation, cleanup, broader promotion review, or
rollback/defer.

## Approval Brief Draft

### Intent Understood

PBE is defining how CI-backed read-model Evidence should work after local scoped validator-backed Evidence passed for
the Todo Search selected slice.

### Result Summary

This design defines CI trigger modes, command sequence, artifact outputs, status semantics, pass/warn/fail behavior,
scope strategy, waiver boundaries, and relationship to Approval Briefs, Control Nodes, Source Transition Path, rollback,
and compatibility.

### Verification Summary

| Check                      | Status       | Summary                                                                                                                                          |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local validator baseline   | present      | Todo Search scoped validation is `validation-pass` with 20 checks.                                                                               |
| CI workflow implementation | implemented  | `.github/workflows/read-model-evidence.yml` exists as manual dispatch.                                                                           |
| CI enforcement             | not approved | Enforcement mode remains future-only.                                                                                                            |
| Source authority boundary  | preserved    | CI Evidence would remain Evidence only.                                                                                                          |
| Retained warnings          | visible      | Bounded fixture, partial UI, enforcement gap, and ACEP cleanup remain visible.                                                                   |
| Next user decision         | required     | User must choose whether to keep observing or branch into PR triggers, enforcement, broader scope, cleanup, promotion review, or rollback/defer. |

### Remaining Judgment

The user must decide whether to keep observing locally, design PR informational triggers, design enforcement policy,
prepare multi-slice validation, require public-doc cleanup before broader work, prepare broader promotion review, or
rollback/defer the scoped pilot.

### State Label

```text
Decision required
```

Reason: non-enforcing manual CI workflow implementation exists and run `28151296796` has been reviewed as Todo Search
CI-backed Evidence. Todo Search profile extraction does not change the workflow boundary. PR triggers, enforcement,
broader scope, and promotion authority remain separate decisions.

## Gate Self-Check

| Gate                                   | Result | Notes                                                                                |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Design / Implementation Boundary Gate  | PASS   | Non-enforcing manual workflow is implemented; enforcement and broader scope are not. |
| Workflow Boundary Gate                 | PASS   | Only `.github/workflows/read-model-evidence.yml` is added for manual dispatch.       |
| Non-CI-Enforcement Gate                | PASS   | Enforcement mode remains future-only.                                                |
| Source Authority Boundary Gate         | PASS   | CI-backed Evidence is Evidence only and does not change source authority.            |
| Non-Full-Promotion Gate                | PASS   | Full Graph-source promotion remains unapproved.                                      |
| Local-vs-CI Evidence Separation Gate   | PASS   | Local validator-backed Evidence and CI-backed Evidence are separate.                 |
| User Approval Boundary Gate            | PASS   | CI pass is not user approval.                                                        |
| Retained Warning Visibility Gate       | PASS   | Retained warnings remain explicit.                                                   |
| Scope Strategy Gate                    | PASS   | Scoped Todo Search CI is first; multi-slice/repo-wide validation remains future.     |
| Waiver / Manual Override Boundary Gate | PASS   | Waivers require explicit user judgment and cannot be Codex/PBE self-approved.        |

## Final Non-Implementation Statement

This non-enforcing CI workflow implementation does not introduce enforcement, does not expand the scoped pilot, does not
change source authority, does not retire tree-native artifacts, and does not approve full Graph-source promotion.
