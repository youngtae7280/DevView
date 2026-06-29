# Third Bounded Maintenance Dogfood

Status: completed / Todo Search doc consistency / non-enforcing

## Requested Change

Run a Todo Search maintenance dogfood pass that uses the same Graph-source/read-model/health/E2E validation chain, but
keeps behavior and enforcement unchanged.

Selected maintenance change:

- file: `examples/adoption/todo-search-slice/README.md`
- old wording: demo-support files are "not Graph-source promotion"
- new wording: demo-support files are not the promotion action; current limited Graph-source status is represented by
  `graph-source.json` and generated read-model Evidence under `generated/`.

## Graph Context Used

Todo Search is the bounded selected-slice Graph-source example:

- source artifact: `examples/adoption/todo-search-slice/graph-source.json`
- source mode: `graph-source-backed`
- projection contract: `projection-contract-pass`
- expected shape: `40` nodes, `59` edges, `7` Core Views
- boundary: generated read-model, parity, validation, aggregate, and CI artifacts are projections or Evidence; they do
  not replace user acceptance, add enforcement, retire fallback artifacts, or promote Todo App PBE Run.

## Expected Delta

Expected changed values:

- Todo Search README wording only.

Expected unchanged values:

- graph-source JSON authority boundaries.
- generated Todo Search read-model shape.
- projection contract status.
- validate-all aggregate status.
- non-enforcement and tree-retirement boundaries.

## Actual Delta

The README now distinguishes demo-support artifacts from Graph-source status. This prevents a reader from treating old
demo-support wording as a denial of the current limited Graph-source-backed evidence path.

No Todo Search behavior, fixture, or source-authority setting changed.

## Validation Chain

Required passing signals:

- `graph read-model validate --all --json`: Todo Search remains `projection-contract-pass`, `40` nodes, `59` edges,
  `7` Core Views.
- `graph read-model report-health --json`: Todo Search remains `graph-source-backed`; repository health remains
  `graph-source-health-pass`.
- `npm run test:read-model:e2e`: Todo Search remains graph-source-backed and validates through the E2E smoke.
- `graph read-model report-intent --json`: intent-critical fixtures remain healthy and separate from validate-all.

## Why Behavior Did Not Change

This was a documentation consistency fix. It clarified where current Todo Search Graph-source status is recorded, but it
did not edit source behavior, generated authority semantics, required checks, branch protection, enforcement, acceptance,
or tree-retirement readiness.
