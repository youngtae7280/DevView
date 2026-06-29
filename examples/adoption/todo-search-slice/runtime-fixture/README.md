# Todo Search Runtime Fixture

Status: bounded representative evidence fixture

This fixture exists only to provide runnable Evidence for the `Todo Search Adoption + Product Meaning Feedback`
representative demo slice. It is not a Todo application scaffold, not PBE runtime implementation, not CLI/schema/model
work, and not Graph-source promotion.

## Linked Nodes

- Product: `PT-SEARCH-001`
- Work: `WT-SEARCH-001`
- Test: `TT-SEARCH-004`
- Evidence: `EV-SEARCH-NOTE-TEST`
- Product Patch: `PP-001`

## Selected Scope

- Search query matches Todo `title`.
- Search query matches Todo `note` or `content`.
- Repeated whitespace inside multi-word queries is normalized before matching.
- Blank query returns the full Todo list, matching `AC-SEARCH-002`.

## Non-Scope

- tag search
- date search
- fuzzy search
- server-side search
- saved search
- any behavior outside title + note/content query matching

## Command

```bash
npx vitest run examples/adoption/todo-search-slice/runtime-fixture
```

The command output is recorded in `../runtime-evidence.md` when refreshed.
