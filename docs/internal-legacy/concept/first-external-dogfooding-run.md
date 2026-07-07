# First External Dogfooding Run

Status: completed-observation / external-project-local-run / no-upstream-push / blocker-found

## Purpose

This record captures the first external project dogfooding run after the external dogfooding readiness summary. The
goal was to try PBE on a small bounded external slice without enabling enforcement, expanding source authority, changing
CI, or requiring upstream changes.

## External Project

- Repository: `https://github.com/mdn/todo-vue`
- Local clone: `C:\Users\김영태\Documents\PBE-external-dogfood\todo-vue`
- External HEAD observed: `8a7ef579f1d117a8ac9530a52f5c5a81c3e99676`
- Project type: Vue / Vite sample Todo app
- Relevant scripts:
  - `npm run build`
  - `npm run lint`

## Slice

Selected bounded slice:

```text
Improve the empty-list summary copy shown after all todo items are deleted.
```

Rationale:

- one source file expected: `src/App.vue`
- no DB, auth, API, hardware, concurrency, package, or CI change
- small user-visible copy/UX improvement
- suitable first Lite dogfooding slice

## PBE Profile Recommendation

Command:

```powershell
node C:\Users\김영태\Documents\PBE\dist\cli\index.js profile recommend --brief "Improve todo-vue empty list summary copy for a small bounded dogfooding slice" --files src/App.vue --json
```

Result:

- recommended profile: `lite`
- confidence: `high`
- escalation triggers retained
- no state or artifacts mutated by recommendation

Observation:

- The recommendation was directionally correct.
- One reason said `docs-only or low-risk documentation change` even though the expected file was `src/App.vue`.
- This is a wording/heuristic explanation gap, not a blocker for the slice.

## Code Change Trial

The trial change was:

```diff
computed: {
  listSummary() {
+   if (this.ToDoItems.length === 0) {
+     return "No to-do items yet. Add one above to get started.";
+   }
    const numberFinishedItems = this.ToDoItems.filter(
      (item) => item.done,
    ).length;
```

This keeps existing behavior for non-empty lists and improves the all-items-deleted state.

## Verification

Commands run in the external clone:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run lint
npx.cmd prettier --write src/App.vue
npx.cmd prettier --check src/App.vue
npx.cmd eslint src/App.vue
npm.cmd run build
```

Results:

- `npm.cmd install`: pass, but touched `package-lock.json`; it was restored because it was outside the slice.
- `npm.cmd run build`: pass.
- `npm.cmd run lint`: failed on broad baseline formatting, including upstream files and generated `.pbe` files.
- `npx.cmd prettier --check src/App.vue`: pass after formatting the changed file only.
- `npx.cmd eslint src/App.vue`: pass.
- final `npm.cmd run build`: pass.

## PBE Init Trial

Command:

```powershell
node C:\Users\김영태\Documents\PBE\dist\cli\index.js init --profile lite --brief "Improve todo-vue empty list summary copy for a small bounded dogfooding slice"
```

Result:

- `.pbe/` initialized successfully.
- `pbe status --json` showed `profile: lite` compatibility metadata and compact-depth guidance.

## Blocking Findings

### 1. Compact-depth init still creates broad artifact skeletons

Even for a tiny one-file compact slice, `pbe init --profile lite` generated the broad `.pbe` artifact set.

This matches the known compatibility profile limitation:

```text
No dedicated pbe lite command.
No reduced artifact initialization.
```

### 2. External project validation is not yet adoption-safe

Running:

```powershell
node C:\Users\김영태\Documents\PBE\dist\cli\index.js validate --json
```

from the external clone failed because current validation still includes PBE-plugin-repository assumptions:

- README layout validator expected `.pbe/tree/`, `.pbe/execution/`, `.pbe/control/`, `.pbe/evidence/`,
  `.pbe/blueprint/`, `RPD`, `WPD`, `VD`, and `ACEP` to be documented in the external project's README.
- Compatibility core expected a full `.pbe/codex-execution-pack/` ACEP package.
- v2 visual profile template references pointed at template node IDs that were not present in the initialized external
  project trees.

This is the primary external dogfooding blocker.

### 3. Whole-repo lint is too broad for this dogfooding slice

`npm run lint` runs `eslint && prettier --check .`. After PBE init, the check also included `.pbe/` artifacts and failed
on broad formatting differences. The changed source file passed targeted Prettier and ESLint checks.

This suggests external dogfooding needs clearer separation between:

- project-owned checks;
- PBE artifact checks;
- slice-targeted checks;
- baseline repository formatting issues.

## What This Run Proved

- PBE can map a bounded external one-file slice to compact workflow depth using the `lite` compatibility value.
- `pbe status` compatibility profile guidance is useful in an external clone.
- The actual app slice can be implemented and verified with targeted checks.
- Current `pbe validate` is not yet safe as a generic external-project adoption command.

## What This Run Did Not Do

This run did not:

- push to the external repository;
- open a PR;
- change PBE source code;
- change PBE validators;
- change schemas;
- change CI workflows;
- enable required checks;
- expand source authority;
- retire tree-native artifacts;
- mark user acceptance.

## Recommended Next Work

Before more external dogfooding, prepare an adoption-safe validation path.

Candidate next work:

1. Define external-project validation mode boundaries.
2. Separate PBE plugin repo validators from initialized-project validators.
3. Prevent README layout checks from running against arbitrary external project README files.
4. Make Lite init either generate a reduced artifact set or clearly mark unsupported full closure commands.
5. Fix template/default visual profile references so initialized external projects do not start with missing-node v2
   validation errors.
6. Add a targeted file/evidence guard path for tiny Lite slices.

## Next User Decision

The next decision is:

```text
Should PBE implement an adoption-safe external-project validation mode before attempting another external dogfooding
slice?
```

Recommended answer:

```text
Yes. Fix adoption-safe validation boundaries first.
```
