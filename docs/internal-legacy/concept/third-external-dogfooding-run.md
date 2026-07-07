# Third External Dogfooding Run

Status: completed-observation / external-project-local-run / validation-pass / no-upstream-push

## Purpose

This record captures the third bounded external dogfooding run after:

- the adoption-safe validation path implementation;
- the fresh-init visual verification profile blocker fix;
- the external initialized project smoke regression hardening;
- the first graph-native execution contract report surface;
- the source-authority pilot retry that kept Todo App `structure-only`.

The goal was to verify that an external initialized project can complete:

```text
profile recommend -> init -> status -> validate
```

without the previous PBE plugin repository validator blocker or the fresh-init visual placeholder v2 blocker.

This run records observation evidence only. It does not push to the external repository, implement a broad external
feature slice, expand source authority, enable required checks, configure branch protection, change CI enforcement,
change schemas or state, retire tree-native artifacts, or weaken ACEP compatibility.

## External Target

- Repository: `https://github.com/mdn/todo-vue`
- Local temp checkout class: `%TEMP%\pbe-external-dogfooding-3\todo-vue-*`
- External HEAD observed: `8a7ef579f1d117a8ac9530a52f5c5a81c3e99676`
- Clone result: success
- External upstream push: not performed

The external checkout was used only for local smoke observation. The only external working tree mutation was local
`.pbe/` initialization.

## Commands Run

Commands were run from the external temp checkout using the local PBE CLI from this repository:

```powershell
node %PBE_REPO%\dist\cli\index.js profile recommend --brief "Add PBE tracking for a small todo search slice" --json
node %PBE_REPO%\dist\cli\index.js init --profile lite --brief "External dogfooding 3 validation smoke" --json
node %PBE_REPO%\dist\cli\index.js status --json
node %PBE_REPO%\dist\cli\index.js validate --json
git status --short
```

The graph-native execution contract report was also exercised from the PBE repository against the currently configured
repo example slice:

```powershell
node dist/cli/index.js graph execution-contract report --slice examples/internal-legacy/adoption/todo-search-slice --json
```

The external project was not enrolled as a graph-source/read-model slice.

## Profile Recommendation Result

`profile recommend` passed.

Observed result:

- `recommendedProfile`: `full`
- `workflowDepth`: `standard`
- `confidence`: `low`
- primary reason: uncertain scope/risk; conservative default is full
- `suggestedInitCommand`: `pbe init --profile full --brief "Add PBE tracking for a small todo search slice"`

This is conservative and acceptable. The brief says "todo search slice" without expected files or a bounded docs-only
file list, so PBE did not silently downgrade to compact workflow depth.

For this smoke run, `init --profile lite` was run explicitly to verify compact profile guidance and adoption-safe
validation after fresh external initialization.

## Init Result

`pbe init --profile lite` passed.

Observed result:

- `profile`: `lite`
- `.pbe/` artifacts were created locally in the external checkout;
- state initialized to `INIT`;
- next action remained RPD/Product Tree growth;
- no external source file was intentionally edited.

The broad `.pbe` skeleton is still created for compatibility. This run did not attempt artifact pruning or a separate
`pbe lite` command.

## Status / Profile Observation

`pbe status --json` passed.

Observed status:

- `initialized`: `true`
- `profile`: `lite`
- `state`: `INIT`
- `deliveryStatus`: `waiting_root_confirmation`
- `recommendedNextCommand`: `pbe rpd close or pbe rpd check`
- `profileGuidance.profile`: `lite`
- compact workflow guidance appeared with must-keep guards and escalation triggers
- limitations correctly stated that `lite` is compatibility metadata, not a separate public workflow
- status listed no dedicated `pbe lite` command and no reduced artifact initialization

This confirms `status --json` remains usable after external init and still shows compact profile guidance.

## Adoption-Safe Validation Result

`pbe validate --json` passed.

Observed validator surfaces:

```text
legacy validate:pbe: pass
v2 tree system: pass
```

The legacy initialized-project validator stack was:

```text
PBE layout
Autoflow state
RPD transition guard
WorkGraph
ACEP manifest
Revision
Project compatibility core
```

The external project was not required to satisfy PBE plugin repository validators such as README layout, skill
inventory, templates/schemas inventory, example fixtures, or plugin compatibility expectations.

This confirms the previous repo-only validator blocker remains resolved.

## Visual Placeholder Blocker Result

The previous fresh-init v2 blocker did not recur.

The initialized visual verification profile was neutral:

- contract checks were `required: false`;
- statuses were `not_required`;
- `evidenceRefs` were empty;
- `profiles` was empty;
- no placeholder references to missing Product, Project, Work, or Test nodes were materialized.

`pbe validate --json` reported:

```text
PBE v2 tree validation passed. Validated 15 .pbe tree artifact(s).
```

This confirms the fresh-init visual placeholder blocker is resolved for this external smoke path.

## Graph Execution-Contract Observation

The graph-native execution contract report was exercised against the safe configured Todo Search repo example slice:

```text
examples/internal-legacy/adoption/todo-search-slice
```

Observed result:

- `profileId`: `todo-search-selected-slice`
- `policyLevel`: `pilot-marker-backed`
- node/edge/Core View counts: 40 / 59 / 7
- source files reported: 20
- required commands: `graph read-model generate`, `graph read-model compare`, `graph read-model validate`
- ACEP compatibility remained true
- limitations stated report-only behavior, no `.pbe` mutation, no required gate, no source-authority expansion, no user
  acceptance replacement, and no ACEP/tree-native retirement

Current limitation:

The graph execution-contract report is registry/profile scoped. It works for configured PBE repo slices such as Todo
Search. It is not yet a generic external-project graph-source enrollment path, and this run did not invent an external
graph-source slice for `mdn/todo-vue`.

## External Git Status

External `git status --short` showed:

```text
?? .pbe/
```

No external source files were changed. No external commit or upstream push was made.

## What This Run Proved

- Network clone of `mdn/todo-vue` succeeded.
- `profile recommend` ran successfully and stayed conservative.
- `pbe init --profile lite` succeeded in an external checkout.
- `pbe status --json` remained usable and showed compact profile guidance.
- `pbe validate --json` passed in the initialized external project.
- Repo-only validators were not required for external project validation.
- The neutral visual verification profile no longer blocks fresh-init v2 validation.
- The graph execution-contract report surface works for the configured Todo Search repo example slice.

## Remaining Gaps Before Larger External Dogfooding

1. `profile recommend` still recommends full for ambiguous external todo-search wording without expected files.
2. Compact profile still creates a broad compatibility `.pbe` skeleton; no reduced artifact initialization exists.
3. Graph execution-contract reporting is currently configured-slice scoped and not an external enrollment workflow.
4. External dogfooding has validated init/status/validate, but not yet a real bounded external feature implementation
   and review loop.
5. Larger dogfooding should choose a small concrete external slice with expected files, Test/Evidence plan, and review
   boundary before any source-authority or graph registry expansion.

## Non-Goals

This run did not:

- push to the external upstream repository;
- implement a feature in the external project;
- enroll the external project in the graph read-model registry;
- expand source authority;
- promote Candidate B to branch protection or a required check;
- configure GitHub settings;
- change CI enforcement;
- change schemas or state;
- retire tree-native artifacts;
- remove or weaken ACEP compatibility;
- change examples/valid or examples/invalid behavior;
- replace user acceptance.

## Next User Decision

The next approved sequence step is Candidate B branch protection decision/evaluation.

Recommended boundary:

```text
Evaluate Candidate B branch protection separately. Do not treat this external dogfooding pass as source-authority
expansion, required-check approval, or user acceptance.
```
