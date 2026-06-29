# Graph-Native Execution Contract Design

Status: design package / graph-native execution handoff / first read-only CLI report surface implemented

## Purpose

This package designs a future graph-native execution contract for graph-based PBE.

The first implementation adds a read-only CLI report surface. It does not add schemas, templates, validators, state
transitions, CI enforcement, required checks, branch protection, source-authority expansion, or artifact retirement.

The goal is to define what the primary execution handoff should eventually contain once graph-source and read-model
projection are mature enough to drive bounded work directly. Existing ACEP, `.pbe/codex-execution-pack`, task-card
views, Cycle Contracts, and Node Execution Contracts remain compatibility/execution views in this step.

## Implemented First Surface

The first implementation is intentionally small and report-only:

```powershell
node dist/cli/index.js graph execution-contract report --slice examples/adoption/todo-search-slice --json
```

The command reads configured read-model registry/profile/projection data and reports a graph-native execution contract
view for a selected configured slice. It includes source slice/profile identity, Product/Work/Test/Evidence references
available from the projection, source files, validation/readiness notes, escalation triggers, and a compatibility note
that ACEP remains the execution packaging path.

The command does not write `.pbe` state, does not generate a persistent execution artifact, does not become a required
handoff, and does not replace ACEP, user review, or user acceptance. Unknown slices fail with a clear report error
instead of being inferred from arbitrary directories.

## Current State Summary

The current graph-first workflow is already active for configured read-model slices:

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

Current source-authority boundaries:

| Surface                    | Current role                                 | Boundary                                                                                      |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Todo Search selected slice | limited Graph-source promoted selected slice | Bounded to the Todo Search selected slice only.                                               |
| Todo App PBE Run           | graph-source-backed `structure-only` profile | Structure-only; not source-authority-bearing beyond the structure contract.                   |
| Positive registry          | configured read-model validation registry    | Contains the current Todo Search and Todo App profiles only.                                  |
| ACEP / execution pack      | compatibility/execution view                 | Still packages bounded execution obligations for current tree-native and compatibility flows. |
| Repo-wide Graph-source     | not promoted                                 | No repo-wide source-authority expansion is approved.                                          |
| CI/read-model Evidence     | non-enforcing observation                    | Not a required check, branch protection rule, merge gate, Product acceptance, or user accept. |

The implemented adoption-safe validation path now allows external initialized projects to validate `.pbe` artifacts
without requiring PBE plugin repository README layout, skill inventory, examples, templates, schemas, or full ACEP
package inventory. This design assumes that boundary remains in place.

## Why A Graph-Native Execution Contract Is Needed

PBE should not derive executable work primarily from compatibility task-card views once graph-source authority is mature
enough to represent selected work directly.

A graph-native execution contract is needed to:

- make execution traceable from graph-source node to read-model projection to selected work/test/evidence scope;
- keep execution bounded to selected and foundation graph nodes;
- avoid treating task-card views as the future source of execution authority;
- preserve File Change Guard through explicit expected and forbidden file contracts;
- preserve verification through explicit Test and Evidence requirements;
- preserve Change, Impact, and Product Patch routing when execution discovers scope or product-meaning drift;
- preserve review and user-only acceptance after execution;
- let ACEP and task cards remain projections or compatibility views rather than primary source authority.

The contract should be a handoff artifact, not an automatic permission slip. It should make obligations explicit before
execution, and it should stop rather than silently expand scope when graph, projection, file, evidence, or acceptance
boundaries are unclear.

## Proposed Contract Inputs

A future graph-native execution contract should be generated from reviewed inputs, not guessed from prose.

Minimum proposed inputs:

| Input                                     | Purpose                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Graph-source artifact id/path             | Identifies the graph-source record that supplies selected execution context.                        |
| Read-model slice id/version               | Identifies the registry/profile and projection contract version used for the handoff.               |
| Selected graph nodes and projection ids   | Names the durable nodes and projected records included in current execution.                        |
| Product references when present           | Links graph execution back to Product meaning and acceptance criteria.                              |
| Work references when present              | Links graph execution to bounded Work obligations and implementation scope.                         |
| Test references when present              | Links graph execution to verification obligations.                                                  |
| Evidence references when present          | Links graph execution to required or existing proof records.                                        |
| Acceptance references when present        | Preserves review/acceptance closure boundaries and user-only acceptance.                            |
| `expectedFiles`                           | Defines files execution may change.                                                                 |
| `forbiddenFiles`                          | Defines files execution must not change.                                                            |
| `expectedSharedFiles`                     | Names shared files requiring extra review or sequential coordination.                               |
| Shared resources                          | Names generated directories, ports, caches, external resources, hardware, or credentials at risk.   |
| Risk/escalation triggers                  | Defines when execution must stop for Change/Impact/Product Patch/full review.                       |
| Current validation target/project context | Records whether the contract is for this plugin repo, an initialized project, or external adoption. |
| Current source-authority boundary         | Records whether the source role is source-backed, structure-only, candidate-only, or compatibility. |

## Proposed Contract Sections

The contract should be reviewable by a human and deterministic enough for future validation.

### Selected Slice Summary

Summarize the slice being executed:

- slice/profile id;
- graph-source artifact path;
- read-model projection path;
- policy level;
- source role;
- included graph node ids;
- excluded, deferred, blocked, and out-of-scope graph node ids.

### Source Authority Boundary

State what is authoritative for this execution and what is not.

The section should say whether the contract is:

- source-backed;
- pilot-marker-backed;
- parity-backed;
- structure-only;
- candidate-only;
- compatibility/fallback/reference only.

It must also state that generated Evidence, health reports, CI pass, and registry inclusion do not replace user
acceptance.

### Executable Work Nodes

List executable graph nodes and their projected Work obligations.

For each executable unit, include:

- graph node id;
- projection id;
- linked Product/Work ids if present;
- scope class: selected, foundation, deferred, blocked, or out_of_scope;
- intended behavior;
- implementation notes;
- dependencies;
- stop conditions.

Only selected and foundation units should be executable. Deferred, blocked, and out-of-scope units must remain visible
but non-executable.

### Verification / Test Requirements

Map executable work to verification:

- linked Test ids when present;
- acceptance criteria ids when present;
- scenario or pass criteria;
- required commands;
- required manual checks;
- negative, empty, error, permission, or regression cases when relevant.

The contract should preserve the principle that "test exists" is not enough; tests must prove observable results.

### Evidence Requirements

Define proof obligations before execution starts:

- command output evidence;
- screenshot or manual visual evidence;
- documentation excerpt evidence;
- API/request-response evidence;
- hardware/manual-not-verified evidence when constrained;
- timestamps/status/link requirements;
- Evidence ids or paths when known.

Evidence must prove the linked Test and Acceptance Criteria. Weak evidence such as "checked", "passed", or "looks good"
should not be enough for review closure.

### File-Change Guard Contract

Carry File Change Guard inputs directly in the contract:

- `expectedFiles`;
- `forbiddenFiles`;
- `expectedSharedFiles`;
- unknown file touch risk;
- generated/shared directory risks;
- allowed `.pbe` artifact writes;
- forbidden source paths.

If execution touches files outside the contract, it should stop and route through Change/Impact or a revised contract.

### Command Plan / Validation Plan

Record the commands expected for this execution:

- targeted project commands;
- PBE validation commands;
- graph read-model commands when relevant;
- evidence generation commands;
- manual checks when automation is unavailable.

The plan should prefer sequential execution unless parallel safety is proven.

### Parallel Safety / Sequential Default

Default to sequential execution.

Parallel execution should require explicit evidence that:

- source files are independent;
- `.pbe` artifact writes are independent;
- generated/shared directories are isolated;
- state transition commands are not concurrent;
- test environments are isolated;
- external resources are isolated;
- evidence order is independent;
- review and acceptance decisions are independent.

### Change / Impact / Product Patch Triggers

Define triggers that stop execution and require routing:

- Product meaning changes;
- acceptance criteria changes;
- scope boundary changes;
- UI/UX direction changes;
- verification strategy changes;
- unexpected file changes;
- DB/schema/auth/permission/API/hardware/concurrency changes;
- repeated review rejection;
- stale or invalidated evidence;
- source-authority or projection drift.

Product meaning mutation should use Product Patch Proposal. Accepted branch changes should use Change/Impact/Revision.

### Review And User-Acceptance Boundary

State that execution can end as implemented, verified, or submitted-for-review.

It must not mark work accepted on behalf of the user. User acceptance remains a separate decision and must not be
replaced by graph projection, validation pass, CI pass, or generated Evidence.

### Compatibility Projection To ACEP / Task-Card Views

The graph-native execution contract should be able to project compatibility views while those views remain supported:

- ACEP execution manifest;
- Cycle Contract;
- Node Execution Contracts;
- task-card views;
- traceability matrix;
- UI/UX and visual evidence checklist views;
- final coverage and final report templates.

These projected views should reference the graph-native contract and should not become independent execution authority.

## Lifecycle Proposal

The future contract may use this conceptual lifecycle:

```text
draft -> reviewable -> execution-ready -> submitted-for-review -> user-accepted
```

Do not add new states now.

For current behavior, map this lifecycle onto existing CLI flow:

| Contract lifecycle     | Current compatibility mapping                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `draft`                | graph-source/read-model projection and planning material exist, but execution scope is not final |
| `reviewable`           | selected scope, files, tests, evidence, and risks are visible for human/Codex review             |
| `execution-ready`      | current equivalent of ACEP-ready bounded handoff, validated through existing checks              |
| `submitted-for-review` | current `pbe review submit` / review-result boundary                                             |
| `user-accepted`        | current user-only `pbe accept` closure                                                           |

This lifecycle is vocabulary for design only. The read-only report surface does not change the state machine,
transition behavior, or execution readiness rules.

## Relationship To Existing Artifacts

### What It Can Eventually Replace

After dogfooding and explicit approval, a graph-native execution contract could eventually replace some primary uses of:

- ACEP execution-pack as the primary execution handoff;
- task-card-only planning views;
- tree-native selected-slice fallback views for promoted graph-source scopes;
- manual projection of Work/Test/Evidence obligations into compatibility files.

Replacement means "primary authority moves", not immediate file deletion.

### What Remains Compatibility / Fallback / Reference

The following must remain available until separate retirement approval exists:

- Product/Project/Work/Test trees;
- Change/Impact/Evidence/Acceptance/Product Patch trees;
- `.pbe/blueprint/*` compatibility views;
- `.pbe/codex-execution-pack/*`;
- ACEP manifests;
- Cycle Contracts and Node Execution Contracts;
- task-card views;
- `pbe-state.json` and `autoflow`;
- examples/valid and examples/invalid fixtures;
- validators, schemas, templates, and skills that still depend on tree-native or ACEP layouts.

### What Must Not Be Retired Yet

Do not retire ACEP, codex-execution-pack, tree-native artifacts, or compatibility views merely because this design
exists. Retirement requires graph-source registry coverage, projection parity or accepted structure-only status,
replacement contract coverage, validation coverage, external dogfooding evidence, migration notes, rollback/fallback
planning, and explicit user approval.

## External Adoption Implications

This design must remain compatible with adoption-safe validation:

- external initialized projects should not need PBE plugin repository docs, skills, examples, templates, or schema
  inventory to validate;
- missing optional graph-native execution contract artifacts should pass until the contract becomes required by current
  project state;
- present graph-native execution contract artifacts should validate once a schema/validator exists later;
- external projects should be able to start with compatibility `.pbe` artifacts and gradually add graph-native contract
  evidence when approved;
- graph-read-model registry validation should remain scoped to configured profiles and should not scan arbitrary
  external projects by accident;
- CI or read-model health pass should not replace Product or user acceptance.

## Future Implementation Plan

Future implementation should follow the governance ladder:

1. Dogfood the design through one or more bounded external slices using existing artifacts.
2. Write a template/checklist only after repeated contract fields prove useful.
3. Design a schema only after the contract shape stabilizes.
4. Add a projection generator only after registry/projection generalization is approved.
5. Add validator warnings before validator errors.
6. Add CLI support only after repeated deterministic need is demonstrated.
7. Keep ACEP/codex-execution-pack projection as compatibility output during migration.
8. Request explicit user approval before source-authority expansion, required checks, branch protection, or artifact
   retirement.

Potential future mutating/validating commands are candidates only:

- `pbe graph execution-contract generate`
- `pbe graph execution-contract validate`
- `pbe graph execution-contract project-acep`

Do not implement these commands until the contract is dogfooded and deterministic enough.

## Non-Goals

This package does not:

- implement a schema, template, validator, mutating command, or required handoff;
- add a graph-native execution artifact;
- change state machine behavior;
- change existing ACEP behavior;
- delete, rename, move, deprecate, or retire `.pbe/codex-execution-pack`;
- retire tree-native artifacts;
- enable required checks, branch protection, merge blocking, or CI enforcement;
- expand source authority;
- promote Todo App beyond `structure-only`;
- expand the read-model registry;
- enroll invalid fixtures in positive validation;
- replace Product acceptance or user acceptance;
- mutate external dogfooding projects.

## Next Approval Branches

The next implementation branch should not start automatically from this design.

Separate approval is needed before any of these branches:

1. Dogfood this contract shape on a bounded external slice.
2. Add a graph-native execution contract template/checklist.
3. Add a graph-native execution contract schema.
4. Add generator/projection support after registry generalization.
5. Add validator warnings or errors.
6. Add mutating or validating CLI command support.
7. Make graph-native execution contract a required handoff before execution.
8. Retire or downgrade any ACEP/codex-execution-pack surface.
