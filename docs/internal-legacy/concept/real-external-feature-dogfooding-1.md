# Real External Feature Dogfooding 1

## Purpose

This record captures the first real external feature dogfooding run after the external initialized-project validation fixes,
the graph-native execution contract read-only surface, and the Candidate B read-model check package.

The goal was to go beyond `init` / `status` / `validate` smoke testing and use PBE as a control layer while implementing
a tiny bounded feature in an external project.

This run did not push to the external upstream repository, did not enroll the external project in the graph registry, did
not expand source authority, and did not record user acceptance.

## External Target

- External repository: `https://github.com/mdn/todo-vue`
- External checkout class: `%TEMP%/pbe-external-feature-dogfooding-1/todo-vue-*`
- External HEAD: `8a7ef579f1d117a8ac9530a52f5c5a81c3e99676`
- Clone result: passed

## Selected Feature Slice

Selected slice:

- Add a client-side Todo title search/filter input.

Scope:

- Search Todo label/title text only.
- Empty query shows all todos.
- Matching is case-insensitive.
- A no-result empty state is shown when nothing matches.

Non-scope:

- No note, tag, date, fuzzy, server-side, or persistence search.
- No graph registry enrollment for the external project.
- No source-authority promotion.
- No external upstream push.
- No user acceptance recorded by Codex.

## Profile Recommendation

Command:

```bash
node %PBE_REPO%/dist/cli/index.js profile recommend --brief "Add title-only todo search to the existing Todo app" --json
```

Result:

- Recommended profile: `full`
- Confidence: `low`
- Reason summary: the request is a new UI feature slice and did not match the bounded docs-only Lite heuristic.

Chosen profile:

- `full`

The recommendation was conservative and appropriate for a real external feature change.

## Mini Product / AC Summary

Product intent:

Users should be able to narrow the visible Todo list by entering a title query without changing stored Todo data.

Acceptance Criteria:

- AC-EXT-SEARCH-001: When the search query is empty, all existing todos remain visible.
- AC-EXT-SEARCH-002: When the search query matches Todo label text, only matching Todo rows remain visible.
- AC-EXT-SEARCH-003: Search matching is case-insensitive.
- AC-EXT-SEARCH-004: When no Todo matches the query, a no-result empty state is visible.

This Product / AC summary was recorded as dogfooding evidence only. It was not user-confirmed in the external project.

## Work Scope

Expected files:

- `src/App.vue`

Actual external files changed:

- `src/App.vue`

Local-only external artifacts created:

- `.pbe/`

The `.pbe/` artifacts remained local in the temporary external checkout and were not pushed upstream.

## Test / Evidence Plan

Planned evidence:

- PBE profile recommendation output
- PBE init/status/validate output
- Targeted lint/format checks for `src/App.vue`
- External project build output
- File Change Guard result
- RPD check result

Manual review expected:

- User or external maintainer review remains required before acceptance.

## Implementation Summary

The external implementation added:

- A `Search todos` input bound to `searchQuery`.
- A `filteredToDoItems` computed value.
- Case-insensitive label matching.
- Empty-query passthrough behavior.
- A no-result empty state.
- A visible-summary count based on the filtered list.

## Commands Run

External PBE initialization and validation:

```bash
node %PBE_REPO%/dist/cli/index.js profile recommend --brief "Add title-only todo search to the existing Todo app" --json
node %PBE_REPO%/dist/cli/index.js init --profile full --brief "Add title-only todo search to the existing Todo app" --json
node %PBE_REPO%/dist/cli/index.js status --json
node %PBE_REPO%/dist/cli/index.js validate --json
```

Results:

- `profile recommend`: passed; recommended `full`.
- `init`: passed; initialized `.pbe/` with profile `full`.
- `status`: passed; state remained `INIT`, with next command `pbe rpd close or pbe rpd check`.
- `validate`: passed before and after implementation.

External project commands:

```bash
npm.cmd ci
npm.cmd run build
npm.cmd run lint
npx.cmd prettier --write src/App.vue
npx.cmd eslint src/App.vue
npx.cmd prettier --check src/App.vue
npm.cmd run build
```

Results:

- `npm.cmd ci`: passed.
- Baseline `npm.cmd run build`: passed.
- Baseline `npm.cmd run lint`: failed on existing repo-wide Prettier formatting issues.
- Targeted `npx.cmd eslint src/App.vue`: passed after implementation.
- Targeted `npx.cmd prettier --check src/App.vue`: passed after implementation.
- Post-implementation `npm.cmd run build`: passed.
- Post-implementation `npm.cmd run lint`: still failed on existing repo-wide Prettier formatting issues outside the selected feature file.

PBE control checks after implementation:

```bash
node %PBE_REPO%/dist/cli/index.js files check --json
node %PBE_REPO%/dist/cli/index.js rpd check --json
```

Results:

- `files check`: failed with `FILE_CHANGE_OUTSIDE_WORK_SCOPE` for `src/App.vue`.
- `rpd check`: failed with `ROOT_NOT_CONFIRMED_BY_USER`, `LEAF_NOT_TERMINAL`, and `AMBIGUITY_UNRESOLVED`.

## PBE CLI Flow Observations

What worked:

- External repo clone succeeded.
- PBE profile recommendation worked from the external checkout.
- PBE init/status/validate worked in the external checkout.
- External initialized-project validation did not require PBE plugin repo README, skills, templates, examples, or repository-only checks.
- The real feature implementation was buildable and targeted checks passed.

What blocked the full PBE workflow:

- The initialized Product root was not user-confirmed.
- No concrete Product / Work / Test artifact authoring happened through the current CLI flow before implementation.
- `files check` correctly blocked the changed `src/App.vue` because no selected/foundation Work node declared it in
  `expectedFiles`.
- `execution complete` and `review submit` were not run because the run remained at `INIT` and File Change Guard did not
  pass.

Dogfooding interpretation:

- The adoption-safe validation path is suitable for external initialized projects.
- The next gap is not validation safety; it is lightweight external Product/Work/Test/Evidence authoring for a real feature
  slice.
- PBE correctly refused to treat the implementation as in-scope without explicit Work scope.

## User Acceptance Status

Status:

- Implemented in a temporary external checkout.
- Locally verified with targeted lint/format and build evidence.
- Not accepted.
- Not pushed upstream.

User acceptance remains external/manual and must not be replaced by PBE validation output.

## Remaining Gaps Before External Graph-source Enrollment

- External feature slices need a practical Product / Work / Test / Evidence authoring path before execution.
- `expectedFiles` must be declared before File Change Guard can pass.
- External graph-source enrollment needs a separate design and approval step.
- External project baseline tooling issues should be separated from selected-slice failures.
- User review and acceptance need to remain explicit.
- Graph-native execution contracts are currently repo-example scoped, not external-project enrollment.

## Non-goals

- No external upstream push.
- No broad external rewrite.
- No graph registry enrollment.
- No source-authority expansion.
- No Candidate B branch protection or required-check change.
- No schema, state machine, validator policy, or CI change.
- No ACEP or tree-native artifact retirement.
- No user acceptance recorded by Codex.
