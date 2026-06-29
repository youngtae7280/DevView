# External Graph-Source Enrollment Design

Status: design-only / no external enrollment / no source-authority expansion

## Purpose

This document designs the safe path for enrolling an external project or external feature slice into PBE
Graph-source/read-model surfaces.

It uses the first real external feature dogfooding run as the main evidence. The external `mdn/todo-vue` feature slice
proved that implementation and adoption-safe validation are possible, but also showed that PBE must not treat external
source changes as in-scope until Product, Work, Test, Evidence, and file-scope obligations are explicit.

This design does not implement enrollment, does not register `mdn/todo-vue`, does not expand source authority, does not
change schemas, validators, state, CLI behavior, CI, examples, or branch protection, and does not record user
acceptance.

## Evidence From Real External Feature Dogfooding

The first real external feature dogfooding run is recorded in:

```text
docs/concept/real-external-feature-dogfooding-1.md
```

Observed external target:

- repository: `https://github.com/mdn/todo-vue`;
- external HEAD: `8a7ef579f1d117a8ac9530a52f5c5a81c3e99676`;
- selected slice: title-only Todo search;
- changed external file: `src/App.vue`;
- external upstream push: not performed.

What worked:

- `profile recommend` ran from the external checkout and conservatively recommended `full`.
- `pbe init`, `pbe status`, and `pbe validate` worked in the external checkout.
- Adoption-safe validation did not require PBE plugin repository README layout, skill inventory, templates, schemas,
  examples, or repository-only checks.
- The feature implementation built successfully and targeted checks for `src/App.vue` passed.

What correctly blocked:

- `files check` failed with `FILE_CHANGE_OUTSIDE_WORK_SCOPE` because `src/App.vue` was not declared in a selected or
  foundation Work node `expectedFiles`.
- `rpd check` failed because the initialized Product root had no user confirmation and unresolved ambiguity.
- `execution complete` and `review submit` were not run because the run remained at `INIT` and File Change Guard did not
  pass.

Design conclusion:

```text
External enrollment must start from a bounded feature slice with explicit Product/AC, Work scope, expectedFiles, Test,
Evidence, and review boundaries. It must not start by enrolling an entire external repository as authoritative.
```

## External Enrollment Unit

The smallest safe external enrollment unit is:

```text
external feature slice + selected expectedFiles subset + evidence package
```

The unit is not the whole external repository by default.

Recommended enrollment granularity:

| Candidate unit                    | Decision               | Reason                                                                                 |
| --------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| External repo root                | Do not use as default  | Too broad; can imply authority over files and behavior that were never reviewed.       |
| External feature slice            | Preferred unit         | Matches PBE's bounded work model and can preserve Product/Work/Test/Evidence linkage.  |
| Selected `expectedFiles` subset   | Required sub-boundary  | Lets File Change Guard distinguish selected work from unrelated external repo changes. |
| Read-only observation package     | Allowed before enroll  | Useful for dogfooding evidence when Product/Work/Test authoring is not ready.          |
| Positive read-model registry item | Future approval needed | Registry enrollment can imply recurring validation and must not happen accidentally.   |

An external slice should be identified by a stable local enrollment id, not only by a path:

```text
external:<owner>/<repo>#<slice-id>
```

Example candidate only:

```text
external:mdn/todo-vue#title-search
```

This example is not enrolled by this document.

## Required Preconditions

Before an external feature slice can be enrolled into graph-source/read-model surfaces, PBE should have these
preconditions.

### Product / AC Preconditions

- A Product intent summary exists.
- Acceptance Criteria are concrete enough to test.
- Product root or slice summary is user-confirmed, or explicitly marked as a dogfooding draft that cannot advance to
  execution/review closure.
- Ambiguity that blocks acceptance criteria is resolved.
- Non-scope is explicit.

### Work Scope Preconditions

- Selected Work node or equivalent slice contract exists.
- `expectedFiles` lists every source file the slice may change.
- `forbiddenFiles` lists files that must not change when known.
- `expectedSharedFiles` is declared when shared files are intentionally touched.
- External baseline changes are separated from selected-slice changes.
- File Change Guard can explain all source changes.

### Test / Evidence Preconditions

- Test plan links to Product/AC or the external slice contract.
- Evidence requirements match the work type.
- At least one concrete command/manual evidence path exists.
- Known external tooling blockers are recorded separately from selected-slice failures.
- Evidence does not claim user acceptance.

### External Source Preconditions

- External repository identity is recorded.
- External source commit SHA is recorded.
- External checkout path class is recorded without secrets.
- External upstream push status is explicit.
- External license/upstream contribution rules are not assumed by PBE.

### Review Preconditions

- Review status is explicit.
- User acceptance is not self-recorded by Codex.
- Source-authority promotion remains blocked until separately approved.

## Proposed Future Artifact Fields

Future external enrollment should record metadata that is deterministic enough for validation but narrow enough to avoid
accidental source-authority expansion.

Candidate fields:

| Field                     | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `enrollmentId`            | Stable id for the external slice enrollment candidate.                |
| `enrollmentRole`          | `observation`, `candidate`, `structure-only`, `pilot`, or `source`.   |
| `externalRepository`      | External repository URL or owner/name.                                |
| `externalSourceRef`       | Commit SHA, tag, or local source ref used as evidence.                |
| `sliceId`                 | Human-readable slice id, such as `title-search`.                      |
| `sourceRootClass`         | Temp checkout, local clone, or project root class.                    |
| `productSummary`          | Product intent for the external slice.                                |
| `acceptanceCriteriaIds`   | Linked AC ids when present.                                           |
| `expectedFiles`           | External files allowed for this slice.                                |
| `forbiddenFiles`          | External files blocked for this slice.                                |
| `actualChangedFiles`      | Observed changed files from the dogfooding run or execution.          |
| `testCommands`            | Project commands used as verification evidence.                       |
| `evidenceRefs`            | Command output, screenshots, doc excerpts, or manual result records.  |
| `knownBaselineFailures`   | External repo failures not caused by the selected slice.              |
| `nonScope`                | Explicitly excluded behavior/files.                                   |
| `reviewStatus`            | Draft, implemented, verified, submitted-for-review, or accepted.      |
| `userAcceptanceBoundary`  | Statement that user acceptance is external/manual.                    |
| `sourceAuthorityBoundary` | Statement limiting what source role is claimed.                       |
| `registryBoundary`        | Whether this is outside positive registry, candidate-only, or active. |

These fields are proposed design metadata. They are not a schema in this step.

## Projection Metadata

When graph-source/read-model projection eventually supports external slices, the projection should carry:

- external enrollment id;
- source repository and commit SHA;
- slice id;
- Product/Work/Test/Evidence node refs where available;
- expected and actual file sets;
- node/edge counts;
- retained warnings;
- baseline tooling blockers;
- evidence command summaries;
- non-promotion statement;
- user acceptance boundary.

Projection output should make the external boundary obvious:

```text
This projection is evidence for an external feature slice only. It is not repo-wide source authority, upstream
acceptance, branch protection, or user acceptance.
```

## File Change Guard Integration

The Step 1 dogfooding run showed that File Change Guard is the first hard boundary an external slice must satisfy.

Future external enrollment should integrate File Change Guard like this:

1. Enrollment draft records `expectedFiles`, `forbiddenFiles`, and `expectedSharedFiles`.
2. Before implementation, PBE reports the planned file boundary.
3. After implementation, `files check` compares actual external changed files against the selected slice boundary.
4. Files outside `expectedFiles` require one of:
   - Work scope update before execution continues;
   - Change/Impact routing;
   - Product Patch if product meaning changed;
   - explicit out-of-scope or revert decision.
5. `.pbe/` artifact changes are separated from external source file changes.

For the `mdn/todo-vue` title-search dogfooding slice, a future valid enrollment would need at minimum:

```text
expectedFiles:
- src/App.vue
```

The existing dogfooding run intentionally did not force this through state by hand. It recorded the missing Work scope as
the gap.

## Graph Execution-Contract Integration

The graph-native execution contract report is currently configured-slice scoped. It works for repo examples such as:

```powershell
node dist/cli/index.js graph execution-contract report --slice examples/adoption/todo-search-slice --json
```

Future external enrollment should let an external slice produce a graph execution-contract report only after enrollment
metadata exists.

The report should include:

- external enrollment id;
- source repository and external source ref;
- selected slice summary;
- source-authority boundary;
- executable work nodes;
- expected/forbidden/shared file contracts;
- verification and evidence requirements;
- command plan;
- known external baseline blockers;
- review and user-acceptance boundary;
- compatibility note that ACEP/task-card views remain available during migration.

The report must stay read-only until a separate implementation step approves persistent external contract generation.

## User Acceptance Boundary

External enrollment must not record user acceptance.

Allowed statuses before user review:

- observation-recorded;
- draft;
- implemented;
- locally-verified;
- submitted-for-review.

Blocked without explicit user/external maintainer decision:

- accepted;
- source-authority-promoted;
- upstream-approved;
- branch-protected;
- required-check-enforced.

Validation, build success, graph projection, read-model health, and Candidate B pass are evidence. They are not user
acceptance.

## Source-Authority Boundary

External enrollment should start with one of these roles:

| Role             | Meaning                                                                            |
| ---------------- | ---------------------------------------------------------------------------------- |
| `observation`    | Dogfooding record only; no recurring registry membership.                          |
| `candidate`      | Reviewed candidate metadata exists, but not positive validate-all membership.      |
| `structure-only` | Projection shape is validated, but not product/source authority.                   |
| `pilot`          | Bounded source role exists with explicit pilot marker/evidence.                    |
| `source`         | Stronger source role; requires explicit user approval and mature validation rules. |

The first external enrollment should normally start as `observation` or `candidate`. It should not jump directly to
`source`.

## What Remains Blocked Until User Approval

These actions require explicit future approval:

- enrolling `mdn/todo-vue` or another external project in the positive graph read-model registry;
- treating external graph-source metadata as authoritative;
- promoting an external slice from observation/candidate to source-authority-bearing;
- changing Candidate B or branch protection;
- pushing to external upstream;
- recording user acceptance;
- expanding source authority beyond the selected external slice;
- changing schemas, validators, state machine, or CI enforcement for external enrollment.

## External Enrollment Checklist

Use this checklist before any future external enrollment implementation:

- [ ] External repository identity is recorded.
- [ ] External source commit SHA is recorded.
- [ ] Slice id and non-scope are recorded.
- [ ] Product intent is summarized.
- [ ] Acceptance Criteria are concrete or the slice is marked observation-only.
- [ ] `expectedFiles` are known.
- [ ] `forbiddenFiles` / `expectedSharedFiles` are considered.
- [ ] Test/Evidence plan exists.
- [ ] Actual changed files are recorded after implementation.
- [ ] Baseline external tooling failures are separated from selected-slice failures.
- [ ] File Change Guard can pass or the blocking gap is recorded.
- [ ] User acceptance is not self-recorded.
- [ ] Registry enrollment is not implied by observation.
- [ ] Source-authority promotion is not implied by validation pass.

## Future Implementation Candidates

Candidate future work, not implemented here:

1. External enrollment metadata template.
2. External slice graph-source candidate artifact.
3. `graph execution-contract report` support for explicitly enrolled external candidate slices.
4. File Change Guard report mode that can show missing external `expectedFiles` before implementation.
5. Validator warning for external enrollment candidates without Product/AC or `expectedFiles`.
6. Registry candidate observation mode separate from positive validate-all.
7. External source ref and evidence manifest projection fields.
8. Optional CLI support for adoption-safe external slice authoring.

Each candidate must follow Complexity Governance: policy first, dogfooding next, warnings before errors, and commands
only after repeated deterministic artifact behavior.

## Non-Goals

This design does not:

- register `mdn/todo-vue`;
- enroll any external project in the graph read-model registry;
- expand source authority;
- change Candidate B, branch protection, or required checks;
- push to an external upstream repository;
- record user acceptance;
- change schemas, validators, state machine, CLI behavior, package scripts, CI, or examples;
- retire ACEP or tree-native artifacts;
- replace graph-native execution contract design;
- make `files check` permissive for external projects.

## Decision

External graph-source enrollment remains design-only.

The safe next step is not broad registry enrollment. The safe next step is a small implementation decision around how PBE
will author or record external Product/AC, Work scope, Test/Evidence, and `expectedFiles` before execution.

Recommended next approval branch:

```text
Should PBE add an external slice enrollment metadata template/checklist, or first improve lightweight Product/Work/Test
authoring so File Change Guard can pass for real external feature slices?
```
