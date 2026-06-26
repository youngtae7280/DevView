# Read-Model Slice Registry Test Strategy

Status: read-model-slice-registry-test-strategy / parser-normalization-tests-implemented /
local-validate-all-implemented / non-enforcing

This document defines the registry fixture and test strategy used before implementing the local all-slice read-model
validation surface:

```text
pbe graph read-model validate --all
```

It extends [read-model-validate-all-contract.md](read-model-validate-all-contract.md) by specifying what the future
registry fixture should look like, what positive and negative fixtures should prove, and which focused tests should
protect source-authority, aggregate, and non-mutation boundaries.

The candidate registry file now exists at `examples/read-model-aggregate/read-model-slices.json`, and internal
parser/normalization plus profile-comparison tests now cover it. The local `validate --all` command is the first
registry-consuming CLI surface and remains non-enforcing Evidence only. This strategy does not make the existing
single-slice generate/compare/validate/summarize commands registry-driven, change workflows, dispatch GitHub Actions,
create PRs, introduce enforcement, expand source authority, perform public-doc cleanup, or approve full Graph-source
promotion.

The storage and file-format decision surface for the registry fixture is recorded in
[read-model-slice-registry-storage-decision.md](read-model-slice-registry-storage-decision.md). The candidate fixture is
now reviewable metadata only; this strategy should not be treated as approval for parser, planner, `validate --all`, or
workflow consumption beyond the bounded local `validate --all` implementation recorded later.

The negative fixture storage decision surface is recorded in
[read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md). It keeps parser-shape
failures inline/temp first, recommends temp workspace copies for mutation and leakage cases, and reserves durable
`examples/invalid/read-model-*` fixtures for stable behavior-level validate-all failures.
The first durable candidate plan is recorded in
[read-model-negative-fixture-candidate-plan.md](read-model-negative-fixture-candidate-plan.md); it selects invalid
`viewScopedTags` and missing Core View coverage as the first candidate pair. The invalid `viewScopedTags` fixture is now
implemented at `examples/invalid/read-model-invalid-view-scoped-tags` as local focused test input, and the missing Core
View fixture is implemented at `examples/invalid/read-model-core-view-missing` as local focused test input. The missing
pilot marker fixture is also implemented at `examples/invalid/read-model-pilot-marker-missing` as a local
authority-boundary test fixture.

## Relationship To Validate-All Contract

The validate-all contract defines the policy surface:

- known profiles
- registry concept
- execution modes
- aggregate relation
- failure semantics
- source-authority boundary
- PR observation separation

This strategy defines how a future implementation should be tested before those concepts become executable behavior.

The intended sequence is:

1. design registry fixture shape
2. design positive and negative fixture expectations
3. keep the approved candidate registry fixture reviewable outside `generated/`
4. implement parser/normalization tests. Completed by DEC-072.
5. implement command-plan tests. Completed by DEC-072 for non-executing plans.
6. implement all-slice validation behavior only after registry behavior is stable

## Proposed Registry Fixture Shape

Prefer a small explicit registry fixture over directory discovery. The current candidate file uses strict JSON at
`examples/read-model-aggregate/read-model-slices.json`; future schema changes should be explicit reviewed changes.

Conceptual shape:

```json
{
  "schemaVersion": 1,
  "registryRole": "read-model-slice-registry-fixture",
  "sourceAuthorityBoundary": "registry config is execution metadata only; it does not change source authority",
  "nonPromotionStatement": "registry inclusion is Evidence scope only and is not Graph-source promotion",
  "profiles": [
    {
      "profileId": "todo-search-selected-slice",
      "sourceSlice": "examples/adoption/todo-search-slice",
      "sourceLayout": "flat-demo-support",
      "policyLevel": "pilot-marker-backed",
      "includedInValidateAll": true,
      "requiredCommands": ["generate", "compare", "validate"],
      "requiredArtifacts": [
        "generated/generated-read-model.json",
        "generated/read-model-parity-report.json",
        "generated/read-model-validation-report.json",
        "generated/scoped-source-authority-pilot-marker.json"
      ],
      "optionalArtifacts": ["generated/read-model-ci-evidence-manifest.json"],
      "expectedCounts": {
        "nodes": 40,
        "edges": 59,
        "validationChecks": 20
      },
      "requiredBoundaryStatements": ["sourceAuthorityBoundary", "nonPromotionStatement"],
      "retainedWarnings": ["bounded-fixture", "partial-ui-evidence", "public-doc-cleanup-deferred"],
      "fallbackReferences": ["tree-native selected-slice artifacts", "manual read-model parity artifact"],
      "ciInclusion": "manual-and-pr-informational"
    }
  ]
}
```

Required profile fields:

| Field                        | Purpose                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `profileId`                  | Stable profile key used by generator, validator, and aggregate reports.                  |
| `sourceSlice`                | Repository-relative source slice path.                                                   |
| `sourceLayout`               | Declared source layout such as `flat-demo-support` or `canonical-pbe`.                   |
| `policyLevel`                | Profile policy such as `structure-only`, `parity-backed`, or `pilot-marker-backed`.      |
| `includedInValidateAll`      | Whether future all-slice validation includes this profile by default.                    |
| `requiredCommands`           | Commands the future execution planner may run.                                           |
| `requiredArtifacts`          | Artifact paths required for the selected policy level.                                   |
| `optionalArtifacts`          | Useful artifacts that cannot block this profile when absent.                             |
| `expectedCounts`             | Declared expected counts or count policy for nodes, edges, checks, warnings, mismatches. |
| `requiredBoundaryStatements` | Boundary fields that must be present in generated reports.                               |
| `retainedWarnings`           | Warnings that must remain visible unless separately resolved by Evidence.                |
| `fallbackReferences`         | Fallback/reference artifacts that must remain preserved.                                 |
| `ciInclusion`                | Whether the profile is included in manual/PR informational CI bundles.                   |

## Current Positive Fixtures

### Todo Search

| Field                 | Expected value                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `profileId`           | `todo-search-selected-slice`                                                                   |
| `sourceSlice`         | `examples/adoption/todo-search-slice`                                                          |
| `sourceLayout`        | `flat-demo-support`                                                                            |
| `policyLevel`         | `pilot-marker-backed`                                                                          |
| Required commands     | `generate`, `compare`, `validate`                                                              |
| Required artifacts    | generated read-model, parity report, validation report, evidence manifest, scoped pilot marker |
| Expected counts       | 40 nodes, 59 edges, 20 validation checks                                                       |
| Required parity       | yes, `comparison-pass`                                                                         |
| Required pilot marker | yes, present                                                                                   |
| Runtime fixture       | required/present                                                                               |
| Boundary              | Todo Search scoped, Evidence-only, non-promotion                                               |

### Todo App PBE Run

| Field                 | Expected value                                                        |
| --------------------- | --------------------------------------------------------------------- |
| `profileId`           | `todo-app-pbe-run-structure-only`                                     |
| `sourceSlice`         | `examples/valid/todo-app-pbe-run`                                     |
| `sourceLayout`        | `canonical-pbe`                                                       |
| `policyLevel`         | `structure-only`                                                      |
| Required commands     | `generate`, `validate`                                                |
| Required artifacts    | generated read-model, validation report, evidence manifest            |
| Expected counts       | 22 nodes, 38 edges, 16 validation checks                              |
| Required parity       | no                                                                    |
| Required pilot marker | no                                                                    |
| Runtime fixture       | not required / attached Evidence only                                 |
| Boundary              | structure-only, Evidence-only, no source authority or pilot promotion |

## Future Negative Fixture Categories

Negative fixtures should be lightweight and isolated. The storage policy is now recorded in
[read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md): keep parser-shape
failures inline/temp, use temp workspace copies for mutation and leakage cases, and add durable
`examples/invalid/read-model-*` fixtures only for stable behavior-level failures. Do not mutate current positive slice
artifacts to produce negative cases.
The candidate plan narrows the first durable fixtures to invalid `viewScopedTags`, missing Core View coverage, and
missing pilot marker coverage. These fixtures are durable and local-test-only; they are not part of the validate-all
registry or CI workflow.

| Category                                      | Expected result                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| Unsupported profile ID                        | Blocking: registry references an unknown profile and no command plan is guessed. |
| Missing source input                          | Blocking unless the profile declares an accepted limitation.                     |
| Missing required artifact                     | Blocking for report-only mode or after future execution mode completes.          |
| Wrong policy-level requirements               | Blocking: e.g. structure-only unexpectedly requires parity or pilot marker.      |
| Hidden retained warning                       | Blocking: known warning disappears without Evidence.                             |
| Source authority boundary missing             | Blocking or decision-required depending on severity.                             |
| Invalid `viewScopedTags`                      | Blocking taxonomy failure.                                                       |
| Missing Core View coverage                    | Blocking for profiles that require 7 Core View coverage.                         |
| Parity required but missing comparison report | Blocking for parity-backed or pilot-marker-backed profiles.                      |
| Pilot marker required but missing marker      | Blocking for pilot-marker-backed profiles.                                       |
| Structure-only profile requiring parity/pilot | Blocking policy confusion; structure-only must remain lightweight.               |
| Aggregate input malformed                     | Aggregate blocked; do not regenerate silently.                                   |
| Cross-slice dependency leakage                | Blocking: one slice validation depends on another slice's generated directory.   |

## Test Classes

### Registry Parsing / Normalization Tests

Current parser/normalization tests validate that the candidate registry parser:

- accepts the two current positive profiles
- rejects duplicate `profileId`
- rejects missing top-level boundary statements
- normalizes slash direction without changing semantic paths
- rejects unknown `policyLevel`
- preserves boundary statements and retained-warning declarations

### Command Plan Construction Tests

Current command-plan tests validate non-executing plans:

- builds `generate + compare + validate` for Todo Search
- builds `generate + validate` for Todo App PBE Run
- does not plan compare for `structure-only`
- does not plan pilot-marker checks for `structure-only`
- does not run any generated commands while constructing the plan

Future command-behavior tests still need to prove unsupported profiles are reported instead of guessed.

### Per-Policy Requirement Tests

Validate that policy levels drive required artifacts:

- `structure-only` requires generated read-model and validation report
- `parity-backed` requires comparison report
- `pilot-marker-backed` requires comparison report and pilot marker
- runtime fixture requirements are profile-specific
- retained warnings are required visibility fields, not validation failures when explicitly accepted

### Per-Slice Independence Tests

Validate that each profile uses only its declared source slice and artifacts:

- Todo Search validation does not depend on Todo App generated files
- Todo App validation does not depend on Todo Search manual parity or pilot marker
- report-only aggregate reads only declared per-slice validation reports
- temp workspace tests remove unrelated slices to prove independence

### Aggregate Status Rule Tests

Validate aggregate propagation:

- all pass -> `aggregate-pass`
- warning without blocking/decision-required -> `aggregate-warning`
- any blocking -> `aggregate-blocked`
- any decision-required -> `decision-required`
- missing/malformed required report -> aggregate blocked
- aggregate does not mutate per-slice reports or regenerate artifacts

### Non-Mutation Tests

Validate that future all-slice runs:

- do not edit source artifacts unexpectedly
- do not edit manual parity artifacts
- do not rewrite pilot markers
- write only declared generated/report outputs for the selected execution mode
- leave report-only mode input files unchanged

### Boundary Statement Tests

Validate that every output includes:

- source authority boundary
- non-promotion statement
- user acceptance boundary
- retained warning visibility
- fallback/reference summary
- policy-level statement

### Fixture Drift Tests

Validate that positive fixture expectations stay intentional:

- Todo Search remains 40 nodes / 59 edges / 20 validation checks unless a deliberate update records why
- Todo Search parity remains `comparison-pass`
- Todo App PBE Run remains 22 nodes / 38 edges / 16 validation checks unless a deliberate update records why
- Todo App PBE Run remains `structure-only`
- aggregate over current reports remains `aggregate-pass` when per-slice reports are valid

## Test Execution Ordering

Future all-slice implementation tests should proceed in this order:

1. parse registry
2. normalize registry paths and profile metadata
3. verify source input existence
4. construct command plan
5. run/generate/compare/validate in future execution mode
6. summarize existing reports
7. assert aggregate status
8. assert no unintended input mutation
9. assert boundary statements and retained warnings remain visible

Report-only mode should skip command execution steps and start from existing validation reports.

## Implementation Readiness Criteria

This strategy was enough to request creation of the candidate registry fixture when:

- the registry fixture storage location is approved through
  [read-model-slice-registry-storage-decision.md](read-model-slice-registry-storage-decision.md)
- the file format is selected through the storage decision surface
- positive fixture expectations above are accepted
- negative fixture storage policy is selected in
  [read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md)
- parser/normalization behavior is agreed
- all-slice execution mode default is chosen
- report output location is chosen
- mutation boundary is clear

Before broader command behavior or CI workflow behavior consumes the registry:

- the candidate registry fixture must stay aligned with current in-code profiles
- parser and planner tests should remain passing
- local `validate --all` behavior should remain non-enforcing and registry-scoped
- positive and negative fixture behavior should be testable without changing current source artifacts
- aggregate summary behavior should remain compatible with existing report-only command
- PR informational workflow should not be changed unless separately approved
- CI workflow switch design should follow
  [ci-validate-all-integration-design.md](ci-validate-all-integration-design.md)

## Non-Scope

This strategy, candidate fixture, and parser tests do not:

- make existing single-slice CLI commands registry-driven
- implement CI-backed `validate --all`
- modify `.github/workflows/read-model-evidence.yml`
- regenerate generated artifacts
- create PRs
- dispatch GitHub Actions
- add required checks
- add branch protection
- introduce CI enforcement
- expand source authority
- approve full Graph-source promotion
- perform public-doc cleanup
- promote Todo App PBE Run beyond `structure-only`

## Gate Self-Check

| Gate                           | Result | Notes                                                                                  |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------- |
| Candidate Fixture Gate         | PASS   | The candidate registry file exists as reviewable metadata.                             |
| Parser / Normalization Gate    | PASS   | Internal tests parse, normalize, reject invalid registry shapes, and compare profiles. |
| Local Validate-All Gate        | PASS   | Local `validate --all` consumes the registry without changing existing slice commands. |
| Registry Fixture Shape Gate    | PASS   | Proposed fields are explicit and profile-driven.                                       |
| Positive Fixture Clarity Gate  | PASS   | Todo Search and Todo App PBE Run expected policy levels and counts are declared.       |
| Negative Fixture Honesty Gate  | PASS   | Failure categories are visible and should not mutate positive source artifacts.        |
| Test Class Coverage Gate       | PASS   | Parser, planning, policy, independence, aggregate, non-mutation, boundary, and drift.  |
| Non-Mutation Gate              | PASS   | Future tests must prove source/manual/pilot/report-only inputs remain unchanged.       |
| Aggregate Boundary Gate        | PASS   | Aggregate tests remain Evidence-only and do not imply source authority.                |
| Non-CI-Enforcement Gate        | PASS   | CI enforcement and workflow changes remain separate.                                   |
| Source Authority Boundary Gate | PASS   | Registry inclusion is not source authority or promotion.                               |
| User Approval Boundary Gate    | PASS   | Implementation and enforcement remain separate user decisions.                         |

## Final Statement

This strategy made the candidate registry and test surface reviewable before bounded local command consumption. Local
`validate --all` now consumes the registry as non-enforcing Evidence, but existing single-slice commands, CI workflow
behavior, enforcement, source authority, and Graph-source promotion remain separate.
