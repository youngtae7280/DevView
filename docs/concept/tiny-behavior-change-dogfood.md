# Tiny Behavior-Change Dogfood

Status: completed / bounded behavior change / non-enforcing

## Requested Change

Run a first small behavior-change dogfood where Graph-source/read-model/Evidence artifacts guide and verify a real but
reversible runtime fixture behavior change.

Selected behavior change:

- fixture: `examples/adoption/todo-search-slice/runtime-fixture`
- previous behavior: multi-word search queries matched only when spacing matched the stored title/note/content text.
- new behavior: repeated whitespace inside multi-word queries is collapsed before matching.
- example: `runtime    evidence` now matches the note `Summarize PP-001 runtime evidence`.

## Graph Context Used

The change stays inside the existing Todo Search selected scope:

- Product node: `PT-SEARCH-001`
- Acceptance criterion: `AC-SEARCH-001`
- Work node: `WT-SEARCH-001`
- Test node: `TT-SEARCH-004`
- Evidence node: `EV-SEARCH-NOTE-TEST`
- Source graph: `examples/adoption/todo-search-slice/graph-source.json`

The graph-source boundary kept the change small: title + note/content search behavior changed only by query
normalization. Tag, date, fuzzy, server-side, and saved search stayed out of scope.

## Expected Delta

Expected changed values:

- runtime helper normalizes repeated whitespace;
- runtime test count increases from `6` to `7`;
- Product/Test/Evidence wording names normalized query behavior;
- Graph-source/read-model generated evidence refreshes while preserving node/edge/Core View shape.

Expected unchanged values:

- selected scope remains title + note/content search;
- non-scope search dimensions remain excluded;
- Todo Search graph-source projection remains `projection-contract-pass`;
- validate-all remains non-enforcing;
- tree-native retirement remains not approved.

## Actual Delta

The runtime fixture now trims and collapses repeated whitespace for the query and searchable text before matching. A new
test proves `runtime    evidence` matches the existing note text.

No UI, full app runtime, source-authority policy, required check, enforcement, or retirement behavior changed.

## Validation Chain

Required passing signals:

- `npx vitest run examples/adoption/todo-search-slice/runtime-fixture`: runtime behavior proof.
- `graph read-model validate --all --json`: Todo Search remains `projection-contract-pass` with `40` nodes, `59` edges,
  and `7` Core Views.
- `graph read-model report-health --json`: `graph-source-health-pass`, `aggregate-pass`, `non-enforcing`.
- `graph read-model report-intent --json`: intent-critical fixtures still pass and remain separate from validate-all.
- `npm run test:read-model:e2e`: E2E smoke remains `e2e-smoke-pass`.

## Why This Did Not Enable Enforcement Or Retirement

This dogfood changed a bounded runtime fixture behavior and its linked proof. It did not configure required checks,
branch protection, CI enforcement, source-authority expansion, user acceptance, or tree-native retirement.
