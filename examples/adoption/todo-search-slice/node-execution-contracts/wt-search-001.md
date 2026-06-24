# Node Execution Contract: WT-SEARCH-001

Status: demo-support evidence snapshot

This file strengthens the representative runtime feasibility demo for Work node `WT-SEARCH-001`. It is not a
CLI-generated contract, not a task-card-only authority, and not Graph-source promotion.

## Source References

- `examples/adoption/todo-search-slice/product-tree.json`
- `examples/adoption/todo-search-slice/project-tree.json`
- `examples/adoption/todo-search-slice/work-tree.json`
- `examples/adoption/todo-search-slice/test-tree.json`
- `examples/adoption/todo-search-slice/evidence-tree.json`
- `examples/adoption/todo-search-slice/product-patch-tree.json`
- `examples/adoption/todo-search-slice/cycle-contract.md`
- `docs/execution-contracts.md`

## Derivation Notes

- Work node `WT-SEARCH-001` is derived from Product node `PT-SEARCH-001`.
- Project boundaries are derived from `PJ-TODO-LIST-SURFACE` and `PJ-TODO-SEARCH-HELPER`.
- Expected and forbidden files are copied from `work-tree.json`.
- Tests and Evidence are copied from `test-tree.json` and `evidence-tree.json`.
- Product Patch `PP-001` is a proposed meaning change and is not selected implementation scope.

## Limitations

- This is a manual demo-support Node Execution Contract.
- It does not run commands.
- It does not prove actual source code exists in the repository.
- It does not authorize implementation outside title-only search.

## Work Node

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| Work node           | `WT-SEARCH-001`                                   |
| Title               | Implement Todo title search                       |
| Scope class         | selected                                          |
| Product node        | `PT-SEARCH-001`                                   |
| Project nodes       | `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`   |
| Acceptance criteria | `AC-SEARCH-001`, `AC-SEARCH-002`, `AC-SEARCH-003` |

## Allowed Files

- `src/todo-list.tsx`
- `src/todo-search.ts`

## Forbidden Files / Behavior

- `src/tag-filter.ts`
- `src/server-search.ts`
- tag filter
- date filter
- fuzzy search
- server-side search
- saved search
- note/description search before Product Patch confirmation

## Required Tests And Evidence

| Test node       | Check                                | Evidence           |
| --------------- | ------------------------------------ | ------------------ |
| `TT-SEARCH-001` | Query filters Todo titles.           | `EV-SEARCH-TEST`   |
| `TT-SEARCH-002` | Empty query restores full Todo list. | `EV-SEARCH-TEST`   |
| `TT-SEARCH-003` | No title match shows empty state.    | `EV-SEARCH-REVIEW` |

## Evidence Freshness Rule

Evidence remains current for accepted title-only behavior. If Product Patch `PP-001` is confirmed, existing title-only
test and review evidence becomes stale or partial for the expanded title + note meaning until revised tests and evidence
are produced.

## Stop Conditions

Stop and create or use a Change/Impact path if:

- the requested behavior includes note/description content before `PP-001` is confirmed
- search scope expands to tag, date, fuzzy, server-side, or saved search
- implementation touches forbidden files
- a required Test or Evidence node is missing
- acceptance criteria change
- evidence freshness cannot be established after Product Patch confirmation

## Output Obligations

For selected title-only work, review must show:

- Product node and acceptance criteria
- Project boundary
- Work node and file boundary
- Test coverage
- Evidence links
- stale/partial Evidence exception if Product Patch `PP-001` proceeds

## Non-Promotion Statement

This Node Execution Contract is a demo-support snapshot only. It does not create source authority, change runtime
behavior, or promote Maintainability Graph.
