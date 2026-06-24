# Todo Search Demo-Support Cycle Contract

Status: demo-support evidence snapshot

This file strengthens the representative runtime feasibility demo. It is not a CLI-generated Cycle Contract, not a
runtime source artifact, and not Graph-source promotion.

## Source References

- `examples/adoption/todo-search-slice/README.md`
- `examples/adoption/todo-search-slice/product-tree.json`
- `examples/adoption/todo-search-slice/project-tree.json`
- `examples/adoption/todo-search-slice/work-tree.json`
- `examples/adoption/todo-search-slice/test-tree.json`
- `examples/adoption/todo-search-slice/evidence-tree.json`
- `examples/adoption/todo-search-slice/acceptance-tree.json`
- `examples/adoption/todo-search-slice/product-patch-tree.json`
- `docs/execution-contracts.md`
- `docs/evidence-and-coverage.md`

## Derivation Notes

- Selected scope is derived from Product node `PT-SEARCH-001` and Work node `WT-SEARCH-001`.
- Project boundary is derived in `project-tree.json` from existing selected-slice snapshots.
- Validation hints and expected files come from `work-tree.json`.
- Evidence obligations come from `test-tree.json` and `evidence-tree.json`.
- Product Patch `PP-001` is not confirmed and is treated as change pressure, not selected implementation scope.

## Limitations

- This is a manual demo-support contract.
- It was not produced by `pbe acep ready`.
- It does not prove product code was implemented in this repository.
- It does not authorize note, tag, date, fuzzy, server-side, or saved search behavior.

## Selected Cycle Scope

| Category         | Nodes / Scope                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| Product          | `PT-SEARCH-001` Todo title search                                             |
| Project          | `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`                               |
| Work             | `WT-SEARCH-001` Implement Todo title search                                   |
| Tests            | `TT-SEARCH-001`, `TT-SEARCH-002`, `TT-SEARCH-003`                             |
| Evidence         | `EV-SEARCH-TEST`, `EV-SEARCH-REVIEW`                                          |
| Acceptance       | `AT-ROOT` accepted title-only slice                                           |
| Product Patch    | `PP-001` is proposed only; it is not included as implemented selected scope   |
| Change pressure  | `CH-001` note-content feedback requires user confirmation and impact handling |
| Demo result role | Evidence strengthening for runtime feasibility review                         |

## Foundation Scope

- `WT-ROOT` is a grouping/foundation node only.
- No additional foundation code work is inferred by this demo-support contract.
- Project root `PJ-ROOT` groups selected boundaries but does not authorize additional files.

## Deferred / Non-Scope

The following are deferred or out of scope for this selected cycle:

- tag filter
- date filter
- fuzzy search
- server-side search
- saved search
- note/description search until Product Patch `PP-001` is confirmed by the user

## Expected Files

- `src/todo-list.tsx`
- `src/todo-search.ts`

## Forbidden Files / Boundaries

- `src/tag-filter.ts`
- `src/server-search.ts`
- backend search API changes
- tag/date/fuzzy/server-side/saved search implementation
- note/description search implementation before confirmed Product Patch

## Required Checks And Evidence

| Check                                           | Required evidence                                           | Existing evidence snapshot                                                   |
| ----------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Title query filters visible todos by title.     | Automated test output                                       | `TT-SEARCH-001`, `EV-SEARCH-TEST`                                            |
| Empty query restores all todos.                 | Automated test output                                       | `TT-SEARCH-002`, `EV-SEARCH-TEST`                                            |
| No title match shows an empty result state.     | Manual review note or screenshot                            | `TT-SEARCH-003`, `EV-SEARCH-REVIEW`                                          |
| Search scope remains title-only for this cycle. | Static inspection / file-scope review                       | `work-tree.json`, this contract, `node-execution-contracts/wt-search-001.md` |
| Evidence freshness after note-content feedback. | Impact analysis and refreshed evidence or visible exception | `impact-tree.json`, `evidence-exceptions.md`                                 |

## Validation Commands

The selected-slice validation hint is:

```bash
npm test -- todo-search
```

The evidence snapshot records this command as already passed in `EV-SEARCH-TEST`, but this repository demo did not rerun
the product test. The command output remains an evidence snapshot, not fresh command output from this task.

## Stop / Change Rules

Stop and create or use a Change/Impact path if:

- search target expands from title-only to note/description, tag, date, fuzzy, server-side, or saved search
- forbidden files or boundaries are touched
- required test output or review note is missing
- evidence becomes stale after Product Patch confirmation
- user confirmation is required for Product Patch `PP-001`
- implementation discovers behavior outside the selected title-only scope

## Non-Promotion Statement

This contract is an execution-boundary evidence snapshot. It does not make Maintainability Graph the source model and
does not supersede Product, Project, Work, Test, Evidence, or Acceptance Trees.
