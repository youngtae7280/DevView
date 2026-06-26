# CI-Backed Read-Model Evidence Workflow Design

Status: ci-backed-read-model-evidence-workflow-design / pr-informational-implemented /
ci-validate-all-integration-reviewed / non-enforcing

## Document Purpose

This document defines the CI workflow design for read-model Evidence after the Todo Search scoped read-model validator
became available. The bounded non-enforcing workflow is implemented as manual dispatch plus PR informational mode and
now includes Todo App PBE Run structure-only Evidence plus the first aggregate read-model summary command.

It explains how CI-backed Evidence can be produced by the manual workflow, how that differs from local
validator-backed Evidence, what commands and artifacts the workflow uses, and how CI results should relate to Approval
Briefs, Control Nodes, Source Transition Path, rollback/fallback, and user judgment.

This document records that `.github/workflows/read-model-evidence.yml` exists for non-enforcing manual and PR
informational CI-backed Evidence. It does not implement CI enforcement, does not expand pilot scope, does not change
source authority, does not retire tree-native artifacts, does not clean up public docs, and does not approve full
Graph-source promotion.

## Current Local Validator-Backed Baseline

| Baseline item              | Current state                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoped pilot               | `examples/adoption/todo-search-slice` only                                                                                                                                                                 |
| Active observation status  | `keep-active-with-retained-warnings`                                                                                                                                                                       |
| Generated/manual parity    | `comparison-pass`                                                                                                                                                                                          |
| Local validator command    | `pbe graph read-model validate --slice examples/adoption/todo-search-slice`                                                                                                                                |
| Validator-backed status    | `validation-pass`                                                                                                                                                                                          |
| Validator check count      | 20                                                                                                                                                                                                         |
| Warning/blocking/decision  | 0 / 0 / 0                                                                                                                                                                                                  |
| CI-backed Evidence         | Todo Search run `28151296796`, aggregate-enabled run `28156403793`, Node 24 run `28157938343`, validate-all manual run `28210541509`, and validate-all PR run `28210904900` reviewed as `ci-evidence-pass` |
| Tree-native fallback       | retained and usable                                                                                                                                                                                        |
| Supplemental compatibility | warning-only, not pilot source scope                                                                                                                                                                       |
| Current authority boundary | bounded Todo Search scoped pilot; no repository-wide source authority change                                                                                                                               |

The local validator baseline is enough to keep the scoped pilot active under observation. The non-enforcing manual CI
workflow produced reviewed Todo Search CI-backed Evidence in run `28151296796`; the later aggregate-enabled workflow run
`28156403793` reviewed the Todo Search, Todo App PBE Run, and aggregate artifact bundle. The post-update Node 24 run
`28157938343` reviewed the same aggregate-enabled workflow after the action/runtime hygiene update. PR #1 reviewed run
`28207822252` as a non-enforcing `pull_request-informational` Evidence run. The workflow later switched to
registry-backed local `validate --all`; manual run `28210541509` and PR #2 run `28210904900` reviewed that switched
workflow as `ci-evidence-pass`. Push/schedule triggers, required checks, branch protection, and enforcement remain
unimplemented.

The PR informational trigger design and first run review are recorded in
[pr-informational-read-model-evidence-design.md](pr-informational-read-model-evidence-design.md) and
[ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md). The `pull_request` mode
provides visible PR Evidence without becoming a required check, branch protection rule, source authority expansion, or
user acceptance replacement.

The follow-up observation policy is recorded in
[pr-informational-observation-policy.md](pr-informational-observation-policy.md). It defines observation metrics,
minimum observation window, path-filter refinement criteria, and escalation criteria without changing the workflow.

Invalid read-model fixture CI inclusion is intentionally separate and is recorded in
[read-model-invalid-fixture-ci-policy.md](read-model-invalid-fixture-ci-policy.md). The current workflow runs positive
registry-backed `validate --all` only; invalid fixtures remain local focused test inputs.

Run `28156403793` also surfaced a GitHub Actions maintenance annotation that Node.js 20 is deprecated for
`actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` execution. This is a retained CI hygiene
warning for that historical run, not a failed Evidence run. The workflow now uses `actions/checkout@v7`,
`actions/setup-node@v6`, `node-version: 24`, and `actions/upload-artifact@v7`; post-update run `28157938343` completed
successfully and did not show the Node.js 20 deprecation annotation.

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

| Aspect                  | Local validator-backed Evidence            | CI-backed Evidence                                                                                 |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Execution location      | Developer machine or local command context | CI runner tied to branch, PR, main, schedule, or manual dispatch                                   |
| Primary proof           | `read-model-validation-report.*`           | CI run result plus generated report artifacts                                                      |
| Repeatability signal    | Local repeatability only                   | Independent or shared runner repeatability                                                         |
| Artifact durability     | Repository file outputs or local logs      | Uploaded/linked CI artifacts plus optional committed reports                                       |
| Enforcement possibility | None unless separately wired               | Can be informational or enforcement, but enforcement requires separate approval                    |
| User approval relation  | Evidence only; not user approval           | Evidence only; not user approval                                                                   |
| Source authority effect | None by itself                             | None by itself                                                                                     |
| Current status          | implemented for Todo Search scoped slice   | Todo Search run `28151296796`, aggregate run `28156403793`, and Node 24 run `28157938343` reviewed |

## CI Trigger Modes

| Trigger mode                    | Purpose                                                                   | Default stance                      | Enforcement boundary                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `manual-workflow-dispatch`      | Let a user or maintainer request CI-backed Evidence for a selected slice. | Preferred first CI mode             | Informational only unless later approved as a required gate.                                            |
| `local-equivalent-script`       | Mirror the CI command sequence locally before workflow implementation.    | Useful for implementation rehearsal | Local Evidence only; not CI-backed.                                                                     |
| `pr-check-informational`        | Run scoped read-model Evidence on pull requests and report status.        | Implemented as non-enforcing signal | Should not block merge until user approves enforcement.                                                 |
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
pull_request informational with path filters
```

Push, scheduled, and required-check modes remain future-only.

## Implemented CI Command Sequence

The implemented CI workflow runs the same bounded commands that local validation uses, then writes a cross-slice
aggregate summary from existing per-slice validation reports:

```text
npm run build:cli
node dist/cli/index.js graph read-model generate --slice examples/adoption/todo-search-slice --json
node dist/cli/index.js graph read-model compare --generated examples/adoption/todo-search-slice/generated/generated-read-model.json --manual examples/adoption/todo-search-slice/maintainability-graph-read-model.json --json
node dist/cli/index.js graph read-model validate --slice examples/adoption/todo-search-slice --json
node dist/cli/index.js graph read-model generate --slice examples/valid/todo-app-pbe-run --json
node dist/cli/index.js graph read-model validate --slice examples/valid/todo-app-pbe-run --json
node dist/cli/index.js graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run --json
```

Implemented supporting commands:

```text
npx vitest run cli/src/__tests__/read-model-evidence.test.ts
npx vitest run examples/adoption/todo-search-slice/runtime-fixture
npm run validate:pbe
npm run validate:pbe:v2
```

Local command surfaces not currently used by the CI workflow:

```text
pbe graph read-model validate --all
pbe graph read-model validate --slice <path> --ci-manifest <file>
```

`pbe graph read-model validate --all` is now implemented as a local non-enforcing registry-backed Evidence command.
This workflow design still keeps the CI sequence explicit unless a later workflow-integration decision replaces it with
`validate --all`.

## Implemented And Proposed CI Artifact Outputs

| Artifact output                              | Role                                                                                | Required now?          |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| `generated-read-model.json`                  | Generated Graph-first read-model Evidence.                                          | yes                    |
| `generated-read-model.md`                    | Human-readable generated read-model summary.                                        | yes                    |
| `read-model-parity-report.json`              | Machine-readable generated/manual comparison report.                                | yes                    |
| `read-model-parity-report.md`                | Human-readable parity summary.                                                      | yes                    |
| `read-model-validation-report.json`          | Machine-readable validator-backed Evidence report.                                  | yes                    |
| `read-model-validation-report.md`            | Human-readable validation report.                                                   | yes                    |
| Todo App PBE Run `generated-read-model.*`    | Structure-only generated read-model Evidence for the canonical `.pbe` fixture.      | yes                    |
| Todo App PBE Run validation report           | Structure-only validator-backed Evidence for the second fixture.                    | yes                    |
| `read-model-aggregate-summary.*`             | Cross-slice Evidence summary over existing per-slice validation reports.            | yes                    |
| `read-model-ci-evidence-manifest.json`       | CI manifest linking workflow, run id, source commit, commands, outputs, and status. | runtime artifact in CI |
| GitHub Step Summary                          | CI run summary for review.                                                          | yes                    |
| uploaded read-model Evidence artifact bundle | CI artifact containing generated outputs and reports.                               | yes                    |

CI artifacts should preserve:

- run identity: workflow name, trigger mode, run id, source commit, branch or PR, timestamp
- command identity and exit status
- source slice and input artifact list
- generated/parity/validation report references
- Todo App PBE Run structure-only validation references
- aggregate summary status, included slices, and aggregate artifact references
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
- switch the CI workflow to `validate --all`
- change source authority
- expand pilot scope
- declare full Graph-source promotion
- clean up public docs
- retire tree-native artifacts
- hide retained warnings
- make CI pass equivalent to user approval

## Recommended Next Decision Surface

After this aggregate-enabled workflow run review and PR informational run review, the next user decision should choose
one of:

1. `Keep PR informational workflow non-enforcing and observe`
2. `Refine PR informational path filters after observing more PRs`
3. `Design CI enforcement / required check policy`
4. `Require public-doc cleanup before broader CI or promotion work`
5. `Prepare broader Graph-source promotion review`
6. `Defer broader CI mode changes`

Recommended next step: keep the PR informational workflow non-enforcing and observe more PRs under the observation
policy before deciding whether path filters or artifact naming need refinement. Enforcement design, public-doc cleanup,
broader promotion review, and defer remain separate major branches. The Node.js 20 deprecation annotation from run
`28156403793` has been handled by the Node 24 action/runtime update and reviewed post-update run `28157938343`.
Future PR observations should be recorded in
[pr-informational-observation-log.md](pr-informational-observation-log.md) before path-filter, failure-semantics,
enforcement, or validation-scope changes are proposed.
Local all-slice validation uses
[read-model-validate-all-contract.md](read-model-validate-all-contract.md). Any CI workflow switch to that command or
any enforcement mode remains a separate future decision.
The non-enforcing workflow switch to local `validate --all` is now implemented and reviewed in
[ci-validate-all-integration-design.md](ci-validate-all-integration-design.md). Run `28210541509` confirms the switched
manual workflow remains `ci-evidence-pass`, and PR #2 run `28210904900` confirms the switched PR informational workflow
records `pull_request-informational` plus `validateAllStatus: aggregate-pass`.
Negative fixture storage is designed separately in
[read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md); current CI runs do
not execute invalid fixtures.
The future registry/test planning layer is recorded in
[read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md).
The storage/location decision surface for the registry artifact is recorded in
[read-model-slice-registry-storage-decision.md](read-model-slice-registry-storage-decision.md). Local `validate --all`
consumes that registry; this CI workflow design still does not.

## Approval Brief Draft

### Intent Understood

PBE is defining how CI-backed read-model Evidence should work after local scoped validator-backed Evidence passed for
the Todo Search selected slice.

### Result Summary

This design defines CI trigger modes, command sequence, artifact outputs, status semantics, pass/warn/fail behavior,
scope strategy, waiver boundaries, aggregate bundle contents, and relationship to Approval Briefs, Control Nodes,
Source Transition Path, rollback, and compatibility.

### Verification Summary

| Check                      | Status       | Summary                                                                                                                                                                  |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local validator baseline   | present      | Todo Search scoped validation is `validation-pass` with 20 checks.                                                                                                       |
| CI workflow implementation | implemented  | `.github/workflows/read-model-evidence.yml` exists as manual dispatch plus PR informational mode and includes Todo App structure-only Evidence plus aggregate summarize. |
| CI enforcement             | not approved | Enforcement mode remains future-only.                                                                                                                                    |
| Source authority boundary  | preserved    | CI Evidence would remain Evidence only.                                                                                                                                  |
| Retained warnings          | visible      | Bounded fixture, partial UI, enforcement gap, and ACEP cleanup remain visible.                                                                                           |
| Next user decision         | required     | User must choose whether to continue observation, refine filters after enough PR signal, or branch into enforcement, cleanup, promotion review, or defer.                |

### Remaining Judgment

The user must decide whether to continue observing PR informational runs under the observation policy, refine path
filters after enough signal, design enforcement policy, prepare multi-slice validation, require public-doc cleanup
before broader work, prepare broader promotion review, or rollback/defer the scoped pilot.

### State Label

```text
Decision required
```

Reason: non-enforcing manual CI workflow implementation exists, run `28151296796` has been reviewed as Todo Search
CI-backed Evidence, run `28156403793` has been reviewed as aggregate-enabled CI-backed Evidence, run `28157938343` has
been reviewed after the Node 24 action/runtime update, PR #1 run `28207822252` has been reviewed as
`pull_request-informational` / `ci-evidence-pass`, and validate-all workflow runs `28210541509` and `28210904900` have
been reviewed for manual and PR informational modes. Enforcement, broader source authority, and full promotion remain
unapproved.

## Gate Self-Check

| Gate                                   | Result | Notes                                                                                                              |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| Design / Implementation Boundary Gate  | PASS   | Non-enforcing manual workflow is implemented; enforcement and broader authority are not.                           |
| Workflow Boundary Gate                 | PASS   | Only `.github/workflows/read-model-evidence.yml` is updated for manual dispatch.                                   |
| Non-CI-Enforcement Gate                | PASS   | Enforcement mode remains future-only.                                                                              |
| Source Authority Boundary Gate         | PASS   | CI-backed Evidence is Evidence only and does not change source authority.                                          |
| Non-Full-Promotion Gate                | PASS   | Full Graph-source promotion remains unapproved.                                                                    |
| Local-vs-CI Evidence Separation Gate   | PASS   | Local validator pass, reviewed Todo Search CI Evidence, and reviewed aggregate CI Evidence are separate.           |
| User Approval Boundary Gate            | PASS   | CI pass is not user approval.                                                                                      |
| Retained Warning Visibility Gate       | PASS   | Retained warnings remain explicit.                                                                                 |
| Scope Strategy Gate                    | PASS   | Workflow includes two declared slices and an aggregate summary without broadening source authority or enforcement. |
| Waiver / Manual Override Boundary Gate | PASS   | Waivers require explicit user judgment and cannot be Codex/PBE self-approved.                                      |

## Final Non-Implementation Statement

This non-enforcing CI workflow implementation does not introduce enforcement, does not expand source authority, does not
make Todo App PBE Run a pilot slice, does not retire tree-native or `.pbe` artifacts, and does not approve full
Graph-source promotion. The aggregate-enabled workflow output is reviewed in runs `28156403793` and `28157938343`, but
it remains non-enforcing Evidence only and does not approve source authority expansion.
