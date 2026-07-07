# Graph-First Primary Workflow

Status: current-workflow / graph-first / non-enforcing / no-implementation-change

## Purpose

This document describes the current primary Graph-first workflow for PBE.

It explains what is source authority today, what remains compatibility/fallback/reference, how read-model Evidence is
generated and checked, and where user acceptance stays separate.

This document does not implement a new workflow. It does not add a graph-native execution contract, expand source
authority, enable required checks, configure branch protection, change CI behavior, retire tree-native artifacts, or
change CLI, schema, validator, state, or example behavior.

## Current Status

PBE's current forward direction is Graph-source-backed read-model projection and Evidence.

Current status:

- Todo Search selected slice is limited Graph-source promoted.
- Todo App DevView Run is graph-source-backed for `structure-only`.
- Repo-wide Graph-source promotion is not complete.
- Tree-native retirement is not complete.
- CI/read-model Evidence remains informational and non-enforcing.
- Candidate B is prepared as a soft-required policy candidate, but it is not a required check.

The machine-readable status is recorded in
`examples/internal-legacy/read-model-aggregate/graph-source-transition-status.json`.

The positive registry is:

```text
examples/internal-legacy/read-model-aggregate/read-model-slices.json
```

It currently contains only the configured Todo Search and Todo App profiles.

## Primary Workflow Today

The primary Graph-first workflow today is:

```text
graph-source artifact
-> read-model projection
-> projection contract / expected counts
-> generated read-model Evidence
-> validate-all aggregate
-> report-health
-> e2e smoke
-> review / user acceptance remains separate
```

In command terms, the current observation path is:

```powershell
node dist/cli/index.js graph read-model validate --all --json
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

This path proves the configured read-model slices remain internally consistent. It does not prove repo-wide source
authority, does not approve tree-native retirement, and does not replace user acceptance.

## What Is Source Authority Today

Only configured Graph-source surfaces have source-authority roles.

| Surface                    | Current source role                              | Boundary                                                                                       |
| -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Todo Search selected slice | limited Graph-source promoted selected slice     | Scoped to the Todo Search selected slice only.                                                 |
| Todo App DevView Run       | confirmed Graph-source-backed `structure-only`   | Structure-only; not source-authority-bearing beyond the structure contract.                    |
| Positive registry          | configured read-model validation registry        | Defines configured validation profiles; does not expand source authority by itself.            |
| Generated read-model files | Evidence/projection output for configured slices | Reviewable generated Evidence; not user acceptance and not tree-native retirement approval.    |
| Health/E2E reports         | observation Evidence                             | Local/CI informational status; not a required check unless separately approved and configured. |

Source authority is not granted to every `.pbe` tree artifact, every initialized project, every example, or every
generated output.

## Compatibility / Fallback / Reference Today

The following remain compatibility/fallback/reference unless a later explicit decision changes their role:

- RPD, WPD, VD, ACEP, and Revision terminology.
- Product/Project/Work/Test tree artifacts.
- Change/Impact/Evidence/Acceptance/Product Patch artifacts.
- `.pbe/blueprint/*` compatibility views.
- `.pbe/codex-execution-pack/*`, ACEP manifests, task-card views, Cycle Contracts, and Node Execution Contracts.
- `pbe-state.json` and `autoflow` metadata.
- `full`, `lite`, and `bypass` profile metadata values.
- `examples/valid/*` and `examples/invalid/*` fixture layouts.
- schemas, templates, validators, and skills that still depend on tree-native compatibility surfaces.

These artifacts are important safety and migration surfaces. They should not be deleted or treated as obsolete merely
because configured Graph-source read-model slices exist.

## Read-Model Projection Flow

Read-model projection is the current bridge from source artifacts to reviewable graph Evidence.

The flow is:

1. A configured slice has a graph-source artifact.
2. The CLI projects that graph-source artifact into a read-model projection.
3. Projection output is checked against expected counts and policy-level boundaries.
4. Generated Evidence is written for configured slices.
5. Registry-backed validate-all summarizes the configured positive profiles.
6. Health reporting summarizes validate-all, projection status, transition status, retained warnings, and
   non-enforcement boundaries.

Current registry/projection generalization is not complete. The current registry is intentionally fixed to the two
configured positive profiles until a separate implementation branch is approved.

## Evidence And Validation Flow

The main graph-read-model evidence commands are:

```powershell
node dist/cli/index.js graph read-model validate --all --json
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

Supporting graph commands include scoped generation, projection, comparison, candidate observation, and intent reporting.

Validation boundaries:

- `validate --all` covers the configured positive registry profiles only.
- Invalid/negative fixtures remain focused regression inputs and are not part of positive validate-all or CI enrollment.
- `report-health` is a local/non-enforcing summary.
- `test:read-model:e2e` verifies current transition mechanics, including Todo Search, Todo App, aggregate status, and
  intent report health.
- CI/read-model Evidence is informational unless a separate required-check decision is approved and implemented.

## User Acceptance Boundary

Generated Evidence, projection contracts, validate-all aggregate pass, health reports, and CI pass do not replace user
acceptance.

PBE may report:

- generated Evidence passed;
- projection contract passed;
- validate-all aggregate passed;
- graph health passed;
- E2E smoke passed.

Only the user can accept product meaning, source-authority changes, tree-native retirement, and completed work.

## What This Does Not Replace

The Graph-first primary workflow does not replace:

- user acceptance;
- Product acceptance;
- bounded review;
- Change/Impact routing for product meaning changes;
- Product Patch confirmation;
- File Change Guard for source changes;
- migration/compatibility policy;
- external dogfooding evidence;
- explicit required-check or branch-protection approval.

## External Dogfooding Implications

The first external dogfooding run showed that PBE can handle a small bounded external slice, but it also found an
adoption-safe validation blocker.

Current implications:

- External dogfooding should continue with bounded slices.
- `pbe validate` is not yet a generic adoption-safe external-project validation path.
- External projects should not be forced to satisfy PBE-plugin-repository README/layout assumptions.
- Graph/read-model Evidence should stay non-enforcing unless explicitly approved.
- Generated Evidence churn should be reviewed separately from docs-only work.
- External dogfooding should not silently expand the positive registry or source-authority scope.

## Future Workflow Candidates

Future candidates require separate approval and implementation packages:

1. Graph-native execution contract.
2. Adoption-safe validation path for external projects.
3. Registry/projection generalization beyond Todo Search and Todo App.
4. Candidate B required-check decision and waiver/failure policy.
5. Todo App promotion beyond `structure-only`.
6. Tree-native fallback artifact deprecation, archive, or deletion.

These are future branches, not current behavior.

## Non-Goals

This document does not:

- expand source authority;
- promote Todo App beyond `structure-only`;
- enable required checks, branch protection, merge blocking, or CI enforcement;
- retire or delete tree-native artifacts;
- change schemas, templates, validators, state machine, CLI behavior, package scripts, or CI;
- enroll invalid fixtures in positive validate-all or CI;
- implement a graph-native execution contract;
- replace user acceptance with generated Evidence or health reports.

## Next Approval Branch Points

The next approval branch should decide which implementation direction starts next:

1. Adoption-safe validation path for external projects.
2. Graph-native execution contract design.
3. Registry/projection generalization.
4. Candidate B required-check enablement review.
5. Todo App limited source-authority pilot.
6. Continued external dogfooding without new enforcement.
