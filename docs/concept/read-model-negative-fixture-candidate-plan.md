# Read-Model Negative Fixture Candidate Plan

Status: read-model-negative-fixture-candidate-plan / candidate-plan / design-only /
no-fixture-implementation

## Purpose

This document narrows the first durable negative read-model fixture candidates before any invalid fixture files, tests,
or CLI behavior are implemented.

It follows the storage policy in
[read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md), which recommends:

1. parser-shape failures stay inline/temp first
2. mutation and cross-slice leakage tests use temp workspace copies
3. durable `examples/invalid/read-model-*` fixtures are reserved for stable behavior-level validate-all failures

## Current Context

Current read-model baseline:

- candidate positive registry exists at `examples/read-model-aggregate/read-model-slices.json`
- parser/normalization tests already cover duplicate IDs, missing top-level boundaries, and unknown policy levels
- local non-enforcing `pbe graph read-model validate --all` exists
- manual and PR validate-all workflow runs are reviewed as `ci-evidence-pass`
- Todo Search remains `pilot-marker-backed`
- Todo App PBE Run remains `structure-only`
- current CI runs positive configured profiles only

This plan does not create invalid fixture directories, write invalid JSON/Markdown artifacts, change focused tests, or
modify workflow behavior.

## Candidate Comparison

### Candidate 1: Invalid `viewScopedTags`

Proposed location if implemented:

```text
examples/invalid/read-model-invalid-view-scoped-tags
```

Behavior protected:

- `viewScopedTags` must contain only allowed role tags
- view membership must remain separate from role tags
- taxonomy failures must block validation rather than becoming warnings

Why durable fixture is useful:

- tag validity is a core cross-slice invariant
- the failure is easy to understand from a small invalid generated read-model or validation report
- it protects against accidental broadening of the allowed role-tag set
- it is not tied to Todo Search authority or pilot-specific policy

High-level fixture shape:

- `README.md` or boundary marker stating this is invalid test input, not source authority
- minimal generated read-model JSON or copied report-like artifact with one invalid `viewScopedTags` value
- optional small registry/profile metadata only if future tests require path realism

Expected failing command/test behavior:

- focused test reads the invalid fixture or temp copy
- validator or helper returns blocking taxonomy failure
- no generated positive fixture is mutated
- no aggregate or CI command consumes it by default

Maintenance burden:

- low to medium
- must update if allowed role-tag policy changes
- can stay small and independent from slice-specific source artifacts

Required boundary:

- fixture is invalid test input only
- no source authority
- no promotion
- no CI enforcement

Assessment:

```text
Recommended as first durable fixture candidate.
```

### Candidate 2: Missing Core View Coverage

Proposed location if implemented:

```text
examples/invalid/read-model-core-view-missing
```

Behavior protected:

- required Core View coverage must be present when the profile requires it
- validators must not silently pass incomplete graph coverage
- aggregate pass must not hide a per-slice coverage blocker

Why durable fixture is useful:

- 7 Core View coverage is central to read-model completeness
- durable example can make the missing-coverage failure reviewable
- it complements invalid tag coverage by testing completeness rather than taxonomy

High-level fixture shape:

- `README.md` or boundary marker stating this is invalid test input
- minimal generated read-model JSON or validation report missing one required Core View entry
- expected failure note naming the missing view

Expected failing command/test behavior:

- focused test confirms missing Core View coverage produces blocking validation result
- aggregate rule test can later confirm blocking propagation if useful
- current PR workflow does not run it

Maintenance burden:

- medium
- fixture may need update if Core View coverage representation changes
- should wait until the minimal invalid shape is stable enough not to mirror too much generated output

Required boundary:

- invalid test input only
- no source authority
- no promotion
- no CI enforcement

Assessment:

```text
Recommended as second durable fixture candidate, or kept temp-only if generated coverage shape is still changing.
```

### Candidate 3: Pilot Marker Required But Missing Marker

Proposed location if implemented:

```text
examples/invalid/read-model-pilot-marker-missing
```

Behavior protected:

- `pilot-marker-backed` profiles must require a scoped pilot marker
- Todo Search-like policy cannot pass when pilot-marker Evidence disappears
- scoped source-authority boundaries remain explicit

Why durable fixture is useful:

- protects a high-value authority boundary
- directly exercises policy-level requirements beyond generic graph structure

Why not first:

- more Todo Search shaped than the tag and Core View candidates
- may need copied source/report layout that is larger than necessary
- could be mistaken as a real pilot slice unless the boundary marker is very clear

High-level fixture shape:

- `README.md` boundary marker
- minimal Todo Search-like validation inputs with `pilot-marker-backed` policy
- missing `scoped-source-authority-pilot-marker.json`
- expected blocking report/reference

Expected failing command/test behavior:

- focused test confirms pilot-marker-backed validation blocks when marker is absent
- no source/manual/generated positive artifacts are mutated

Maintenance burden:

- medium to high
- coupled to pilot-marker-backed policy and marker filename

Required boundary:

- invalid test input only
- no scoped pilot execution
- no source authority
- no promotion

Assessment:

```text
Keep as a later durable candidate after one generic durable fixture exists.
```

### Candidate 4: Structure-Only Policy Conflict

Proposed location if implemented:

```text
examples/invalid/read-model-structure-only-policy-conflict
```

Behavior protected:

- `structure-only` profiles must not accidentally require parity, pilot marker, or CI-backed Evidence
- Todo App PBE Run must not be silently promoted beyond structure-only
- policy-level requirements must match profile level

Why durable fixture is useful:

- protects Todo App PBE Run from accidental over-strengthening
- verifies policy-level separation without source-authority implications

Why not first:

- much of this can remain inline/temp by corrupting registry policy requirements
- durable fixture may need a not-yet-stable policy schema for expressing conflicts
- first durable fixtures should prove more universal validator behavior

High-level fixture shape:

- `README.md` boundary marker
- structure-only registry/profile entry that incorrectly declares parity or pilot marker required
- expected blocking policy-conflict result

Expected failing command/test behavior:

- command-plan or validate-all test rejects conflicting policy requirements
- no generated output is created or mutated

Maintenance burden:

- medium
- should wait until registry policy requirement fields are stable enough to fixture

Required boundary:

- invalid test input only
- Todo App PBE Run remains structure-only
- no promotion
- no CI enforcement

Assessment:

```text
Keep inline/temp for now; reconsider when registry policy fields are stable.
```

## Recommendation

Choose the first two durable candidates only:

1. `examples/invalid/read-model-invalid-view-scoped-tags`
2. `examples/invalid/read-model-core-view-missing`

Rationale:

- both protect generic read-model invariants rather than Todo Search-specific authority policy
- both are reviewable with small fixture shapes
- together they cover taxonomy and completeness
- neither requires promoting Todo App PBE Run or expanding source authority
- they can be tested locally without changing CI workflow behavior

Keep these candidates inline/temp for now:

- `pilot marker required but missing marker`
- `structure-only policy conflict`

Rationale:

- pilot marker missing is important but more authority-policy-specific and likely larger
- structure-only policy conflict is better expressed as an inline/temp registry mutation until policy fields stabilize

## Suggested Implementation Sequence

If implementation is later approved:

1. Add fixture README/boundary marker for each selected durable fixture.
2. Add minimal invalid artifact(s) only; avoid copying a full generated slice unless necessary.
3. Add focused tests asserting the expected blocking behavior.
4. Keep fixtures outside `generated/`.
5. Do not mutate positive fixtures.
6. Do not wire invalid fixtures into CI workflow.
7. Keep invalid fixtures out of `validate --all` positive registry unless a separate invalid-fixture runner is designed.

## Non-Scope

This candidate plan does not:

- create `examples/invalid/read-model-*` fixtures
- modify parser, CLI, or tests
- modify `.github/workflows/read-model-evidence.yml`
- regenerate generated artifacts
- create a PR
- dispatch GitHub Actions
- add required checks
- add branch protection
- introduce CI enforcement
- expand source authority
- perform public-doc cleanup
- promote Todo App PBE Run beyond `structure-only`
- approve full Graph-source promotion

## Gate Self-Check

| Gate                               | Result | Notes                                                                   |
| ---------------------------------- | ------ | ----------------------------------------------------------------------- |
| Design-Only Gate                   | PASS   | No fixture, code, test, workflow, or generated artifact is created.     |
| Candidate Narrowing Gate           | PASS   | First durable candidates are narrowed to invalid tags and missing view. |
| Positive Fixture Preservation Gate | PASS   | Positive Todo Search and Todo App fixtures remain untouched.            |
| CI Boundary Gate                   | PASS   | Invalid fixtures remain outside current manual/PR CI workflow.          |
| Source Authority Boundary Gate     | PASS   | Fixture planning does not alter source authority.                       |
| Non-Full-Promotion Gate            | PASS   | Full Graph-source promotion remains separate.                           |
| User Approval Boundary Gate        | PASS   | This plan does not replace user approval or acceptance.                 |

## Final Statement

This document narrows the first durable negative fixture candidates. It does not implement fixtures, tests, workflow
changes, enforcement, source authority expansion, or promotion.
