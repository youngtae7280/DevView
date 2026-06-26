# Read-Model Validate All Contract

Status: read-model-validate-all-contract / local-implementation-present / non-enforcing / no-ci-enforcement

This document defines the concept contract for the local all-slice read-model validation command:

```text
pbe graph read-model validate --all
```

The command is now implemented as local non-enforcing Evidence. It does not change `.github/workflows/read-model-evidence.yml`,
dispatch GitHub Actions, create PRs, add required checks, introduce enforcement, expand source authority, perform
public-doc cleanup, promote Todo App PBE Run beyond `structure-only`, or approve full Graph-source promotion.

## Purpose

The purpose is to define how all-slice validation reads a configured slice registry, executes or reviews per-slice
Evidence, and produces an aggregate summary without confusing Evidence with source authority or user approval.

The local command answers:

- which slice profiles are configured for all-slice validation
- whether it reads existing validation reports or regenerates per-slice Evidence
- which per-slice commands and artifacts are required by policy level
- how per-slice results flow into the aggregate summary
- how blocking and decision-required states surface user judgment
- which boundaries prevent all-slice validation from becoming enforcement or promotion by implication

## Current Known Profiles

| Profile ID                        | Source slice                          | Source layout       | Policy level          | Current status                                                                                     |
| --------------------------------- | ------------------------------------- | ------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| `todo-search-selected-slice`      | `examples/adoption/todo-search-slice` | `flat-demo-support` | `pilot-marker-backed` | 40 nodes / 59 edges; `comparison-pass`; `validation-pass`; active bounded scoped pilot for review. |
| `todo-app-pbe-run-structure-only` | `examples/valid/todo-app-pbe-run`     | `canonical-pbe`     | `structure-only`      | 22 nodes / 38 edges; `validation-pass`; no manual parity, pilot marker, or runtime fixture.        |

### Todo Search Profile Requirements

Required for `todo-search-selected-slice`:

- generate read-model Evidence
- compare generated and manual read-model Evidence
- validate read-model Evidence
- maintain `read-model-parity-report.json` / `.md`
- maintain `read-model-validation-report.json` / `.md`
- require scoped pilot marker
- require runtime fixture Evidence
- keep retained warnings visible
- preserve Todo Search scoped source-authority boundary
- preserve non-promotion statement

### Todo App PBE Run Profile Requirements

Required for `todo-app-pbe-run-structure-only`:

- generate structure-only read-model Evidence
- validate structure-only read-model Evidence
- maintain `read-model-validation-report.json` / `.md`
- list source inputs from canonical `.pbe` layout
- keep source authority boundary visible
- preserve non-promotion statement

Not required for `todo-app-pbe-run-structure-only`:

- manual parity artifact
- generated/manual comparison
- View Instance Manifest
- scoped pilot marker
- runtime fixture Evidence
- source-authority-bearing status
- CI-backed status beyond inclusion in the current informational bundle

## Slice Registry Concept

The registry is explicit rather than discovered by scanning arbitrary directories.

Registry fields:

| Field                     | Meaning                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `profileId`               | Stable profile identifier, such as `todo-search-selected-slice`.                                        |
| `sourceSlice`             | Repository-relative slice path.                                                                         |
| `sourceLayout`            | Declared layout, such as `flat-demo-support` or `canonical-pbe`.                                        |
| `policyLevel`             | Validation policy level, such as `structure-only`, `parity-backed`, `pilot-marker-backed`, `ci-backed`. |
| `requiredCommands`        | Commands all-slice validation may run for the profile.                                                  |
| `requiredArtifacts`       | Artifacts that must exist after the selected execution mode.                                            |
| `optionalArtifacts`       | Artifacts allowed but not required for the profile.                                                     |
| `expectedCountPolicy`     | Expected node/edge/check count behavior, including whether exact counts or minimum coverage apply.      |
| `sourceAuthorityBoundary` | Statement proving the profile does not expand source authority by default.                              |
| `retainedWarningPolicy`   | How warnings and accepted limitations must remain visible.                                              |
| `ciInclusion`             | Whether the profile is included in manual/PR informational CI Evidence bundles.                         |
| `fallbackReferencePolicy` | Required fallback/reference artifacts for the profile.                                                  |
| `promotionBoundary`       | Explicit statement that validation pass is not source promotion or user approval.                       |

The candidate registry now exists at `examples/read-model-aggregate/read-model-slices.json` and includes only the two
current profiles above. It is strict JSON, non-generated execution metadata. Internal parser/normalization and
profile-comparison tests read it, and local `validate --all` is the first registry-consuming CLI surface. Existing
individual generate/compare/validate/summarize commands still keep their existing behavior.

The fixture and test strategy for this registry is recorded in
[read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md). Parser/normalization and
non-executing command-plan tests are now implemented; local `validate --all` command behavior now consumes the registry.
The storage/location decision surface is recorded in
[read-model-slice-registry-storage-decision.md](read-model-slice-registry-storage-decision.md), which records the
candidate file location and strict JSON format.
Negative fixture storage policy is recorded in
[read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md). Negative fixtures are
local test inputs only; current `validate --all` and CI runs remain positive-profile Evidence commands unless a later
design explicitly includes invalid fixtures.

## Execution Modes

### Mode 1: Report-Only Existing Validation Reports

Purpose: read existing per-slice validation reports and produce or inspect an aggregate summary.

Rules:

- do not run per-slice generate, compare, or validate commands
- do not regenerate artifacts
- fail or report blocking when a configured required report is missing or malformed
- preserve per-slice independence metadata
- preserve aggregate Evidence-only boundary

Current related implementation:

```text
pbe graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run
```

This is not `validate --all`; it remains existing-report aggregation.

### Mode 2: Regenerate-And-Validate Configured Slices

Purpose: local all-slice validation runs configured per-slice commands in registry order, then summarizes results.

Rules:

- run only commands declared by each profile
- use profile policy level to decide whether compare, pilot marker, or runtime fixture Evidence is required
- produce per-slice validation reports before aggregation
- never auto-promote a slice policy level
- never infer source authority from generated output
- never run unsupported or unregistered slices by discovery

This mode is implemented locally by `pbe graph read-model validate --all`. CI workflow integration and enforcement
remain separate decisions.

### Mode 3: CI Informational All-Slice Validation

Purpose: future CI could run all configured profiles as an informational Evidence bundle.

Rules:

- requires a separate workflow implementation decision
- should remain non-enforcing until required checks / branch protection are separately approved
- must record CI trigger mode and source ref/commit
- must keep aggregate status separate from user approval
- should not replace the current PR informational observation window without a separate decision

### Mode 4: Future Enforcement Mode

Purpose: later required-check or branch-protection mode.

Rules:

- future-only
- requires separate user approval
- requires stable path filters, failure semantics, retained warning visibility, and clear waiver rules
- must not make CI pass equivalent to user acceptance or source promotion

## Aggregate Relation

All-slice validation may produce per-slice reports and then an aggregate summary.

Aggregate decision rules:

- any blocking slice -> `aggregate-blocked`
- any decision-required slice -> `decision-required`
- no blocking/decision-required but any warning -> `aggregate-warning`
- all included slices `validation-pass` with 0 warning/blocking/decision-required -> `aggregate-pass`

Aggregate status is Evidence only. `aggregate-pass` does not:

- expand source authority
- retire tree-native or `.pbe` artifacts
- promote Todo App PBE Run beyond `structure-only`
- approve CI enforcement
- approve full Graph-source promotion
- replace user acceptance

## Failure Semantics

| Failure class                     | Meaning                                                               | Expected handling                                                                |
| --------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Unsupported slice profile         | Registry contains a profile ID the command does not know how to run.  | Blocking; do not guess commands or silently skip unless registry marks optional. |
| Missing source input              | Required profile source artifacts are missing.                        | Blocking for that profile unless the profile declares an explicit accepted gap.  |
| Generated/manual mismatch         | Parity-backed profile comparison fails or warns.                      | Use mismatch severity; source/acceptance/risk/authority mismatch needs judgment. |
| Validation warning                | Profile report is valid but has warnings or accepted limitations.     | Preserve warning visibility; aggregate may become `aggregate-warning`.           |
| Validation blocking               | Required check fails.                                                 | Profile blocks; aggregate blocks.                                                |
| Validation decision-required      | Evidence is valid but needs human judgment.                           | Aggregate becomes `decision-required`; do not auto-resolve.                      |
| Aggregate blocked                 | One or more profiles block or required reports are malformed/missing. | Block aggregate pass; record slice reasons.                                      |
| Source authority boundary missing | Report cannot prove Evidence-only / scoped boundary.                  | Blocking or decision-required depending on severity.                             |
| Retained warning hidden           | Known warning disappears without Evidence.                            | Blocking for honesty until reviewed.                                             |
| Unregistered slice discovered     | A directory looks like a slice but is not configured.                 | Do not run by default; surface as future registry candidate if needed.           |

## Source Authority Boundary

All-slice validation is Evidence only.

Tree-native selected-slice artifacts and canonical `.pbe` artifacts remain current operational source unless a separate
source-transition decision changes that boundary. Generated read-models, validation reports, CI manifests, and aggregate
summaries do not become source authority by passing validation.

Todo Search remains the only scoped source-authority pilot. Todo App PBE Run remains `structure-only`.

## Relation To PR Informational Observation

The current PR informational workflow is in observation mode. It has not been changed to run `validate --all`; workflow
integration remains a separate decision.

The PR observation policy and log remain active:

- [pr-informational-observation-policy.md](pr-informational-observation-policy.md)
- [pr-informational-observation-log.md](pr-informational-observation-log.md)

CI usage of `validate --all` is now implemented for the non-enforcing manual/PR informational workflow and reviewed by
manual run `28210541509` plus PR informational run `28210904900`. PR observation still does not approve enforcement. The
workflow switch record is [ci-validate-all-integration-design.md](ci-validate-all-integration-design.md).

## Non-Scope

This contract does not:

- modify `.github/workflows/read-model-evidence.yml`
- dispatch GitHub Actions
- create PRs
- regenerate generated artifacts
- create or run negative fixtures
- add required checks
- add branch protection
- introduce CI enforcement
- expand source authority
- approve full Graph-source promotion
- perform public-doc cleanup
- retire tree-native or `.pbe` artifacts
- promote Todo App PBE Run beyond `structure-only`
- make aggregate or validation pass equivalent to user acceptance

## Gate Self-Check

| Gate                             | Result | Notes                                                                              |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Local Implementation Gate        | PASS   | Local `validate --all` exists and is non-enforcing Evidence only.                  |
| Slice Registry Clarity Gate      | PASS   | Declares the first two known profiles and the candidate registry fixture path.     |
| Registry Test Strategy Gate      | PASS   | Parser/normalization and non-executing command-plan tests are recorded separately. |
| Execution Mode Separation Gate   | PASS   | Separates report-only, regenerate-and-validate, CI informational, and enforcement. |
| Aggregate Boundary Gate          | PASS   | Aggregate pass remains Evidence-only.                                              |
| Source Authority Boundary Gate   | PASS   | No source authority expansion or artifact retirement.                              |
| Non-CI-Enforcement Gate          | PASS   | Enforcement mode remains future-only and separately approved.                      |
| PR Observation Separation Gate   | PASS   | Current PR observation window remains separate from all-slice implementation.      |
| Todo App Structure-Only Gate     | PASS   | Todo App PBE Run remains structure-only.                                           |
| Retained Warning Visibility Gate | PASS   | Hidden warnings are failure semantics, not acceptable cleanup.                     |
| User Approval Boundary Gate      | PASS   | Validation pass cannot replace user acceptance or promotion approval.              |

## Final Statement

This contract defines and records the local all-slice read-model validation command. It does not change workflow
triggers, introduce enforcement, expand source authority, approve full Graph-source promotion, perform public-doc
cleanup, or change the policy level of any current slice.
