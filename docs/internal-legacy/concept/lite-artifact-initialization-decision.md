# Lite Artifact Initialization Decision

Status: policy decision / broad skeleton retained / no init behavior change

## Purpose

This document decides whether the `lite` compatibility profile should get reduced artifact initialization now.

Decision:

```text
Keep broad-skeleton initialization for now.
Do not prune Lite artifacts until lightweight Product/Work/Test/Evidence authoring and external slice enrollment are
clearer.
```

This decision is based on recent external dogfooding evidence and the current CLI/template/validator shape. It does not
change TypeScript code, schemas, validators, state semantics, templates, examples, CI, source authority, or branch
protection.

## Current Lite Init Behavior

`pbe init --profile lite` currently creates the same broad `.pbe` skeleton as `full` and `bypass`.

The profile value is stored as compatibility metadata:

```text
.pbe/blueprint/pbe-state.json -> autoflow.profile = "lite"
```

Current generated footprint observed by the artifact footprint audit and rechecked in this decision pass:

| Profile  | `.pbe` files | `.pbe` directories | Behavior                                       |
| -------- | ------------ | ------------------ | ---------------------------------------------- |
| `lite`   | 27           | 13                 | Same broad skeleton as `full`; profile differs |
| `full`   | 27           | 13                 | Broad compatibility skeleton                   |
| `bypass` | 27           | 13                 | Same broad skeleton; profile differs           |

Fresh `lite` initialization currently:

- creates Product/Project/Work/Test tree placeholders;
- creates Change/Impact/Product Patch/Acceptance/Evidence control artifacts;
- creates neutral visual/profile artifacts;
- creates blueprint compatibility views;
- creates evidence and execution directory skeletons;
- records `INIT`, `nextStep: rpd`, and `deliveryStatus: waiting_root_confirmation`;
- passes `pbe status --json`;
- passes `pbe validate --json`;
- passes v2 validation because optional visual/profile artifacts use neutral `not_required` shapes.

## Evidence From External Dogfooding

### External Feature Dogfooding 1

The first real external feature dogfooding run implemented a bounded `mdn/todo-vue` title-search slice.

The important result was not that there were too many files in `.pbe`. The important result was:

- implementation was possible;
- adoption-safe validation passed;
- targeted external checks passed;
- `files check` correctly failed because `src/App.vue` was not declared in Work Tree `expectedFiles`;
- `rpd check` correctly failed because Product root confirmation and ambiguity resolution were not complete;
- `execution complete` and `review submit` were not run.

Conclusion:

```text
The immediate bottleneck is lightweight Product/Work/Test/Evidence and expectedFiles authoring, not artifact count alone.
```

### External Graph-Source Enrollment Design

The external enrollment design chose the smallest safe enrollment unit as:

```text
external feature slice + selected expectedFiles subset + evidence package
```

That design is not implemented yet. Pruning initialization before this enrollment/authoring path exists would remove
compatibility surfaces without giving PBE the missing slice authoring ability.

## Why Not Prune Now

Lite artifact pruning should wait because:

1. Existing validators and status reporting already understand the broad skeleton.
2. Fresh external initialized projects validate with the broad skeleton.
3. Neutral visual/profile artifacts no longer block fresh init.
4. Current `lite` status guidance already states that no reduced artifact initialization exists.
5. The missing piece for external feature work is selected-slice authoring, especially `expectedFiles`, Test, and
   Evidence.
6. Removing optional artifacts now could break compatibility assumptions without improving File Change Guard readiness.
7. The graph-source external enrollment path is still design-only.

Pruning now would be a cleanup-looking change with a high chance of creating validator/template edge cases. It would not
solve the Step 1 dogfooding blocker.

## Must-Keep Lite Artifacts / Guards

Even after future pruning, compact-depth work must preserve these guards:

- `pbe-state` / profile metadata so status and transitions remain deterministic.
- Product intent or mini Product/AC summary.
- Work scope with `expectedFiles`.
- Test/Evidence plan, even if minimal.
- Evidence Tree or equivalent evidence references.
- Acceptance/user-review boundary.
- File Change Guard inputs and output.
- Change/Impact/Product Patch path for product meaning or accepted-branch changes.
- Neutral visual/profile representation when no visual work is selected.
- Adoption-safe validation behavior for initialized external projects.

Compact depth may reduce interview depth and reporting length. It must not remove traceability.

## What Could Be Pruned Later

Future pruning candidates remain candidates only:

- Lazy-create optional visual artifacts when visual work is selected:
  - `visual-reference`;
  - `ui-theme-spec`;
  - `design-tokens`;
  - `component-style-contract`;
  - `visual-verification-profile`;
  - `visual-audit`.
- Lazy-create UI inventory artifacts only when UI work is selected.
- Lazy-create empty evidence subdirectories only when evidence is attached.
- Consider lower-tree creation on first RPD/WPD/VD closure rather than at init.
- Consider a true no-tracking `bypass` behavior separately from compact depth.

These candidates require tests and compatibility policy before implementation.

## Readiness Criteria For Future Lite Pruning

Do not implement Lite artifact pruning until these are true:

- External feature slice authoring can record mini Product/AC, Work scope, `expectedFiles`, Test/Evidence, and review
  boundary without broad manual artifact editing.
- File Change Guard can pass for a bounded external slice after the authoring path is used.
- Missing optional artifacts are clearly classified as optional and still pass validation.
- Present optional artifacts still validate strictly.
- Existing initialized projects with broad skeletons remain valid.
- `pbe status` can explain missing/lazy artifacts without treating them as broken.
- Tests compare `lite`, `full`, and `bypass` footprints before and after any behavior change.
- At least one external dogfooding slice proves that reduced init helps the workflow without hiding safety obligations.

## Current Decision

Current decision:

```text
Policy-only. Keep broad-skeleton initialization.
```

No implementation is made in this step.

The next useful implementation is not artifact pruning. It is a lightweight authoring/enrollment path that can create or
record:

- mini Product/AC summary;
- selected Work scope;
- `expectedFiles`;
- minimal Test/Evidence plan;
- review/user-acceptance boundary.

## Non-Goals

This decision does not:

- remove templates or schemas;
- change `pbe init`;
- change validators;
- change state machine semantics;
- add a command;
- implement external graph-source enrollment;
- expand source authority;
- change Candidate B or branch protection;
- change CI;
- change README;
- change examples/valid or examples/invalid semantics;
- record user acceptance.
